using LMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LMS.Infrastructure.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261116170000_PreserveFractionalQuizMarks")]
public partial class PreserveFractionalQuizMarks : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterColumn<decimal>(
            name: "TotalPointsEarned",
            table: "QuizAttempts",
            type: "numeric(10,2)",
            precision: 10,
            scale: 2,
            nullable: false,
            oldClrType: typeof(int),
            oldType: "integer");

        migrationBuilder.AlterColumn<decimal>(
            name: "PointsEarned",
            table: "QuizAttemptAnswers",
            type: "numeric(10,2)",
            precision: 10,
            scale: 2,
            nullable: false,
            oldClrType: typeof(int),
            oldType: "integer");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterColumn<int>(
            name: "TotalPointsEarned",
            table: "QuizAttempts",
            type: "integer",
            nullable: false,
            oldClrType: typeof(decimal),
            oldType: "numeric(10,2)",
            oldPrecision: 10,
            oldScale: 2);

        migrationBuilder.AlterColumn<int>(
            name: "PointsEarned",
            table: "QuizAttemptAnswers",
            type: "integer",
            nullable: false,
            oldClrType: typeof(decimal),
            oldType: "numeric(10,2)",
            oldPrecision: 10,
            oldScale: 2);
    }
}
