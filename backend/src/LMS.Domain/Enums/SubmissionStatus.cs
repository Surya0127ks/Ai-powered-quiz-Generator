namespace LMS.Domain.Enums;

/// <summary>
/// Defines the grading status of an assignment submission.
/// </summary>
public enum SubmissionStatus
{
    /// <summary>
    /// Submitted by student and waiting for instructor evaluation.
    /// </summary>
    Pending = 1,

    /// <summary>
    /// Evaluated and graded by instructor.
    /// </summary>
    Graded = 2,

    /// <summary>
    /// Instructor requested a resubmission.
    /// </summary>
    ResubmissionRequired = 3
}
