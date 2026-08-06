using LMS.Application.Features.QuestionBank.DTOs;
using LMS.Application.Features.QuestionBank.Queries.GenerateQuestions;
using LMS.Application.Features.QuestionBank.Queries.GetDomainTopics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using Microsoft.AspNetCore.RateLimiting;

namespace LMS.Api.Controllers;

public class QuestionBankController : ApiControllerBase
{
    /// <summary>
    /// Gets configurable domains and subtopics for smart quiz creation.
    /// </summary>
    [HttpGet("/api/v1/question-bank/domains")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<DomainTopicDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDomains(CancellationToken cancellationToken)
    {
        var query = new GetDomainTopicsQuery();
        var result = await Mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Generates questions live via Groq AI LLM based on specified domain/topic and prompt.
    /// </summary>
    [HttpPost("/api/v1/question-bank/generate")]
    [AllowAnonymous]
    [EnableRateLimiting("AiRateLimit")]
    [ProducesResponseType(typeof(List<GeneratedQuestionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateQuestions([FromBody] GenerateQuestionsRequestDto dto, CancellationToken cancellationToken)
    {
        var query = new GenerateQuestionsQuery(
            dto.DomainTopicId,
            dto.SubTopicId,
            dto.CustomTopic,
            dto.QuestionCount,
            dto.Difficulty,
            dto.ApiKey
        );

        var result = await Mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }
}
