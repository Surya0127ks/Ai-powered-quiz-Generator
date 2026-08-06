namespace LMS.Application.Common.Models;

/// <summary>
/// Represents the outcome of an operation, encapsulating success/failure status and errors.
/// </summary>
public class Result
{
    public bool IsSuccess { get; }
    public string[] Errors { get; }
    public string? Error => Errors.FirstOrDefault();

    protected Result(bool isSuccess, string[] errors)
    {
        IsSuccess = isSuccess;
        Errors = errors ?? [];
    }

    /// <summary>
    /// Creates a successful result.
    /// </summary>
    public static Result Success() => new(true, []);

    /// <summary>
    /// Creates a failed result with the specified errors.
    /// </summary>
    /// <param name="errors">The error messages.</param>
    public static Result Failure(params string[] errors) => new(false, errors);

    /// <summary>
    /// Creates a successful result with a value.
    /// </summary>
    /// <typeparam name="T">The type of the value.</typeparam>
    /// <param name="value">The value to wrap.</param>
    public static Result<T> Success<T>(T value) => new(value, true, []);

    /// <summary>
    /// Creates a failed result with a value type and errors.
    /// </summary>
    /// <typeparam name="T">The type of the value.</typeparam>
    /// <param name="errors">The error messages.</param>
    public static Result<T> Failure<T>(params string[] errors) => new(default, false, errors);
}

/// <summary>
/// Represents the outcome of an operation with a value.
/// </summary>
/// <typeparam name="T">The type of the value.</typeparam>
public class Result<T> : Result
{
    public T? Value { get; }

    internal Result(T? value, bool isSuccess, string[] errors)
        : base(isSuccess, errors)
    {
        Value = value;
    }
}