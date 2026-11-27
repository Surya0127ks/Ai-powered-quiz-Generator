using System.Net.Http.Headers;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.QuestionBank.DTOs;
using LMS.Domain.Enums;
using Microsoft.Extensions.Configuration;

namespace LMS.Infrastructure.Services;

public class GroqService : IGroqService
{
    private const int FreeTierBatchSize = 6;
    private const int MaxRateLimitWaitRetries = 1;

    private static readonly string[] DefaultModelCandidates =
    [
        "openai/gpt-oss-20b",
        "openai/gpt-oss-120b",
        "qwen/qwen3-32b",
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "meta-llama/llama-4-scout-17b-16e-instruct"
    ];

    private static readonly Regex RetryDelayRegex = new(
        @"(?:try again in|retry after)\s*(?<seconds>\d+(?:\.\d+)?)\s*(?:s|sec|seconds)?",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

    private readonly HttpClient _httpClient;
    private readonly string? _defaultApiKey;
    private readonly string _configuredModel;

    public GroqService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        var environmentApiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY");
        var configuredApiKey = configuration["Groq:ApiKey"];

        // appsettings.json contains an empty placeholder, so ?? alone would prevent
        // GROQ_API_KEY from ever being used. Prefer the explicit deployment secret.
        _defaultApiKey = !string.IsNullOrWhiteSpace(environmentApiKey)
            ? environmentApiKey.Trim()
            : configuredApiKey?.Trim();

        var envModel = Environment.GetEnvironmentVariable("GROQ_MODEL");
        var configuredModel = configuration["Groq:Model"];
        _configuredModel = !string.IsNullOrWhiteSpace(envModel)
            ? envModel.Trim()
            : (!string.IsNullOrWhiteSpace(configuredModel) ? configuredModel.Trim() : DefaultModelCandidates[0]);
    }

    public async Task<Result<List<GeneratedQuestionDto>>> GenerateQuestionsAsync(
        string topic,
        string? subTopic,
        int count,
        string? difficulty,
        string? customApiKey = null,
        CancellationToken cancellationToken = default)
    {
        // Free-tier Groq limit: cap at 30 questions to avoid token exhaustion
        if (count is < 1 or > 30)
        {
            return Result.Failure<List<GeneratedQuestionDto>>("Question count must be between 1 and 30 (Groq free-tier limit).");
        }

        string apiKey = !string.IsNullOrWhiteSpace(customApiKey) ? customApiKey.Trim() : (_defaultApiKey ?? string.Empty);
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return Result.Failure<List<GeneratedQuestionDto>>(
                "Groq API Key is not configured. Set GROQ_API_KEY in backend environment variables or enter your own Groq key (gsk_...).");
        }

        var modelPool = BuildInitialModelPool();
        var modelIndex = 0;
        var discoveredExtraModels = false;

        var questions = new List<GeneratedQuestionDto>(count);
        var seenQuestionStems = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var remaining = count;
        while (remaining > 0)
        {
            var batchSize = Math.Min(FreeTierBatchSize, remaining);
            var completedBatch = new List<GeneratedQuestionDto>(batchSize);

            for (var attempt = 0; attempt < 3 && completedBatch.Count < batchSize; attempt++)
            {
                var missingCount = batchSize - completedBatch.Count;
                var previousQuestions = questions
                    .Concat(completedBatch)
                    .Select(q => TruncateStem(q.QuestionText, 85))
                    .TakeLast(8)
                    .ToArray();

                var batch = await GenerateBatchWithFallbackAsync(
                    topic,
                    subTopic,
                    missingCount,
                    difficulty,
                    apiKey,
                    previousQuestions,
                    modelPool,
                    () => modelIndex,
                    idx => modelIndex = idx,
                    () => discoveredExtraModels,
                    () => discoveredExtraModels = true,
                    cancellationToken);

                if (!batch.IsSuccess || batch.Value is null)
                {
                    if (questions.Count + completedBatch.Count > 0)
                    {
                        return Result.Failure<List<GeneratedQuestionDto>>(
                            $"Generated {questions.Count + completedBatch.Count} of {count} questions before AI generation stopped. {batch.Error ?? "Retry generation after the provider limit resets."}");
                    }

                    return Result.Failure<List<GeneratedQuestionDto>>(
                        batch.Error ?? "Groq AI could not generate questions right now. Please retry in a moment.");
                }

                foreach (var question in batch.Value)
                {
                    if (completedBatch.Count == batchSize)
                    {
                        break;
                    }

                    var stem = NormalizeQuestionStem(question.QuestionText);
                    if (!string.IsNullOrWhiteSpace(stem) && seenQuestionStems.Add(stem))
                    {
                        completedBatch.Add(question);
                    }
                }
            }

            if (completedBatch.Count != batchSize)
            {
                return Result.Failure<List<GeneratedQuestionDto>>(
                    $"AI returned {completedBatch.Count} of {batchSize} distinct questions for this batch. Click Retry or try a smaller question count.");
            }

            questions.AddRange(completedBatch);
            remaining -= batchSize;
        }

