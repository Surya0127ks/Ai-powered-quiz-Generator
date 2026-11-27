using System.Net;
using System.Text;
using System.Text.Json;
using LMS.Application.Common.Interfaces;
using LMS.Application.Features.Quizzes.Commands.CreateQuiz;
using LMS.Application.Features.Quizzes.Commands.SubmitQuizAttempt;
using LMS.Application.Features.Quizzes.Commands.UpdateQuiz;
using LMS.Application.Features.Quizzes.DTOs;
using LMS.Application.Features.Quizzes.Queries.GetUserQuizDashboardSummary;
using LMS.Domain.Entities;
using LMS.Domain.Enums;
using LMS.Infrastructure.Persistence;
using LMS.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;

namespace LMS.Infrastructure.Tests;

public class QuizFeaturesTests
{
    [Fact]
    public async Task GroqService_ShouldEnforceMax30Questions_AndParseQuestionTags()
    {
        var handler = new StubHttpMessageHandler(_ =>
        {
            var payload = new
            {
                choices = new[]
                {
                    new
                    {
                        message = new
                        {
                            content = JsonSerializer.Serialize(new
                            {
                                questions = new[]
                                {
                                    new
                                    {
                                        questionText = "Which keyword enables inheritance in C#?",
                                        type = "SingleChoice",
                                        points = 1,
                                        tag = "  OOP  ",
                                        explanation = "C# uses ':' to inherit from a base class.",
                                        options = new[]
                                        {
                                            new { optionText = ":", isCorrect = true },
                                            new { optionText = "extends", isCorrect = false },
                                            new { optionText = "inherits", isCorrect = false },
                                            new { optionText = "->", isCorrect = false }
                                        }
                                    }
                                }
                            })
                        }
                    }
                }
            };

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
        });

        var client = new HttpClient(handler);
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Groq:ApiKey"] = "gsk_test_key" })
            .Build();
        var service = new GroqService(client, config);

        var overLimit = await service.GenerateQuestionsAsync("C#", null, 31, "Easy");
        overLimit.IsSuccess.Should().BeFalse();

        var valid = await service.GenerateQuestionsAsync("C#", null, 1, "Easy");
        valid.IsSuccess.Should().BeTrue();
        valid.Value.Should().HaveCount(1);
        valid.Value![0].Tag.Should().Be("OOP");
    }

