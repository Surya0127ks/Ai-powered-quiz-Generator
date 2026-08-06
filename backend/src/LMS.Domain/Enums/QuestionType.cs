namespace LMS.Domain.Enums;

/// <summary>
/// Defines the type of question in a quiz.
/// </summary>
public enum QuestionType
{
    /// <summary>
    /// Single choice question (Radio button selection).
    /// </summary>
    SingleChoice = 1,

    /// <summary>
    /// Multiple choice question (Checkbox selection).
    /// </summary>
    MultipleChoice = 2,

    /// <summary>
    /// True or False question.
    /// </summary>
    TrueFalse = 3
}
