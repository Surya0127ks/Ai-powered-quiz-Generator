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
    private const int MaxRateLimitRetries = 2;
    private static readonly Regex RetryDelayRegex = new(
        @"(?:try again in|retry after)\s*(?<seconds>\d+(?:\.\d+)?)\s*(?:s|sec|seconds)?",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

    private readonly HttpClient _httpClient;
    private readonly string? _defaultApiKey;

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

        var questions = new List<GeneratedQuestionDto>(count);
        var seenQuestionStems = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var remaining = count;
        while (remaining > 0)
        {
            var batchSize = Math.Min(10, remaining);
            var completedBatch = new List<GeneratedQuestionDto>(batchSize);

            // LLMs occasionally return one or two fewer questions than requested.
            // Ask only for the missing items so a 50-question quiz doesn't fail at 49.
            for (var attempt = 0; attempt < 3 && completedBatch.Count < batchSize; attempt++)
            {
                var missingCount = batchSize - completedBatch.Count;
                var previousQuestions = questions
                    .Concat(completedBatch)
                    .Select(question => question.QuestionText)
                    .TakeLast(16)
                    .ToArray();

                var batch = await GenerateBatchAsync(
                    topic,
                    subTopic,
                    missingCount,
                    difficulty,
                    customApiKey,
                    previousQuestions,
                    cancellationToken);

                if (!batch.IsSuccess || batch.Value is null)
                {
                    return Result.Failure<List<GeneratedQuestionDto>>(
                        $"Generated {questions.Count + completedBatch.Count} of {count} questions before AI generation stopped. {batch.Error ?? "Retry generation after the provider limit resets."}");
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
                    $"AI returned {completedBatch.Count} of {batchSize} distinct questions for this batch after 3 attempts. Retry generation or choose a smaller question count.");
            }

            questions.AddRange(completedBatch);
            remaining -= batchSize;
        }

        return Result.Success(questions);
    }

    private static string NormalizeQuestionStem(string questionText) =>
        string.Join(' ', questionText.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries))
            .Trim()
            .ToUpperInvariant();

    private async Task<Result<List<GeneratedQuestionDto>>> GenerateBatchAsync(
        string topic,
        string? subTopic,
        int count,
        string? difficulty,
        string? customApiKey = null,
        IReadOnlyCollection<string>? previousQuestions = null,
        CancellationToken cancellationToken = default)
    {
        string apiKey = !string.IsNullOrWhiteSpace(customApiKey) ? customApiKey.Trim() : (_defaultApiKey ?? string.Empty);

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return Result.Failure<List<GeneratedQuestionDto>>(
                "Groq API Key is not configured. Please provide a valid Groq API key (starts with 'gsk_') to generate questions using AI.");
        }

        string topicFull = string.IsNullOrWhiteSpace(subTopic) ? topic : $"{topic} - {subTopic}";
        string diff = string.IsNullOrWhiteSpace(difficulty) ? "Mixed" : difficulty;
        int targetCount = count > 0 ? count : 5;

        var systemPrompt = @"You are an expert educational quiz generator specializing in programming, computer science, and software engineering. Output ONLY a valid JSON object matching this schema exactly, with NO markdown, NO code blocks, NO extra text before or after:
{
  ""questions"": [
    {
      ""questionText"": ""string"",
      ""type"": ""SingleChoice"" or ""TrueFalse"",
      ""points"": 1,
      ""explanation"": ""string explaining correct answer clearly and concisely"",
      ""options"": [
        { ""optionText"": ""string"", ""isCorrect"": boolean }
      ]
    }
  ]
}
STRICT REQUIREMENTS:
- Generate ACCURATE, factually correct questions. Zero tolerance for wrong answers marked correct.
- DIFFICULTY RULE (MANDATORY): If the user says Easy → generate ONLY easy beginner questions. If the user says Medium → generate ONLY medium intermediate questions. If the user says Hard → generate ONLY hard advanced questions. If Mixed → generate a balanced spread. DO NOT mix difficulty levels unless explicitly asked for Mixed.
- For programming/CS topics: include code snippets, syntax questions, algorithm logic, output prediction, and best-practice scenarios.
- For SingleChoice: provide EXACTLY 4 options with EXACTLY 1 option having isCorrect = true. Wrong options must be plausible but clearly incorrect.
- For TrueFalse: provide EXACTLY 2 options (""True"" and ""False"") with exactly 1 having isCorrect = true.
- Write questions in clear, professional English suitable for students and educators.
- Explanation must be specific: clearly state WHY the correct answer is right and why the wrong options are wrong.
- PRIVACY: Never generate questions containing personal data, real identifiable individuals (unless historical public figures), or sensitive information.
- Return ONLY raw JSON — no other text whatsoever.";

        // Build a precise difficulty-aware user prompt
        string difficultyInstruction = diff switch
        {
            "Easy" => "DIFFICULTY LEVEL: EASY (STRICTLY ENFORCE THIS)\nGenerate ONLY beginner-level questions. Focus on basic definitions, syntax, simple recall, and foundational concepts. A student who just started learning should be able to answer these. No complex scenarios or multi-step logic.",
            "Hard" => "DIFFICULTY LEVEL: HARD (STRICTLY ENFORCE THIS)\nGenerate ONLY advanced expert-level questions. Focus on deep analysis, complex algorithms, subtle language behaviors, performance trade-offs, edge cases, and architecture decisions. These should challenge even experienced developers or domain experts.",
            "Mixed" => "DIFFICULTY LEVEL: MIXED\nGenerate a balanced mix: roughly 30% Easy (basic recall/definitions), 40% Medium (applied understanding and problem-solving), 30% Hard (advanced analysis/edge cases/expert knowledge).",
            _ => "DIFFICULTY LEVEL: MEDIUM (STRICTLY ENFORCE THIS)\nGenerate ONLY intermediate-level questions. Test understanding and application of concepts, not just surface recall. The student should need to think and apply knowledge — not just remember a definition."
        };

        string examInstruction = "";
        if (topicFull.Contains("UPSC", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("SSC", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("Banking", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("IBPS", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("SBI", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("Railways", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("RRB", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("Defence", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("NDA", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("CDS", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("CTET", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("Govt", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("Government", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("Civil Services", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("NEET", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("JEE", StringComparison.OrdinalIgnoreCase))
        {
            examInstruction = "\nCOMPETITIVE / GOVT EXAM FOCUS: Structure questions according to real examination standards (e.g. Previous Year Question depth, assertion-reasoning, statement evaluations like 'Which of the following is/are correct?', standard official terminology, and detailed pedagogical explanations).";
        }

        // Programming / CS / Software Engineering focus
        bool isProgrammingTopic =
            topicFull.Contains("Python", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("JavaScript", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("Java ", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("C#", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("C++", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("TypeScript", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("React", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("Angular", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("Node", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("SQL", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("Database", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("Algorithm", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("Data Structure", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("OOP", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("Programming", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("Software", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("Computer Science", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("Web Development", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("Machine Learning", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("Cloud", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("REST API", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("Git", StringComparison.OrdinalIgnoreCase) ||
            topicFull.Contains("Docker", StringComparison.OrdinalIgnoreCase);

        if (isProgrammingTopic)
        {
            examInstruction += "\nPROGRAMMING / CS FOCUS: Include a mix of code-output prediction questions (show a code snippet and ask what it outputs), syntax questions, conceptual theory questions, and best-practice scenarios. Code snippets must be formatted as plain text. Answers must be 100% technically accurate — wrong answers about code behavior are unacceptable.";
        }

        var uniquenessInstruction = previousQuestions is { Count: > 0 }
            ? $"\nDo not repeat or paraphrase these earlier question stems: {string.Join(" | ", previousQuestions)}."
            : string.Empty;
        var userPrompt = $"Generate exactly {targetCount} quiz questions for the topic: '{topicFull}'.\n{difficultyInstruction}{examInstruction}{uniquenessInstruction}\nEnsure all questions are factually accurate and the explanation clearly justifies why the correct answer is right and why the wrong options are incorrect.";


        var requestBody = new
        {
            model = "openai/gpt-oss-20b",
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            },
            temperature = 0.7,
            // Keep the reserved completion budget proportional to the batch size.
            // The provider counts prompt and completion tokens against TPM limits.
            max_tokens = Math.Min(4096, Math.Max(1024, targetCount * 300)),
            response_format = new { type = "json_object" }
        };

        var jsonContent = JsonSerializer.Serialize(requestBody);

        try
        {
            for (var rateLimitAttempt = 0; rateLimitAttempt <= MaxRateLimitRetries; rateLimitAttempt++)
            {
                using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                request.Content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                using var response = await _httpClient.SendAsync(request, cancellationToken);
                string responseString = await response.Content.ReadAsStringAsync(cancellationToken);

                if (response.StatusCode == HttpStatusCode.TooManyRequests)
                {
                    var retryDelay = GetRateLimitDelay(response, responseString);
                    if (rateLimitAttempt < MaxRateLimitRetries)
                    {
                        await Task.Delay(retryDelay, cancellationToken);
                        continue;
                    }

                    return Result.Failure<List<GeneratedQuestionDto>>(
                        $"Groq reached its temporary rate limit. Please try again in {Math.Ceiling(retryDelay.TotalSeconds)}s.");
                }

                if (!response.IsSuccessStatusCode)
                {
                    var safeMessage = response.StatusCode switch
                    {
                        HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden =>
                            "Groq rejected the backend API key or its model access. Check GROQ_API_KEY in the backend host settings.",
                        HttpStatusCode.BadRequest =>
                            "Groq rejected the generation request. Try a shorter topic or a smaller question batch.",
                        _ => $"Groq AI request failed (HTTP {(int)response.StatusCode}). Please retry in a moment."
                    };

                    return Result.Failure<List<GeneratedQuestionDto>>(safeMessage);
                }

                using var doc = JsonDocument.Parse(responseString);
                var root = doc.RootElement;
                if (!root.TryGetProperty("choices", out var choices) || choices.GetArrayLength() == 0)
                {
                    return Result.Failure<List<GeneratedQuestionDto>>("Groq AI returned an empty response. Please retry.");
                }

                string contentText = choices[0].GetProperty("message").GetProperty("content").GetString() ?? string.Empty;
                contentText = CleanJsonText(contentText);

                var questions = ParseGroqJsonResponse(contentText);
                if (questions == null || questions.Count == 0)
                {
                    return Result.Failure<List<GeneratedQuestionDto>>("Groq AI returned an invalid response. Click Retry to try again.");
                }

                return Result.Success(questions);
            }

            return Result.Failure<List<GeneratedQuestionDto>>("Groq AI is temporarily unavailable. Please retry in a moment.");
        }
        catch (Exception ex)
        {
            return Result.Failure<List<GeneratedQuestionDto>>($"AI question generation failed ({ex.GetType().Name}). Click Retry to try again.");
        }
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

        return TimeSpan.FromSeconds(15);
    }

    private static TimeSpan ClampRateLimitDelay(TimeSpan delay) =>
        TimeSpan.FromSeconds(Math.Clamp(Math.Ceiling(delay.TotalSeconds), 1, 90));

    private static string CleanJsonText(string raw)
    {
        string trimmed = raw.Trim();
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

        return trimmed.Trim();
    }

    private static List<GeneratedQuestionDto>? ParseGroqJsonResponse(string jsonText)
    {
        try
        {
            using var doc = JsonDocument.Parse(jsonText);
            var root = doc.RootElement;

            JsonElement questionsArray;
            if (root.ValueKind == JsonValueKind.Array)
            {
                questionsArray = root;
            }
            else if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty("questions", out questionsArray))
            {
                // Has questions property
            }
            else
            {
                return null;
            }

            var result = new List<GeneratedQuestionDto>();
            foreach (var qEl in questionsArray.EnumerateArray())
            {
                string text = qEl.GetProperty("questionText").GetString() ?? "Question";
                string typeStr = qEl.TryGetProperty("type", out var tProp) ? tProp.GetString() ?? "SingleChoice" : "SingleChoice";
                QuestionType qType = typeStr.Equals("TrueFalse", StringComparison.OrdinalIgnoreCase) ? QuestionType.TrueFalse : QuestionType.SingleChoice;
                int pts = qEl.TryGetProperty("points", out var pProp) ? pProp.GetInt32() : 1;
                string? exp = qEl.TryGetProperty("explanation", out var eProp) ? eProp.GetString() : null;

                var options = new List<GeneratedQuestionOptionDto>();
                if (qEl.TryGetProperty("options", out var optsEl))
                {
                    foreach (var oEl in optsEl.EnumerateArray())
                    {
                        string oText = oEl.GetProperty("optionText").GetString() ?? "";
                        bool isCorr = oEl.GetProperty("isCorrect").GetBoolean();
                        options.Add(new GeneratedQuestionOptionDto(oText, isCorr));
                    }
                }

                result.Add(new GeneratedQuestionDto(text, qType, pts, exp, options));
            }

            return result;
        }
        catch
        {
            return null;
        }
    }
}