        return Result.Success(questions);
    }

    private List<string> BuildInitialModelPool()
    {
        var list = new List<string> { _configuredModel };
        foreach (var candidate in DefaultModelCandidates)
        {
            if (!list.Contains(candidate, StringComparer.OrdinalIgnoreCase))
            {
                list.Add(candidate);
            }
        }
        return list;
    }

    private static string TruncateStem(string text, int maxLength)
    {
        var cleaned = string.Join(' ', (text ?? string.Empty).Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
        return cleaned.Length <= maxLength ? cleaned : cleaned[..maxLength];
    }

    private static string NormalizeQuestionStem(string questionText) =>
        string.Join(' ', questionText.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries))
            .Trim()
            .ToUpperInvariant();

    private async Task<Result<List<GeneratedQuestionDto>>> GenerateBatchWithFallbackAsync(
        string topic,
        string? subTopic,
        int count,
        string? difficulty,
        string apiKey,
        IReadOnlyCollection<string> previousQuestions,
        List<string> modelPool,
        Func<int> getModelIndex,
        Action<int> setModelIndex,
        Func<bool> getDiscoveredExtra,
        Action markDiscoveredExtra,
        CancellationToken cancellationToken)
    {
        var unavailableModels = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var rateLimitHits = new Dictionary<string, TimeSpan>(StringComparer.OrdinalIgnoreCase);
        string? lastError = null;

        for (var rateWaitPass = 0; rateWaitPass <= MaxRateLimitWaitRetries; rateWaitPass++)
        {
            var startIdx = Math.Clamp(getModelIndex(), 0, Math.Max(0, modelPool.Count - 1));
            for (var offset = 0; offset < modelPool.Count; offset++)
            {
                var idx = (startIdx + offset) % modelPool.Count;
                var model = modelPool[idx];
                if (unavailableModels.Contains(model))
                {
                    continue;
                }

                var attemptResult = await SendSingleBatchRequestAsync(
                    model,
                    topic,
                    subTopic,
                    count,
                    difficulty,
                    apiKey,
                    previousQuestions,
                    useJsonObjectFormat: true,
                    cancellationToken);

                if (attemptResult.Outcome == BatchCallOutcome.Success && attemptResult.Questions is { Count: > 0 })
                {
                    setModelIndex(idx);
                    return Result.Success(attemptResult.Questions);
                }

                lastError = attemptResult.ErrorMessage;

                if (attemptResult.Outcome == BatchCallOutcome.AuthFailure)
                {
                    return Result.Failure<List<GeneratedQuestionDto>>(attemptResult.ErrorMessage!);
                }

                if (attemptResult.Outcome == BatchCallOutcome.ModelUnavailable)
                {
                    unavailableModels.Add(model);

                    // Try discovering live text models from Groq /openai/v1/models once if a static model is unavailable
                    if (!getDiscoveredExtra())
                    {
                        markDiscoveredExtra();
                        var liveModels = await DiscoverActiveModelsAsync(apiKey, cancellationToken);
                        foreach (var live in liveModels)
                        {
                            if (!modelPool.Contains(live, StringComparer.OrdinalIgnoreCase))
                            {
                                modelPool.Add(live);
                            }
                        }
                    }

                    continue;
                }

                if (attemptResult.Outcome == BatchCallOutcome.RateLimited)
                {
                    rateLimitHits[model] = attemptResult.RetryAfter ?? TimeSpan.FromSeconds(10);
                    continue;
                }

                // Unsupported json_object / parameter issue on a non-primary model -> retry same model once without json_object wrapper
                if (attemptResult.Outcome == BatchCallOutcome.BadRequestOrInvalidOutput)
                {
                    var plainRetry = await SendSingleBatchRequestAsync(
                        model,
                        topic,
                        subTopic,
                        count,
                        difficulty,
                        apiKey,
                        previousQuestions,
                        useJsonObjectFormat: false,
                        cancellationToken);

                    if (plainRetry.Outcome == BatchCallOutcome.Success && plainRetry.Questions is { Count: > 0 })
                    {
                        setModelIndex(idx);
                        return Result.Success(plainRetry.Questions);
                    }

                    lastError = plainRetry.ErrorMessage ?? lastError;
                }
            }

            // If we got rate limited on all remaining models, wait briefly on the shortest delay and retry once
            if (rateWaitPass < MaxRateLimitWaitRetries && rateLimitHits.Count > 0)
            {
                var shortestWait = rateLimitHits.Values.Min();
                if (shortestWait <= TimeSpan.FromSeconds(25))
                {
                    await Task.Delay(shortestWait, cancellationToken);
                    rateLimitHits.Clear();
                    continue;
                }
            }

            break;
        }

        return Result.Failure<List<GeneratedQuestionDto>>(
            lastError ?? "Groq AI is currently busy on the free tier. Please wait a few seconds and retry.");
    }

    private async Task<BatchCallResult> SendSingleBatchRequestAsync(
        string model,
        string topic,
        string? subTopic,
        int count,
        string? difficulty,
        string apiKey,
        IReadOnlyCollection<string> previousQuestions,
        bool useJsonObjectFormat,
        CancellationToken cancellationToken)
    {
        string topicFull = string.IsNullOrWhiteSpace(subTopic) ? topic : $"{topic} - {subTopic}";
        string diff = string.IsNullOrWhiteSpace(difficulty) ? "Mixed" : difficulty;
        int targetCount = count > 0 ? count : 5;

        const string systemPrompt =
            """
            You generate educational MCQs. Output ONLY valid JSON matching:
            {"questions":[{"questionText":"...","type":"SingleChoice"|"TrueFalse","points":1,"tag":"1-2 word tag","explanation":"why right and why others wrong","options":[{"optionText":"...","isCorrect":boolean}]}]}
            Rules:
            - Strictly match requested difficulty (Easy=basic concepts/definitions, Medium=applied understanding, Hard=deep scenarios/edge cases, Mixed=30% Easy / 40% Medium / 30% Hard).
            - SingleChoice: exactly 4 options with exactly 1 isCorrect=true. TrueFalse: "True" and "False" with 1 isCorrect=true.
            - Programming/CS: include code snippets, output prediction, syntax, and best-practice questions.
            - Every question and answer must be factually verified. Output raw JSON only.
            """;

        string difficultyInstruction = diff switch
        {
            "Easy" => "Difficulty: EASY ONLY (beginner recall & basic concepts).",
            "Hard" => "Difficulty: HARD ONLY (advanced analysis, subtle edge cases & deep reasoning).",
            "Mixed" => "Difficulty: MIXED (balanced Easy, Medium, and Hard).",
            _ => "Difficulty: MEDIUM ONLY (applied understanding & problem solving)."
        };

        string focusInstruction = string.Empty;
        if (ContainsAny(topicFull, "UPSC", "SSC", "Banking", "IBPS", "SBI", "Railways", "RRB", "Defence", "NDA", "CDS", "CTET", "Govt", "Government", "Civil Services", "NEET", "JEE"))
        {
            focusInstruction = "\nExam style: Follow real competitive exam / PYQ depth with assertion-reasoning or statement options where relevant.";
        }
        else if (ContainsAny(topicFull, "Python", "JavaScript", "Java ", "C#", "C++", "TypeScript", "React", "Angular", "Node", "SQL", "Database", "Algorithm", "Data Structure", "OOP", "Programming", "Software", "Computer Science", "Web Development", "Machine Learning", "Cloud", "REST API", "Git", "Docker"))
        {
            focusInstruction = "\nCS/Programming focus: Mix code-output prediction, syntax, algorithms, and debugging scenarios.";
        }

        var uniquenessInstruction = previousQuestions.Count > 0
            ? $"\nAvoid repeating: {string.Join(" | ", previousQuestions)}"
            : string.Empty;

        var userPrompt = $"Generate exactly {targetCount} unique questions on: '{topicFull}'. {difficultyInstruction}{focusInstruction}{uniquenessInstruction}";

        // Keep payload compatible with each Groq model family while avoiding hidden-reasoning token exhaustion on free tier (8k TPM)
        bool isGptOss = model.StartsWith("openai/gpt-oss", StringComparison.OrdinalIgnoreCase);
        bool isQwenReasoning = model.Contains("qwen3", StringComparison.OrdinalIgnoreCase);
        int tokenBudget = isGptOss
            ? Math.Clamp(targetCount * 420 + 400, 1400, 3200)
            : Math.Clamp(targetCount * 320 + 250, 1000, 2600);

        var payload = new Dictionary<string, object>
        {
            ["model"] = model,
            ["messages"] = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            },
            ["temperature"] = 0.65,
            ["max_completion_tokens"] = tokenBudget
        };

        if (useJsonObjectFormat)
        {
            payload["response_format"] = new { type = "json_object" };
        }

        if (isGptOss)
        {
            payload["reasoning_effort"] = "low";
        }
        else if (isQwenReasoning)
        {
            payload["reasoning_format"] = "hidden";
        }

        var jsonContent = JsonSerializer.Serialize(payload);

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            string responseString = await response.Content.ReadAsStringAsync(cancellationToken);

            if (response.StatusCode == HttpStatusCode.TooManyRequests)
            {
                var delay = GetRateLimitDelay(response, responseString);
                return new BatchCallResult(
                    BatchCallOutcome.RateLimited,
                    null,
                    $"Groq free tier rate limit reached on {model}. Retry in {Math.Ceiling(delay.TotalSeconds)}s (or try a smaller question count).",
                    delay);
            }

            if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
            {
                return new BatchCallResult(
                    BatchCallOutcome.AuthFailure,
                    null,
                    "Groq rejected the API key (invalid or expired key). Check GROQ_API_KEY or enter a valid 'gsk_' key.");
            }

            var providerError = ExtractGroqErrorMessage(responseString);
            if (!response.IsSuccessStatusCode)
            {
                bool isMissingModel = response.StatusCode == HttpStatusCode.NotFound ||
                    (!string.IsNullOrEmpty(providerError) &&
                     (providerError.Contains("decommissioned", StringComparison.OrdinalIgnoreCase) ||
                      providerError.Contains("model_not_found", StringComparison.OrdinalIgnoreCase) ||
                      providerError.Contains("does not exist", StringComparison.OrdinalIgnoreCase) ||
                      providerError.Contains("not found", StringComparison.OrdinalIgnoreCase) ||
                      providerError.Contains("do not have access", StringComparison.OrdinalIgnoreCase)));

                if (isMissingModel)
                {
                    return new BatchCallResult(
                        BatchCallOutcome.ModelUnavailable,
                        null,
                        $"Model '{model}' is not available on this Groq tier ({providerError ?? "unavailable"}).");
                }

                return new BatchCallResult(
                    BatchCallOutcome.BadRequestOrInvalidOutput,
                    null,
                    !string.IsNullOrWhiteSpace(providerError)
                        ? $"Groq error ({model}): {providerError}"
                        : $"Groq request failed (HTTP {(int)response.StatusCode}). Please retry.");
            }

            using var doc = JsonDocument.Parse(responseString);
            var root = doc.RootElement;
            if (!root.TryGetProperty("choices", out var choices) || choices.GetArrayLength() == 0)
            {
                return new BatchCallResult(BatchCallOutcome.BadRequestOrInvalidOutput, null, "Groq returned no choices. Click Retry.");
            }

            var firstChoice = choices[0];
            string contentText = firstChoice.TryGetProperty("message", out var msg) &&
                                 msg.TryGetProperty("content", out var contentProp)
                ? (contentProp.GetString() ?? string.Empty)
                : string.Empty;

            contentText = CleanJsonText(contentText);

            var questions = ParseGroqJsonResponse(contentText);
            if (questions == null || questions.Count == 0)
            {
                return new BatchCallResult(
                    BatchCallOutcome.BadRequestOrInvalidOutput,
                    null,
                    $"Groq ({model}) returned an incomplete response. Retrying or choosing fewer questions helps on free tier.");
            }

            return new BatchCallResult(BatchCallOutcome.Success, questions, null);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return new BatchCallResult(
                BatchCallOutcome.RateLimited,
                null,
                "Groq request timed out. Retrying with another free-tier model.",
                TimeSpan.FromSeconds(2));
        }
        catch (Exception ex)
        {
            return new BatchCallResult(
                BatchCallOutcome.BadRequestOrInvalidOutput,
                null,
                $"AI generation failed ({ex.GetType().Name}). Click Retry to try again.");
        }
    }

    private async Task<List<string>> DiscoverActiveModelsAsync(string apiKey, CancellationToken cancellationToken)
    {
        var discovered = new List<string>();
        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Get, "https://api.groq.com/openai/v1/models");
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            using var resp = await _httpClient.SendAsync(req, cancellationToken);
            if (!resp.IsSuccessStatusCode)
            {
                return discovered;
            }

            var raw = await resp.Content.ReadAsStringAsync(cancellationToken);
            using var doc = JsonDocument.Parse(raw);
            if (!doc.RootElement.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Array)
            {
                return discovered;
            }

            foreach (var item in data.EnumerateArray())
            {
                if (!item.TryGetProperty("id", out var idProp))
                {
                    continue;
                }

                var id = idProp.GetString()?.Trim();
                if (string.IsNullOrWhiteSpace(id))
                {
                    continue;
                }

                // Skip non-text / audio / speech / safety-guard models
                if (ContainsAny(id, "whisper", "tts", "orpheus", "guard", "safeguard", "playai"))
                {
                    continue;
                }

                discovered.Add(id);
            }
        }
        catch
        {
            // Ignore discovery errors cleanly
        }

        return discovered;
    }

    private static bool ContainsAny(string text, params string[] terms)
    {
        foreach (var term in terms)
        {
            if (text.Contains(term, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }
        return false;
    }

    private static string? ExtractGroqErrorMessage(string responseBody)
    {
        if (string.IsNullOrWhiteSpace(responseBody))
        {
            return null;
        }

        try
        {
            using var doc = JsonDocument.Parse(responseBody);
            if (doc.RootElement.TryGetProperty("error", out var errObj) &&
                errObj.TryGetProperty("message", out var msgProp))
            {
                var msg = msgProp.GetString()?.Trim();
                if (!string.IsNullOrWhiteSpace(msg))
                {
                    return msg.Length <= 220 ? msg : msg[..220];
                }
            }
        }
        catch
        {
            // Non-JSON response
        }

        return null;
    }

    private static TimeSpan GetRateLimitDelay(HttpResponseMessage response, string responseBody)
    {
        if (response.Headers.RetryAfter?.Delta is { } retryAfterDelta)
        {
            return ClampRateLimitDelay(retryAfterDelta);
        }

        if (response.Headers.RetryAfter?.Date is { } retryAfterDate)
        {
            return ClampRateLimitDelay(retryAfterDate - DateTimeOffset.UtcNow);
        }

        var match = RetryDelayRegex.Match(responseBody);
        if (match.Success && double.TryParse(
                match.Groups["seconds"].Value,
                System.Globalization.NumberStyles.Float,
                System.Globalization.CultureInfo.InvariantCulture,
                out var seconds))
        {
            return ClampRateLimitDelay(TimeSpan.FromSeconds(seconds));
        }

        return TimeSpan.FromSeconds(12);
    }

    private static TimeSpan ClampRateLimitDelay(TimeSpan delay) =>
        TimeSpan.FromSeconds(Math.Clamp(Math.Ceiling(delay.TotalSeconds), 1, 60));

    private static string CleanJsonText(string raw)
    {
        string trimmed = (raw ?? string.Empty).Trim();
        if (trimmed.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
        {
            trimmed = trimmed[7..];
        }
        else if (trimmed.StartsWith("```", StringComparison.OrdinalIgnoreCase))
        {
            trimmed = trimmed[3..];
        }

        if (trimmed.EndsWith("```", StringComparison.OrdinalIgnoreCase))
        {
            trimmed = trimmed[..^3];
        }

        trimmed = trimmed.Trim();

        // Extract top-level JSON object or array if the model added surrounding notes
        int firstBrace = trimmed.IndexOf('{');
        int firstBracket = trimmed.IndexOf('[');
        if (firstBrace >= 0 && (firstBracket < 0 || firstBrace < firstBracket))
        {
            int lastBrace = trimmed.LastIndexOf('}');
            if (lastBrace > firstBrace)
            {
                return trimmed[firstBrace..(lastBrace + 1)];
            }
        }
        else if (firstBracket >= 0)
        {
            int lastBracket = trimmed.LastIndexOf(']');
            if (lastBracket > firstBracket)
            {
                return trimmed[firstBracket..(lastBracket + 1)];
            }
        }

        return trimmed;
    }

    private static List<GeneratedQuestionDto>? ParseGroqJsonResponse(string jsonText)
    {
        if (string.IsNullOrWhiteSpace(jsonText))
        {
            return null;
        }

        try
        {
            using var doc = JsonDocument.Parse(jsonText);
            var root = doc.RootElement;

            JsonElement questionsArray;
            if (root.ValueKind == JsonValueKind.Array)
            {
                questionsArray = root;
            }
            else if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty("questions", out questionsArray) &&
                     questionsArray.ValueKind == JsonValueKind.Array)
            {
                // Standard schema
            }
            else
            {
                return null;
            }

            var result = new List<GeneratedQuestionDto>();
            foreach (var qEl in questionsArray.EnumerateArray())
            {
                if (qEl.ValueKind != JsonValueKind.Object)
                {
                    continue;
                }

                string? text = qEl.TryGetProperty("questionText", out var qtProp) ? qtProp.GetString() : null;
                if (string.IsNullOrWhiteSpace(text) && qEl.TryGetProperty("question", out var qAltProp))
                {
                    text = qAltProp.GetString();
                }

                if (string.IsNullOrWhiteSpace(text))
                {
                    continue;
                }

                string typeStr = qEl.TryGetProperty("type", out var tProp) ? tProp.GetString() ?? "SingleChoice" : "SingleChoice";
                QuestionType qType = typeStr.Equals("TrueFalse", StringComparison.OrdinalIgnoreCase) ? QuestionType.TrueFalse : QuestionType.SingleChoice;

                int pts = 1;
                if (qEl.TryGetProperty("points", out var pProp))
                {
                    if (pProp.ValueKind == JsonValueKind.Number && pProp.TryGetInt32(out var intPts) && intPts > 0)
                    {
                        pts = intPts;
                    }
                    else if (pProp.ValueKind == JsonValueKind.Number && pProp.TryGetDouble(out var dblPts) && dblPts >= 1)
                    {
                        pts = (int)Math.Round(dblPts);
                    }
                }

                string? exp = qEl.TryGetProperty("explanation", out var eProp) ? eProp.GetString() : null;
                string? tag = qEl.TryGetProperty("tag", out var tagProp) ? LMS.Domain.Entities.QuizQuestion.NormalizeTag(tagProp.GetString()) : null;

                var options = new List<GeneratedQuestionOptionDto>();
                if (qEl.TryGetProperty("options", out var optsEl) && optsEl.ValueKind == JsonValueKind.Array)
                {
                    foreach (var oEl in optsEl.EnumerateArray())
                    {
                        if (oEl.ValueKind != JsonValueKind.Object)
                        {
                            continue;
                        }

                        string? oText = oEl.TryGetProperty("optionText", out var otProp) ? otProp.GetString() : null;
                        if (string.IsNullOrWhiteSpace(oText) && oEl.TryGetProperty("text", out var altOptProp))
                        {
                            oText = altOptProp.GetString();
                        }

                        if (string.IsNullOrWhiteSpace(oText))
                        {
                            continue;
                        }

                        bool isCorr = false;
                        if (oEl.TryGetProperty("isCorrect", out var cProp))
                        {
                            isCorr = cProp.ValueKind switch
                            {
                                JsonValueKind.True => true,
                                JsonValueKind.False => false,
                                JsonValueKind.String => bool.TryParse(cProp.GetString(), out var parsedBool) && parsedBool,
                                _ => false
                            };
                        }

                        options.Add(new GeneratedQuestionOptionDto(oText.Trim(), isCorr));
                    }
                }

                if (options.Count < 2)
                {
                    continue;
                }

                result.Add(new GeneratedQuestionDto(text.Trim(), qType, pts, exp, options, tag));
            }

            return result;
        }
        catch
        {
            return null;
        }
    }

    private enum BatchCallOutcome
    {
        Success,
        RateLimited,
        ModelUnavailable,
        AuthFailure,
        BadRequestOrInvalidOutput
    }

    private sealed record BatchCallResult(
        BatchCallOutcome Outcome,
        List<GeneratedQuestionDto>? Questions,
        string? ErrorMessage,
        TimeSpan? RetryAfter = null
    );
}