    [Fact]
    public async Task CreateUpdateSubmitAndSummary_ShouldPersistTagsExplanationsAndAnalytics()
    {
        await using var db = CreateInMemoryDbContext();
        var tenantId = Guid.NewGuid();
        var instructorId = Guid.NewGuid();
        var student1Id = Guid.NewGuid();
        var student2Id = Guid.NewGuid();

        var currentUser = new Mock<ICurrentUserService>();
        currentUser.Setup(u => u.UserId).Returns(instructorId);

        var tenant = new Mock<ITenantContext>();
        tenant.Setup(t => t.TenantId).Returns(tenantId);

        var createHandler = new CreateQuizCommandHandler(db, tenant.Object, currentUser.Object);
        var createResult = await createHandler.Handle(new CreateQuizCommand(
            LessonId: null,
            Title: "Backend Architecture Quiz",
            Description: "Test",
            Category: "Programming",
            Difficulty: "Intermediate",
            IsPublished: true,
            PassingScorePercentage: 60,
            TimeLimitMinutes: 20,
            MaxAttempts: null,
            NegativeMarkingPoints: null,
            ShuffleQuestions: false,
            ShuffleOptions: false,
            ExpiryDateUtc: null,
            EnableCertificate: false,
            CertificateForTopperOnly: false,
            AutoSubmit: true,
            ShowResultsAfterSubmission: true,
            ShowCorrectAnswers: true,
            TotalMarks: 2,
            WelcomeMessage: null,
            Instructions: null,
            Questions: new List<CreateQuizQuestionDto>
            {
                new("What does ACID stand for in SQL?", QuestionType.SingleChoice, 1, "Atomicity, Consistency, Isolation, Durability.", new List<CreateQuizOptionDto>
                {
                    new("Atomicity, Consistency, Isolation, Durability", true),
                    new("Access, Control, Index, Data", false)
                }, "  SQL  ")
            },
            MaxStudents: 25
        ), CancellationToken.None);

        createResult.IsSuccess.Should().BeTrue();
        var quiz = createResult.Value!;
        quiz.Questions.Should().ContainSingle(q => q.Tag == "SQL");

        // Update tag on existing question
        var updateHandler = new UpdateQuizCommandHandler(db, currentUser.Object);
        var q0 = quiz.Questions[0];
        var updateResult = await updateHandler.Handle(new UpdateQuizCommand(
            QuizId: quiz.Id,
            Title: quiz.Title,
            Description: quiz.Description,
            Category: quiz.Category,
            Difficulty: quiz.Difficulty,
            IsPublished: true,
            PassingScorePercentage: 60,
            TimeLimitMinutes: 20,
            MaxAttempts: null,
            NegativeMarkingPoints: null,
            ShuffleQuestions: false,
            ShuffleOptions: false,
            ExpiryDateUtc: null,
            EnableCertificate: false,
            CertificateForTopperOnly: false,
            AutoSubmit: true,
            ShowResultsAfterSubmission: true,
            ShowCorrectAnswers: true,
            WelcomeMessage: null,
            Instructions: null,
            Questions: new List<UpdateQuizQuestionDto>
            {
                new(
                    q0.Id,
                    q0.QuestionText,
                    q0.Type,
                    q0.Points,
                    q0.Explanation,
                    q0.Options.Select(o => new UpdateQuizOptionDto(o.Id, o.OptionText, o.IsCorrect ?? false)).ToList(),
                    "Databases"
                )
            },
            MaxStudents: 25
        ), CancellationToken.None);

        updateResult.IsSuccess.Should().BeTrue();
        updateResult.Value!.Questions[0].Tag.Should().Be("Databases");

        // Submit passing attempt (student 1, 90s)
        var correctOptionId = q0.Options.First(o => o.IsCorrect == true).Id;
        var wrongOptionId = q0.Options.First(o => o.IsCorrect == false).Id;

        var student1User = new Mock<ICurrentUserService>();
        student1User.Setup(u => u.UserId).Returns(student1Id);
        var submitHandler1 = new SubmitQuizAttemptCommandHandler(db, tenant.Object, student1User.Object);

        var attempt1 = await submitHandler1.Handle(new SubmitQuizAttemptCommand(
            quiz.Id,
            new List<StudentAnswerItemDto> { new(q0.Id, correctOptionId, new List<Guid> { correctOptionId }) },
            StudentName: "Asha",
            TimeTakenSeconds: 90
        ), CancellationToken.None);

        attempt1.IsSuccess.Should().BeTrue();
        attempt1.Value!.IsPassed.Should().BeTrue();
        attempt1.Value.TimeTakenSeconds.Should().Be(90);
        attempt1.Value.Reviews.Should().ContainSingle(r =>
            r.Tag == "Databases" &&
            r.Explanation == "Atomicity, Consistency, Isolation, Durability." &&
            r.CorrectOptionIds.Contains(correctOptionId));

        // Submit failing attempt (student 2, 150s)
        var student2User = new Mock<ICurrentUserService>();
        student2User.Setup(u => u.UserId).Returns(student2Id);
        var submitHandler2 = new SubmitQuizAttemptCommandHandler(db, tenant.Object, student2User.Object);

        var attempt2 = await submitHandler2.Handle(new SubmitQuizAttemptCommand(
            quiz.Id,
            new List<StudentAnswerItemDto> { new(q0.Id, wrongOptionId, new List<Guid> { wrongOptionId }) },
            StudentName: "Rohan",
            TimeTakenSeconds: 150
        ), CancellationToken.None);

        attempt2.IsSuccess.Should().BeTrue();
        attempt2.Value!.IsPassed.Should().BeFalse();

        // Check instructor dashboard analytics
        var summaryHandler = new GetUserQuizDashboardSummaryQueryHandler(db);
        var summaryResult = await summaryHandler.Handle(new GetUserQuizDashboardSummaryQuery(instructorId), CancellationToken.None);

        summaryResult.IsSuccess.Should().BeTrue();
        var item = summaryResult.Value!.MyQuizzes.Should().ContainSingle().Subject;
        item.TotalAttemptsCount.Should().Be(2);
        item.PassedCount.Should().Be(1);
        item.PassRatePercentage.Should().Be(50.0);
        item.AvgScorePercentage.Should().Be(50.0);
        item.AvgTimeTakenSeconds.Should().Be(120);
        item.MaxStudents.Should().Be(25);
    }

    private static ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private sealed class StubHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _responder;

        public StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responder)
        {
            _responder = responder;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(_responder(request));
    }
}
