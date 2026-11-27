using System.Net;
using System.Text;
using System.Text.Json;
using LMS.Application.Common.Interfaces;
using LMS.Application.Features.Quizzes.Commands.CreateQuiz;
using LMS.Application.Features.Quizzes.Commands.ExtendQuizLimit;
using LMS.Application.Features.Quizzes.Commands.SubmitQuizAttempt;
using LMS.Application.Features.Quizzes.Commands.UpdateQuiz;
using LMS.Application.Features.Quizzes.DTOs;
using LMS.Application.Features.Quizzes.Queries.GetQuizAttemptById;
using LMS.Application.Features.Quizzes.Queries.GetQuizById;
using LMS.Application.Features.Quizzes.Queries.GetQuizByPublicId;
using LMS.Application.Features.Quizzes.Queries.GetQuizLeaderboard;
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
    public async Task GroqService_ShouldFallBackAcrossModels_WhenRateLimitedOrUnavailable()
    {
        var requestedModels = new List<string>();
        var handler = new StubHttpMessageHandler(req =>
        {
            if (req.RequestUri?.AbsolutePath.EndsWith("/models", StringComparison.OrdinalIgnoreCase) == true)
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonSerializer.Serialize(new
                    {
                        data = new[]
                        {
                            new { id = "llama-3.1-8b-instant" },
                            new { id = "whisper-large-v3" }
                        }
                    }), Encoding.UTF8, "application/json")
                };
            }

            var body = req.Content!.ReadAsStringAsync().GetAwaiter().GetResult();
            using var bodyDoc = JsonDocument.Parse(body);
            var model = bodyDoc.RootElement.GetProperty("model").GetString() ?? string.Empty;
            requestedModels.Add(model);

            if (model == "openai/gpt-oss-20b")
            {
                bodyDoc.RootElement.GetProperty("reasoning_effort").GetString().Should().Be("low");
                return new HttpResponseMessage(HttpStatusCode.TooManyRequests)
                {
                    Content = new StringContent("{\"error\":{\"message\":\"Rate limit reached on TPM\"}}", Encoding.UTF8, "application/json")
                };
            }

            if (model == "openai/gpt-oss-120b")
            {
                return new HttpResponseMessage(HttpStatusCode.NotFound)
                {
                    Content = new StringContent("{\"error\":{\"message\":\"Model does not exist\"}}", Encoding.UTF8, "application/json")
                };
            }

            var okPayload = new
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
                                        question = "What is the time complexity of binary search?",
                                        type = "SingleChoice",
                                        tag = "Algorithms",
                                        explanation = "Halving the search range each step yields logarithmic time.",
                                        options = new[]
                                        {
                                            new { text = "O(log n)", isCorrect = "true" },
                                            new { text = "O(n)", isCorrect = "false" },
                                            new { text = "O(n^2)", isCorrect = "false" },
                                            new { text = "O(1)", isCorrect = "false" }
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
                Content = new StringContent(JsonSerializer.Serialize(okPayload), Encoding.UTF8, "application/json")
            };
        });

        var client = new HttpClient(handler);
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Groq:ApiKey"] = "gsk_test_key" })
            .Build();
        var service = new GroqService(client, config);

        var result = await service.GenerateQuestionsAsync("Algorithms", null, 1, "Medium");
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().ContainSingle(q =>
            q.Tag == "Algorithms" &&
            q.Options.Any(o => o.OptionText == "O(log n)" && o.IsCorrect));
        requestedModels.Should().Contain("openai/gpt-oss-20b");
        requestedModels.Should().Contain("openai/gpt-oss-120b");
        requestedModels.Should().Contain("qwen/qwen3-32b");
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

    [Fact]
    public async Task MaxStudentsCap_ShouldEnforce50Limit_AndCloseQuizWhenSeatsFill()
    {
        await using var db = CreateInMemoryDbContext();
        var tenantId = Guid.NewGuid();
        var instructorId = Guid.NewGuid();

        var validator = new CreateQuizCommandValidator();
        var over50Command = new CreateQuizCommand(
            null, "Over Limit Quiz", null, "Programming", "Easy", true, 60, 10,
            null, null, false, false, null, false, false, true, true, true, 1, null, null,
            new List<CreateQuizQuestionDto>
            {
                new("Q1", QuestionType.SingleChoice, 1, null, new List<CreateQuizOptionDto> { new("A", true), new("B", false) })
            },
            MaxStudents: 51
        );
        var validation = await validator.ValidateAsync(over50Command);
        validation.IsValid.Should().BeFalse();

        // Create quiz with MaxStudents = 40, extend once -> capped at 50, extend again -> fails at 50
        var creator = new Mock<ICurrentUserService>();
        creator.Setup(u => u.UserId).Returns(instructorId);
        var tenant = new Mock<ITenantContext>();
        tenant.Setup(t => t.TenantId).Returns(tenantId);

        var createHandler = new CreateQuizCommandHandler(db, tenant.Object, creator.Object);
        var created = await createHandler.Handle(over50Command with { MaxStudents = 40 }, CancellationToken.None);
        created.IsSuccess.Should().BeTrue();
        var quizId = created.Value!.Id;

        var extendHandler = new ExtendQuizLimitCommandHandler(db, creator.Object);
        var ext1 = await extendHandler.Handle(new ExtendQuizLimitCommand(quizId), CancellationToken.None);
        ext1.IsSuccess.Should().BeTrue();
        ext1.Value!.NewMaxStudents.Should().Be(50);

        var ext2 = await extendHandler.Handle(new ExtendQuizLimitCommand(quizId), CancellationToken.None);
        ext2.IsSuccess.Should().BeFalse();

        // Now test seat fill closure on a 1-seat quiz
        var oneSeatQuiz = await createHandler.Handle(over50Command with { Title = "One Seat Quiz", MaxStudents = 1 }, CancellationToken.None);
        oneSeatQuiz.IsSuccess.Should().BeTrue();
        var q = oneSeatQuiz.Value!.Questions[0];
        var correctId = q.Options.First(o => o.IsCorrect == true).Id;

        var student1 = new Mock<ICurrentUserService>();
        student1.Setup(u => u.UserId).Returns(Guid.NewGuid());
        var submit1 = await new SubmitQuizAttemptCommandHandler(db, tenant.Object, student1.Object)
            .Handle(new SubmitQuizAttemptCommand(oneSeatQuiz.Value.Id, new List<StudentAnswerItemDto> { new(q.Id, correctId, new List<Guid> { correctId }) }), CancellationToken.None);
        submit1.IsSuccess.Should().BeTrue();
        submit1.Value!.IsCapReached.Should().BeTrue();

        // Public quiz lookup reports closed message; second student submission is blocked
        var publicQuery = await new GetQuizByPublicIdQueryHandler(db)
            .Handle(new GetQuizByPublicIdQuery(oneSeatQuiz.Value.ShortId), CancellationToken.None);
        publicQuery.IsSuccess.Should().BeFalse();
        publicQuery.Error.Should().Contain("seats");

        var student2 = new Mock<ICurrentUserService>();
        student2.Setup(u => u.UserId).Returns(Guid.NewGuid());
        var submit2 = await new SubmitQuizAttemptCommandHandler(db, tenant.Object, student2.Object)
            .Handle(new SubmitQuizAttemptCommand(oneSeatQuiz.Value.Id, new List<StudentAnswerItemDto> { new(q.Id, correctId, new List<Guid> { correctId }) }), CancellationToken.None);
        submit2.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task PurgeExpiredQuizzesAsync_ShouldPermanentlyDeleteQuizAndAllRelatedDataAfter1Day()
    {
        await using var db = CreateInMemoryDbContext();
        var tenantId = Guid.NewGuid();

        var oldQuiz = new Quiz
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Title = "Yesterday Quiz",
            IsPublished = true,
            PassingScorePercentage = 60,
            MaxStudents = 50,
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-25)
        };
        var oldQuestion = new QuizQuestion
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            QuizId = oldQuiz.Id,
            QuestionText = "Old Question",
            OrderIndex = 1,
            Options = new List<QuizOption>
            {
                new() { Id = Guid.NewGuid(), TenantId = tenantId, OptionText = "True", IsCorrect = true, OrderIndex = 1 }
            }
        };
        oldQuiz.Questions.Add(oldQuestion);

        var oldAttempt = new QuizAttempt
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            QuizId = oldQuiz.Id,
            ScorePercentage = 100,
            IsPassed = true,
            Answers = new List<QuizAttemptAnswer>
            {
                new() { Id = Guid.NewGuid(), TenantId = tenantId, QuestionId = oldQuestion.Id, IsCorrect = true, PointsEarned = 1 }
            }
        };
        var oldCert = new Certificate
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            QuizId = oldQuiz.Id,
            QuizAttemptId = oldAttempt.Id,
            CertificateNumber = "CERT-OLD-1"
        };

        var freshQuiz = new Quiz
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Title = "Fresh Quiz",
            IsPublished = true,
            PassingScorePercentage = 60,
            MaxStudents = 50,
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-2)
        };
        freshQuiz.Questions.Add(new QuizQuestion
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            QuizId = freshQuiz.Id,
            QuestionText = "Fresh Question",
            OrderIndex = 1
        });

        db.Quizzes.AddRange(oldQuiz, freshQuiz);
        db.QuizAttempts.Add(oldAttempt);
        db.Certificates.Add(oldCert);
        await db.SaveChangesAsync();

        // Force CreatedAt back to > 24h because SaveChangesAsync stamps CreatedAt on Added entities
        oldQuiz.CreatedAt = DateTimeOffset.UtcNow.AddHours(-25);
        freshQuiz.CreatedAt = DateTimeOffset.UtcNow.AddHours(-2);
        await db.SaveChangesAsync();

        var purgedCount = await QuizDataCleanupHelper.PurgeExpiredQuizzesAsync(db, TimeSpan.FromHours(24));

        purgedCount.Should().Be(1);
        db.Quizzes.IgnoreQueryFilters().Should().ContainSingle(q => q.Id == freshQuiz.Id);
        db.QuizQuestions.Should().ContainSingle(q => q.QuizId == freshQuiz.Id);
        db.QuizAttempts.Should().BeEmpty();
        db.QuizAttemptAnswers.Should().BeEmpty();
        db.Certificates.IgnoreQueryFilters().Should().BeEmpty();
    }

    [Fact]
    public async Task StudentPracticeQuiz_ShouldRemainPrivateAndUnshareable_WhileTrackingSelfRetests()
    {
        await using var db = CreateInMemoryDbContext();
        var tenantId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        var otherStudentId = Guid.NewGuid();

        db.Users.Add(new User
        {
            Id = studentId,
            TenantId = tenantId,
            Email = "aspirant@example.com",
            FirstName = "Aarav",
            LastName = "Sharma",
            PasswordHash = "hash",
            Role = UserRole.Student
        });
        await db.SaveChangesAsync();

        var studentUser = new Mock<ICurrentUserService>();
        studentUser.Setup(u => u.UserId).Returns(studentId);
        var tenant = new Mock<ITenantContext>();
        tenant.Setup(t => t.TenantId).Returns(tenantId);

        // Even if publish/maxStudents are requested, student quizzes remain private practice sets.
        var createResult = await new CreateQuizCommandHandler(db, tenant.Object, studentUser.Object)
            .Handle(new CreateQuizCommand(
                LessonId: null,
                Title: "UPSC Polity Mock #1",
                Description: "Self practice",
                Category: "Government & Competitive Exam",
                Difficulty: "Hard",
                IsPublished: true,
                PassingScorePercentage: 60,
                TimeLimitMinutes: 15,
                MaxAttempts: 1,
                NegativeMarkingPoints: 0.33,
                ShuffleQuestions: false,
                ShuffleOptions: false,
                ExpiryDateUtc: null,
                EnableCertificate: false,
                CertificateForTopperOnly: true,
                AutoSubmit: true,
                ShowResultsAfterSubmission: true,
                ShowCorrectAnswers: true,
                TotalMarks: 1,
                WelcomeMessage: null,
                Instructions: null,
                Questions: new List<CreateQuizQuestionDto>
                {
                    new("Which Article guarantees Right to Equality?", QuestionType.SingleChoice, 1, "Article 14", new List<CreateQuizOptionDto>
                    {
                        new("Article 14", true),
                        new("Article 32", false)
                    })
                },
                MaxStudents: 30
            ), CancellationToken.None);

        createResult.IsSuccess.Should().BeTrue();
        var quiz = createResult.Value!;
        quiz.IsPublished.Should().BeFalse();
        quiz.MaxStudents.Should().Be(1);
        quiz.MaxAttempts.Should().BeNull();

        // Public link and other users are blocked from viewing or submitting.
        var publicRead = await new GetQuizByPublicIdQueryHandler(db)
            .Handle(new GetQuizByPublicIdQuery(quiz.ShortId), CancellationToken.None);
        publicRead.IsSuccess.Should().BeFalse();

        var otherUser = new Mock<ICurrentUserService>();
        otherUser.Setup(u => u.UserId).Returns(otherStudentId);
        var otherById = await new GetQuizByIdQueryHandler(db, otherUser.Object)
            .Handle(new GetQuizByIdQuery(quiz.Id), CancellationToken.None);
        otherById.IsSuccess.Should().BeFalse();

        var q0 = quiz.Questions[0];
        var correctOptionId = q0.Options.First(o => o.IsCorrect == true).Id;
        var wrongOptionId = q0.Options.First(o => o.IsCorrect == false).Id;

        var otherSubmit = await new SubmitQuizAttemptCommandHandler(db, tenant.Object, otherUser.Object)
            .Handle(new SubmitQuizAttemptCommand(quiz.Id, new List<StudentAnswerItemDto> { new(q0.Id, correctOptionId, new List<Guid> { correctOptionId }) }), CancellationToken.None);
        otherSubmit.IsSuccess.Should().BeFalse();

        // Owner student takes and retakes the quiz multiple times.
        var submitHandler = new SubmitQuizAttemptCommandHandler(db, tenant.Object, studentUser.Object);
        var attempt1 = await submitHandler.Handle(new SubmitQuizAttemptCommand(
            quiz.Id,
            new List<StudentAnswerItemDto> { new(q0.Id, wrongOptionId, new List<Guid> { wrongOptionId }) },
            TimeTakenSeconds: 45
        ), CancellationToken.None);
        attempt1.IsSuccess.Should().BeTrue();
        attempt1.Value!.IsPassed.Should().BeFalse();

        var attempt2 = await submitHandler.Handle(new SubmitQuizAttemptCommand(
            quiz.Id,
            new List<StudentAnswerItemDto> { new(q0.Id, correctOptionId, new List<Guid> { correctOptionId }) },
            TimeTakenSeconds: 30
        ), CancellationToken.None);
        attempt2.IsSuccess.Should().BeTrue();
        attempt2.Value!.IsPassed.Should().BeTrue();

        // Student dashboard summary includes their own self-attempts per quiz.
        var summaryResult = await new GetUserQuizDashboardSummaryQueryHandler(db)
            .Handle(new GetUserQuizDashboardSummaryQuery(studentId), CancellationToken.None);
        summaryResult.IsSuccess.Should().BeTrue();
        var summaryItem = summaryResult.Value!.MyQuizzes.Should().ContainSingle().Subject;
        summaryItem.TotalAttemptsCount.Should().Be(2);
        summaryItem.PassedCount.Should().Be(1);

        // Student attempts list returns chronological Attempt #1 and Attempt #2 instead of excluding owner.
        var attemptsResult = await new GetQuizLeaderboardQueryHandler(db, studentUser.Object)
            .Handle(new GetQuizLeaderboardQuery(quiz.Id), CancellationToken.None);
        attemptsResult.IsSuccess.Should().BeTrue();
        attemptsResult.Value.Should().HaveCount(2);
        attemptsResult.Value![0].Rank.Should().Be(1);
        attemptsResult.Value[0].IsPassed.Should().BeFalse();
        attemptsResult.Value[1].Rank.Should().Be(2);
        attemptsResult.Value[1].IsPassed.Should().BeTrue();

        // Owner student can open detailed scorecard review; unrelated user cannot.
        var scorecard = await new GetQuizAttemptByIdQueryHandler(db, studentUser.Object)
            .Handle(new GetQuizAttemptByIdQuery(attempt2.Value.AttemptId), CancellationToken.None);
        scorecard.IsSuccess.Should().BeTrue();

        var otherScorecard = await new GetQuizAttemptByIdQueryHandler(db, otherUser.Object)
            .Handle(new GetQuizAttemptByIdQuery(attempt2.Value.AttemptId), CancellationToken.None);
        otherScorecard.IsSuccess.Should().BeFalse();
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
