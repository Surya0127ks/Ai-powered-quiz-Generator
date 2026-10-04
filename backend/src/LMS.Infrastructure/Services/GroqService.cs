using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.QuestionBank.DTOs;
using LMS.Domain.Enums;
using Microsoft.Extensions.Configuration;

namespace LMS.Infrastructure.Services;

public class GroqService : IGroqService
{
    private readonly HttpClient _httpClient;
    private readonly string? _defaultApiKey;

    public GroqService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _defaultApiKey = configuration["Groq:ApiKey"] ?? Environment.GetEnvironmentVariable("GROQ_API_KEY");
    }

    public async Task<Result<List<GeneratedQuestionDto>>> GenerateQuestionsAsync(
        string topic,
        string? subTopic,
        int count,
        string? difficulty,
        string? customApiKey = null,
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

        var systemPrompt = @"You are an expert educational quiz generator for an AI assessment platform. Output ONLY a valid JSON object matching this schema exactly, with NO markdown, NO code blocks, NO extra text before or after:
{
  ""questions"": [
    {
      ""questionText"": ""string"",
      ""type"": ""SingleChoice"" or ""TrueFalse"",
      ""points"": 1,
      ""explanation"": ""string explaining correct answer clearly"",
      ""options"": [
        { ""optionText"": ""string"", ""isCorrect"": boolean }
      ]
    }
  ]
}
STRICT REQUIREMENTS:
- Generate ACCURATE, educationally sound questions. Never include trick questions.
- For SingleChoice: provide EXACTLY 4 options with EXACTLY 1 option having isCorrect = true. All wrong options must be plausible but clearly incorrect.
- For TrueFalse: provide EXACTLY 2 options (""True"" and ""False"") with exactly 1 having isCorrect = true.
- Write questions in clear, professional English suitable for students and educators.
- PRIVACY: Never generate questions containing personal data, real identifiable individuals (unless historical public figures), or sensitive information.
- Return ONLY raw JSON — no other text whatsoever.";

        // Build a precise difficulty-aware user prompt
        string difficultyInstruction = diff switch
        {
            "Easy" => "DIFFICULTY: EASY — Questions must test basic recall and fundamental concepts. Use simple vocabulary. Questions should be answerable by beginners with minimal study.",
            "Hard" => "DIFFICULTY: HARD — Questions must require deep analysis, synthesis, or expert-level knowledge. Include nuanced scenarios, edge cases, and advanced concepts. Questions should challenge even experienced practitioners.",
            "Mixed" => "DIFFICULTY: MIXED — Generate a balanced mix: roughly 30% Easy (basic recall), 40% Medium (understanding/application), 30% Hard (analysis/expert knowledge).",
            _ => "DIFFICULTY: MEDIUM — Questions should test understanding and ability to apply concepts, not just recall definitions. Require the student to think, not just remember."
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

        var userPrompt = $"Generate exactly {targetCount} quiz questions for the topic: '{topicFull}'.\n{difficultyInstruction}{examInstruction}\nEnsure all questions are factually accurate and the explanation clearly justifies why the correct answer is right.";


        var requestBody = new
        {
            model = "openai/gpt-oss-20b",
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            },
            temperature = 0.7,
            max_tokens = 4096,
            response_format = new { type = "json_object" }
        };

        var jsonContent = JsonSerializer.Serialize(requestBody);

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        try
        {
            var response = await _httpClient.SendAsync(request, cancellationToken);
            string responseString = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                return Result.Failure<List<GeneratedQuestionDto>>(
                    $"Groq API Call Failed (HTTP {(int)response.StatusCode}): {ExtractErrorMessage(responseString)}");
            }

            using var doc = JsonDocument.Parse(responseString);
            var root = doc.RootElement;
            if (!root.TryGetProperty("choices", out var choices) || choices.GetArrayLength() == 0)
            {
                return Result.Failure<List<GeneratedQuestionDto>>("Groq API returned an empty completion response.");
            }

            string contentText = choices[0].GetProperty("message").GetProperty("content").GetString() ?? string.Empty;
            contentText = CleanJsonText(contentText);

            var questions = ParseGroqJsonResponse(contentText);
            if (questions == null || questions.Count == 0)
            {
                return Result.Failure<List<GeneratedQuestionDto>>("Failed to parse valid questions from Groq AI response. Click Retry to try again.");
            }

            return Result.Success(questions);
        }
        catch (Exception ex)
        {
            return Result.Failure<List<GeneratedQuestionDto>>($"AI Question Generation Error: {ex.Message}. Click Retry to try again.");
        }
    }

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

    private static string ExtractErrorMessage(string responseBody)
    {
        try
        {
            using var doc = JsonDocument.Parse(responseBody);
            if (doc.RootElement.TryGetProperty("error", out var err) && err.TryGetProperty("message", out var msg))
            {
                return msg.GetString() ?? responseBody;
            }
        }
        catch { }
        return responseBody.Length > 200 ? string.Concat(responseBody.AsSpan(0, 200), "...") : responseBody;
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
