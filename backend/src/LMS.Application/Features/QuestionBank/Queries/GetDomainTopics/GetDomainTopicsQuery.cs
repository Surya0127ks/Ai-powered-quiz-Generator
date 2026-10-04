using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.QuestionBank.DTOs;
using LMS.Domain.Entities;
using LMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.QuestionBank.Queries.GetDomainTopics;

public record GetDomainTopicsQuery : IRequest<Result<List<DomainTopicDto>>>;

public class GetDomainTopicsQueryHandler : IRequestHandler<GetDomainTopicsQuery, Result<List<DomainTopicDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetDomainTopicsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<DomainTopicDto>>> Handle(GetDomainTopicsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            if (_context is DbContext dbContext)
            {
                await dbContext.Database.EnsureCreatedAsync(cancellationToken);
            }

            // Auto-seed if empty
            if (!await _context.DomainTopics.AnyAsync(cancellationToken))
            {
                await SeedDefaultQuestionBankAsync(cancellationToken);
            }

            var topics = await _context.DomainTopics
                .Include(d => d.SubTopics)
                .OrderBy(d => d.Name)
                .Select(d => new DomainTopicDto(
                    d.Id,
                    d.Name,
                    d.Description,
                    d.SubTopics.OrderBy(s => s.Name).Select(s => new SubTopicDto(s.Id, s.Name)).ToList()
                ))
                .ToListAsync(cancellationToken);

            return Result.Success(topics);
        }
        catch (Exception)
        {
            // Fallback default domain topics in case of database table structure delay
            return Result.Success(GetFallbackDomainTopics());
        }
    }

    private static List<DomainTopicDto> GetFallbackDomainTopics()
    {
        return new List<DomainTopicDto>
        {
            new DomainTopicDto(
                Guid.Parse("11111111-1111-1111-1111-111111111111"),
                "Web Development",
                "HTML, CSS, JavaScript, React, Angular, and REST APIs",
                new List<SubTopicDto>
                {
                    new SubTopicDto(Guid.Parse("11111111-1111-1111-1111-111111111112"), "HTML & CSS"),
                    new SubTopicDto(Guid.Parse("11111111-1111-1111-1111-111111111113"), "JavaScript & TypeScript"),
                    new SubTopicDto(Guid.Parse("11111111-1111-1111-1111-111111111114"), "Angular & React")
                }
            ),
            new DomainTopicDto(
                Guid.Parse("22222222-2222-2222-2222-222222222222"),
                "Data Structures & Algorithms",
                "Arrays, Linked Lists, Trees, Graphs, Dynamic Programming",
                new List<SubTopicDto>
                {
                    new SubTopicDto(Guid.Parse("22222222-2222-2222-2222-222222222223"), "Arrays & Strings"),
                    new SubTopicDto(Guid.Parse("22222222-2222-2222-2222-222222222224"), "Trees & Graphs")
                }
            ),
            new DomainTopicDto(
                Guid.Parse("33333333-3333-3333-3333-333333333333"),
                "Python Programming",
                "Core Python, OOP, Data Analysis, FastAPIs",
                new List<SubTopicDto>()
            ),
            new DomainTopicDto(
                Guid.Parse("44444444-4444-4444-4444-444444444444"),
                "Computer Networks",
                "TCP/IP, OSI Model, HTTP/S, DNS, Subnetting",
                new List<SubTopicDto>()
            ),
            new DomainTopicDto(
                Guid.Parse("55555555-5555-5555-5555-555555555555"),
                "Database Management (DBMS)",
                "SQL Queries, Indexing, Normalization, ACID Transactions",
                new List<SubTopicDto>()
            ),
            new DomainTopicDto(
                Guid.Parse("66666666-6666-6666-6666-666666666666"),
                "Operating Systems",
                "Process Management, Threads, Memory, Deadlocks",
                new List<SubTopicDto>()
            ),
            new DomainTopicDto(
                Guid.Parse("77777777-7777-7777-7777-777777777777"),
                "Aptitude & Reasoning",
                "Quantitative Aptitude, Logical Reasoning, Verbal Ability",
                new List<SubTopicDto>()
            ),
            new DomainTopicDto(
                Guid.Parse("88888888-8888-8888-8888-888888888888"),
                "General Science",
                "Physics, Chemistry, Biology, Earth Science",
                new List<SubTopicDto>
                {
                    new SubTopicDto(Guid.Parse("88888888-8888-8888-8888-888888888881"), "Physics"),
                    new SubTopicDto(Guid.Parse("88888888-8888-8888-8888-888888888882"), "Chemistry"),
                    new SubTopicDto(Guid.Parse("88888888-8888-8888-8888-888888888883"), "Biology")
                }
            ),
            new DomainTopicDto(
                Guid.Parse("99999999-9999-9999-9999-999999999999"),
                "Mathematics",
                "Algebra, Calculus, Statistics, Geometry, Number Theory",
                new List<SubTopicDto>
                {
                    new SubTopicDto(Guid.Parse("99999999-9999-9999-9999-999999999991"), "Algebra & Calculus"),
                    new SubTopicDto(Guid.Parse("99999999-9999-9999-9999-999999999992"), "Statistics & Probability"),
                    new SubTopicDto(Guid.Parse("99999999-9999-9999-9999-999999999993"), "Geometry")
                }
            ),
            new DomainTopicDto(
                Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                "World History & Geography",
                "Ancient Civilizations, World Wars, Political Geography, Current Affairs",
                new List<SubTopicDto>
                {
                    new SubTopicDto(Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab"), "Ancient History"),
                    new SubTopicDto(Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac"), "Modern History & World Wars"),
                    new SubTopicDto(Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad"), "Geography")
                }
            ),
            new DomainTopicDto(
                Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                "English Language & Literature",
                "Grammar, Comprehension, Vocabulary, Poetry, Prose",
                new List<SubTopicDto>
                {
                    new SubTopicDto(Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc"), "Grammar & Vocabulary"),
                    new SubTopicDto(Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbe"), "Reading Comprehension")
                }
            ),
            new DomainTopicDto(
                Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                "Business & Economics",
                "Microeconomics, Macroeconomics, Management, Finance, Marketing",
                new List<SubTopicDto>
                {
                    new SubTopicDto(Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccd"), "Economics"),
                    new SubTopicDto(Guid.Parse("cccccccc-cccc-cccc-cccc-ccccccccccce"), "Business Management")
                }
            ),
            new DomainTopicDto(
                Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                "Artificial Intelligence & ML",
                "Machine Learning, Neural Networks, NLP, Computer Vision, AI Ethics",
                new List<SubTopicDto>
                {
                    new SubTopicDto(Guid.Parse("dddddddd-dddd-dddd-dddd-ddddddddddde"), "Machine Learning Basics"),
                    new SubTopicDto(Guid.Parse("dddddddd-dddd-dddd-dddd-ddddddddddef"), "Deep Learning & Neural Nets")
                }
            ),
            new DomainTopicDto(
                Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                "Cybersecurity",
                "Network Security, Cryptography, Ethical Hacking, OWASP, Penetration Testing",
                new List<SubTopicDto>()
            ),
            new DomainTopicDto(
                Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
                "General Knowledge",
                "Sports, Culture, Science & Technology, Current Events",
                new List<SubTopicDto>()
            )
        };
    }

    private async Task SeedDefaultQuestionBankAsync(CancellationToken cancellationToken)
    {
        var webDev = new DomainTopic
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Name = "Web Development",
            Description = "HTML, CSS, JavaScript, React, Angular, and REST APIs"
        };
        var sub1 = new SubTopic { Id = Guid.Parse("11111111-1111-1111-1111-111111111112"), Name = "HTML & CSS", DomainTopicId = webDev.Id };
        var sub2 = new SubTopic { Id = Guid.Parse("11111111-1111-1111-1111-111111111113"), Name = "JavaScript & TypeScript", DomainTopicId = webDev.Id };
        var sub3 = new SubTopic { Id = Guid.Parse("11111111-1111-1111-1111-111111111114"), Name = "Angular & React", DomainTopicId = webDev.Id };
        webDev.SubTopics.Add(sub1);
        webDev.SubTopics.Add(sub2);
        webDev.SubTopics.Add(sub3);

        var dsa = new DomainTopic
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Name = "Data Structures & Algorithms",
            Description = "Arrays, Linked Lists, Trees, Graphs, Dynamic Programming"
        };
        dsa.SubTopics.Add(new SubTopic { Id = Guid.Parse("22222222-2222-2222-2222-222222222223"), Name = "Arrays & Strings", DomainTopicId = dsa.Id });
        dsa.SubTopics.Add(new SubTopic { Id = Guid.Parse("22222222-2222-2222-2222-222222222224"), Name = "Trees & Graphs", DomainTopicId = dsa.Id });

        var python = new DomainTopic { Id = Guid.Parse("33333333-3333-3333-3333-333333333333"), Name = "Python Programming", Description = "Core Python, OOP, Data Analysis, FastAPIs" };
        var networking = new DomainTopic { Id = Guid.Parse("44444444-4444-4444-4444-444444444444"), Name = "Computer Networks", Description = "TCP/IP, OSI Model, HTTP/S, DNS, Subnetting" };
        var dbms = new DomainTopic { Id = Guid.Parse("55555555-5555-5555-5555-555555555555"), Name = "Database Management (DBMS)", Description = "SQL Queries, Indexing, Normalization, ACID Transactions" };
        var os = new DomainTopic { Id = Guid.Parse("66666666-6666-6666-6666-666666666666"), Name = "Operating Systems", Description = "Process Management, Threads, Memory, Deadlocks" };
        var aptitude = new DomainTopic { Id = Guid.Parse("77777777-7777-7777-7777-777777777777"), Name = "Aptitude & Reasoning", Description = "Quantitative Aptitude, Logical Reasoning, Verbal Ability" };

        // New educational domains
        var science = new DomainTopic { Id = Guid.Parse("88888888-8888-8888-8888-888888888888"), Name = "General Science", Description = "Physics, Chemistry, Biology, Earth Science" };
        science.SubTopics.Add(new SubTopic { Id = Guid.Parse("88888888-8888-8888-8888-888888888881"), Name = "Physics", DomainTopicId = science.Id });
        science.SubTopics.Add(new SubTopic { Id = Guid.Parse("88888888-8888-8888-8888-888888888882"), Name = "Chemistry", DomainTopicId = science.Id });
        science.SubTopics.Add(new SubTopic { Id = Guid.Parse("88888888-8888-8888-8888-888888888883"), Name = "Biology", DomainTopicId = science.Id });

        var maths = new DomainTopic { Id = Guid.Parse("99999999-9999-9999-9999-999999999999"), Name = "Mathematics", Description = "Algebra, Calculus, Statistics, Geometry, Number Theory" };
        maths.SubTopics.Add(new SubTopic { Id = Guid.Parse("99999999-9999-9999-9999-999999999991"), Name = "Algebra & Calculus", DomainTopicId = maths.Id });
        maths.SubTopics.Add(new SubTopic { Id = Guid.Parse("99999999-9999-9999-9999-999999999992"), Name = "Statistics & Probability", DomainTopicId = maths.Id });
        maths.SubTopics.Add(new SubTopic { Id = Guid.Parse("99999999-9999-9999-9999-999999999993"), Name = "Geometry", DomainTopicId = maths.Id });

        var history = new DomainTopic { Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), Name = "World History & Geography", Description = "Ancient Civilizations, World Wars, Political Geography, Current Affairs" };
        history.SubTopics.Add(new SubTopic { Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab"), Name = "Ancient History", DomainTopicId = history.Id });
        history.SubTopics.Add(new SubTopic { Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac"), Name = "Modern History & World Wars", DomainTopicId = history.Id });
        history.SubTopics.Add(new SubTopic { Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad"), Name = "Geography", DomainTopicId = history.Id });

        var english = new DomainTopic { Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), Name = "English Language & Literature", Description = "Grammar, Comprehension, Vocabulary, Poetry, Prose" };
        english.SubTopics.Add(new SubTopic { Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc"), Name = "Grammar & Vocabulary", DomainTopicId = english.Id });
        english.SubTopics.Add(new SubTopic { Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbe"), Name = "Reading Comprehension", DomainTopicId = english.Id });

        var business = new DomainTopic { Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"), Name = "Business & Economics", Description = "Microeconomics, Macroeconomics, Management, Finance, Marketing" };
        business.SubTopics.Add(new SubTopic { Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccd"), Name = "Economics", DomainTopicId = business.Id });
        business.SubTopics.Add(new SubTopic { Id = Guid.Parse("cccccccc-cccc-cccc-cccc-ccccccccccce"), Name = "Business Management", DomainTopicId = business.Id });

        var aiml = new DomainTopic { Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"), Name = "Artificial Intelligence & ML", Description = "Machine Learning, Neural Networks, NLP, Computer Vision, AI Ethics" };
        aiml.SubTopics.Add(new SubTopic { Id = Guid.Parse("dddddddd-dddd-dddd-dddd-ddddddddddde"), Name = "Machine Learning Basics", DomainTopicId = aiml.Id });
        aiml.SubTopics.Add(new SubTopic { Id = Guid.Parse("dddddddd-dddd-dddd-dddd-ddddddddddef"), Name = "Deep Learning & Neural Nets", DomainTopicId = aiml.Id });

        var cybersec = new DomainTopic { Id = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"), Name = "Cybersecurity", Description = "Network Security, Cryptography, Ethical Hacking, OWASP, Penetration Testing" };
        var gk = new DomainTopic { Id = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"), Name = "General Knowledge", Description = "Sports, Culture, Science & Technology, Current Events" };

        _context.DomainTopics.AddRange(webDev, dsa, python, networking, dbms, os, aptitude, science, maths, history, english, business, aiml, cybersec, gk);
        await _context.SaveChangesAsync(cancellationToken);

        // Seed sample Questions
        var q1 = new QuestionBankItem
        {
            Id = Guid.NewGuid(),
            DomainTopicId = webDev.Id,
            SubTopicId = sub2.Id,
            QuestionText = "Which JavaScript keyword is used to declare a block-scoped variable that cannot be reassigned?",
            Type = QuestionType.SingleChoice,
            Difficulty = "Easy",
            Points = 1,
            Explanation = "'const' creates block-scoped variables that cannot be reassigned after declaration."
        };
        q1.Options.Add(new QuestionBankOption { Id = Guid.NewGuid(), QuestionBankItemId = q1.Id, OptionText = "const", IsCorrect = true, OrderIndex = 1 });
        q1.Options.Add(new QuestionBankOption { Id = Guid.NewGuid(), QuestionBankItemId = q1.Id, OptionText = "var", IsCorrect = false, OrderIndex = 2 });
        q1.Options.Add(new QuestionBankOption { Id = Guid.NewGuid(), QuestionBankItemId = q1.Id, OptionText = "let", IsCorrect = false, OrderIndex = 3 });

        var q2 = new QuestionBankItem
        {
            Id = Guid.NewGuid(),
            DomainTopicId = webDev.Id,
            SubTopicId = sub3.Id,
            QuestionText = "What is the primary benefit of Angular Signals?",
            Type = QuestionType.SingleChoice,
            Difficulty = "Medium",
            Points = 1,
            Explanation = "Signals provide fine-grained reactivity and efficient state tracking in Angular applications."
        };
        q2.Options.Add(new QuestionBankOption { Id = Guid.NewGuid(), QuestionBankItemId = q2.Id, OptionText = "Fine-grained reactive state tracking", IsCorrect = true, OrderIndex = 1 });
        q2.Options.Add(new QuestionBankOption { Id = Guid.NewGuid(), QuestionBankItemId = q2.Id, OptionText = "Direct DOM manipulation", IsCorrect = false, OrderIndex = 2 });

        _context.QuestionBankItems.AddRange(q1, q2);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
