using LMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LMS.Infrastructure.Persistence.Configurations;

public class VideoMetadataConfiguration : IEntityTypeConfiguration<VideoMetadata>
{
    public void Configure(EntityTypeBuilder<VideoMetadata> builder)
    {
        builder.HasKey(v => v.Id);

        builder.Property(v => v.VideoUrl)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(v => v.PlaybackUrl)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(v => v.PublicId)
            .HasMaxLength(250);

        builder.Property(v => v.Resolution)
            .HasMaxLength(50);

        builder.HasIndex(v => v.LessonId)
            .IsUnique();

        builder.HasOne(v => v.Lesson)
            .WithMany()
            .HasForeignKey(v => v.LessonId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class UserVideoProgressConfiguration : IEntityTypeConfiguration<UserVideoProgress>
{
    public void Configure(EntityTypeBuilder<UserVideoProgress> builder)
    {
        builder.HasKey(p => p.Id);

        builder.HasIndex(p => new { p.UserId, p.LessonId })
            .IsUnique();

        builder.HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.Lesson)
            .WithMany()
            .HasForeignKey(p => p.LessonId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
