using LMS.Application.Common.Interfaces;
using LMS.Application.Features.Quizzes.Commands.ClearUserQuizAttempts;
using LMS.Application.Features.Quizzes.Commands.CreateQuiz;
using LMS.Application.Features.Quizzes.Commands.DeleteQuizAttempt;
using LMS.Application.Features.Quizzes.Commands.SubmitQuizAttempt;
using LMS.Application.Features.Quizzes.Commands.DeleteQuiz;
using LMS.Application.Features.Quizzes.Commands.ExtendQuizLimit;
using LMS.Application.Features.Quizzes.DTOs;
using LMS.Application.Features.Quizzes.Queries.GetQuizById;
using LMS.Application.Features.Quizzes.Queries.GetQuizByLesson;
using LMS.Application.Features.Quizzes.Queries.GetUserQuizDashboardSummary;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.Api.Controllers;

public class QuizzesController : ApiControllerBase
{
    private readonly ICurrentUserService _currentUserService;

    public QuizzesController(ICurrentUserService currentUserService)
    {
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Gets dashboard summary metrics, created quizzes, and attempt history for the logged-in user.
    /// </summary>
    [HttpGet("/api/v1/quizzes/dashboard-summary")]
    [Authorize]
    [ProducesResponseType(typeof(UserQuizDashboardSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetDashboardSummary(CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            return Unauthorized();
        }

        var query = new GetUserQuizDashboardSummaryQuery(_currentUserService.UserId.Value);
        var result = await Mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Clears all quiz attempt history for the logged-in user.
    /// </summary>
    [HttpDelete("/api/v1/quizzes/attempts/clear")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ClearUserQuizAttempts(CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            return Unauthorized();
        }

        var command = new ClearUserQuizAttemptsCommand(_currentUserService.UserId.Value);
        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(new { success = true, message = "Attempt history cleared successfully." });
    }

    /// <summary>
    /// Gets detailed information about a specific quiz attempt for review/scorecard.
    /// </summary>
    [HttpGet("/api/v1/quizzes/attempts/{attemptId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(AdminAttemptDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetQuizAttempt(Guid attemptId, CancellationToken cancellationToken)
    {
        var query = new LMS.Application.Features.Quizzes.Queries.GetQuizAttemptById.GetQuizAttemptByIdQuery(attemptId);
        var result = await Mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Deletes a specific quiz attempt by ID for the logged-in user.
    /// </summary>
    [HttpDelete("/api/v1/quizzes/attempts/{attemptId:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteQuizAttempt(Guid attemptId, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            return Unauthorized();
        }

        var command = new DeleteQuizAttemptCommand(attemptId, _currentUserService.UserId.Value);
        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(new { success = true, message = "Attempt record deleted." });
    }

    /// <summary>
    /// Deletes a quiz.
    /// </summary>
    [HttpDelete("/api/v1/quizzes/{id:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteQuiz(Guid id, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            return Unauthorized();
        }

        var command = new DeleteQuizCommand(id);
        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(new { success = true, message = "Quiz deleted successfully." });
    }

    /// <summary>
    /// Gets a standalone quiz assessment by ID.
    /// </summary>
    [HttpGet("/api/v1/quizzes/{quizId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(QuizDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetQuizById(Guid quizId, CancellationToken cancellationToken)
    {
        var query = new GetQuizByIdQuery(quizId);
        var result = await Mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets a quiz assessment by its secure public ID for students.
    /// </summary>
    [HttpGet("/api/v1/public/quizzes/{shortId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(QuizDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetQuizByPublicId(string shortId, CancellationToken cancellationToken)
    {
        var query = new LMS.Application.Features.Quizzes.Queries.GetQuizByPublicId.GetQuizByPublicIdQuery(shortId);
        var result = await Mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets student submissions and leaderboard for a specific quiz assessment.
    /// </summary>
    [HttpGet("/api/v1/quizzes/{quizId:guid}/leaderboard")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<QuizLeaderboardItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetQuizLeaderboard(Guid quizId, CancellationToken cancellationToken)
    {
        var query = new LMS.Application.Features.Quizzes.Queries.GetQuizLeaderboard.GetQuizLeaderboardQuery(quizId);
        var result = await Mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets the quiz assessment for a lesson (legacy course compatibility).
    /// </summary>
    [HttpGet("/api/v1/lessons/{lessonId:guid}/quiz")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(QuizDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetQuizByLesson(Guid lessonId, CancellationToken cancellationToken)
    {
        var query = new GetQuizByLessonQuery(lessonId);
        var result = await Mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a standalone quiz assessment.
    /// </summary>
    [HttpPost("/api/v1/quizzes")]
    [Authorize]
    [ProducesResponseType(typeof(QuizDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateStandaloneQuiz([FromBody] CreateQuizDto dto, CancellationToken cancellationToken)
    {
        var command = new CreateQuizCommand(
            dto.LessonId,
            dto.Title,
            dto.Description,
            dto.Category,
            dto.Difficulty,
            dto.IsPublished,
            dto.PassingScorePercentage,
            dto.TimeLimitMinutes,
            dto.MaxAttempts,
            dto.NegativeMarkingPoints,
            dto.ShuffleQuestions,
            dto.ShuffleOptions,
            dto.ExpiryDateUtc,
            dto.EnableCertificate,
            dto.CertificateForTopperOnly,
            dto.AutoSubmit,
            dto.ShowResultsAfterSubmission,
            dto.ShowCorrectAnswers,
            dto.TotalMarks,
            dto.WelcomeMessage,
            dto.Instructions,
            dto.Questions,
            dto.MaxStudents
        );

        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Updates an existing standalone quiz assessment.
    /// </summary>
    [HttpPut("/api/v1/quizzes/{quizId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(QuizDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateStandaloneQuiz(Guid quizId, [FromBody] UpdateQuizDto dto, CancellationToken cancellationToken)
    {
        var command = new LMS.Application.Features.Quizzes.Commands.UpdateQuiz.UpdateQuizCommand(
            quizId,
            dto.Title,
            dto.Description,
            dto.Category,
            dto.Difficulty,
            dto.IsPublished,
            dto.PassingScorePercentage,
            dto.TimeLimitMinutes,
            dto.MaxAttempts,
            dto.NegativeMarkingPoints,
            dto.ShuffleQuestions,
            dto.ShuffleOptions,
            dto.ExpiryDateUtc,
            dto.EnableCertificate,
            dto.CertificateForTopperOnly,
            dto.AutoSubmit,
            dto.ShowResultsAfterSubmission,
            dto.ShowCorrectAnswers,
            dto.WelcomeMessage,
            dto.Instructions,
            dto.Questions
        );

        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new quiz assessment under a lesson (legacy course compatibility).
    /// </summary>
    [HttpPost("/api/v1/lessons/{lessonId:guid}/quiz")]
    [Authorize]
    [ProducesResponseType(typeof(QuizDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateQuiz(Guid lessonId, [FromBody] CreateQuizDto dto, CancellationToken cancellationToken)
    {
        var command = new CreateQuizCommand(
            lessonId,
            dto.Title,
            dto.Description,
            dto.Category,
            dto.Difficulty,
            dto.IsPublished,
            dto.PassingScorePercentage,
            dto.TimeLimitMinutes,
            dto.MaxAttempts,
            dto.NegativeMarkingPoints,
            dto.ShuffleQuestions,
            dto.ShuffleOptions,
            dto.ExpiryDateUtc,
            dto.EnableCertificate,
            dto.CertificateForTopperOnly,
            dto.AutoSubmit,
            dto.ShowResultsAfterSubmission,
            dto.ShowCorrectAnswers,
            dto.TotalMarks,
            dto.WelcomeMessage,
            dto.Instructions,
            dto.Questions,
            dto.MaxStudents
        );

        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Submits a student's quiz attempt for scoring and evaluation.
    /// </summary>
    [HttpPost("/api/v1/quizzes/{quizId:guid}/submit")]
    [Authorize]
    [ProducesResponseType(typeof(QuizAttemptResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitQuizAttempt(Guid quizId, [FromBody] SubmitQuizAttemptDto dto, CancellationToken cancellationToken)
    {
        var command = new SubmitQuizAttemptCommand(quizId, dto.Answers, dto.StudentName);
        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Submits a student's quiz attempt via a public link (No auth required).
    /// </summary>
    [HttpPost("/api/v1/public/quizzes/{quizId:guid}/submit")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(QuizAttemptResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitPublicQuizAttempt(Guid quizId, [FromBody] SubmitQuizAttemptDto dto, CancellationToken cancellationToken)
    {
        var command = new SubmitQuizAttemptCommand(
            quizId,
            dto.Answers,
            dto.StudentName,
            dto.RollNumber,
            dto.ClassName,
            dto.Department,
            dto.Email,
            dto.PhoneNumber,
            dto.FocusLostCount,
            dto.IsDisqualified,
            dto.DisqualificationReason
        );
        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Extends the student limit of a quiz by 15 additional slots. Can only be done twice.
    /// </summary>
    [HttpPost("/api/v1/quizzes/{quizId:guid}/extend-limit")]
    [Authorize]
    [ProducesResponseType(typeof(ExtendQuizLimitResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ExtendQuizLimit(Guid quizId, CancellationToken cancellationToken)
    {
        var command = new ExtendQuizLimitCommand(quizId);
        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }
}
