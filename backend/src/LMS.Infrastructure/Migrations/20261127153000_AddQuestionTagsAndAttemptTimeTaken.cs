using LMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LMS.Infrastructure.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261127153000_AddQuestionTagsAndAttemptTimeTaken")]
public partial class AddQuestionTagsAndAttemptTimeTaken : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Tag",
            table: "QuizQuestions",
            type: "character varying(60)",
            maxLength: 60,
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "TimeTakenSeconds",
            table: "QuizAttempts",
            type: "integer",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "Tag",
            table: "QuizQuestions");

        migrationBuilder.DropColumn(
            name: "TimeTakenSeconds",
            table: "QuizAttempts");
    }
}
