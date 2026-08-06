import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AssignmentService } from '../../../core/services/assignment.service';
import { Assignment, SubmissionStatus } from '../../../core/models/assignment.model';

@Component({
  selector: 'app-assignment-view',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="assignment-container">
      <header class="assignment-header">
        <a routerLink="/courses" class="back-link">← Back to Course</a>
        @if (assignment()) {
          <div class="header-main">
            <h1>{{ assignment()?.title }}</h1>
            <div class="header-meta">
              <span class="meta-badge">Max Marks: {{ assignment()?.maxMarks }}</span>
              @if (assignment()?.dueDateUtc) {
                <span class="meta-due">Due: {{ assignment()?.dueDateUtc | date:'medium' }}</span>
              }
            </div>
          </div>
        }
      </header>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div> Loading assignment details...
        </div>
      } @else if (assignment()) {
        <div class="content-layout">
          <!-- Instructions Card -->
          <div class="instructions-card glass-panel">
            <h3>Assignment Instructions</h3>
            <div class="instructions-text">
              {{ assignment()?.instructions }}
            </div>

            @if (assignment()?.attachmentUrl) {
              <div class="resource-attachment">
                📌 <strong>Attachment Reference:</strong>
                <a [href]="assignment()?.attachmentUrl" target="_blank" class="download-link">
                  Download Guide / Template Resource
                </a>
              </div>
            }
          </div>

          <!-- Submission & Grading Status Card -->
          <div class="submission-card glass-panel margin-top">
            <div class="submission-header">
              <h3>Your Submission</h3>
              @if (assignment()?.mySubmission) {
                <span class="status-badge" [class.graded]="assignment()?.mySubmission?.status === SubmissionStatus.Graded">
                  {{ getStatusLabel(assignment()?.mySubmission?.status) }}
                </span>
              }
            </div>

            @if (assignment()?.mySubmission?.status === SubmissionStatus.Graded) {
              <div class="graded-result-box">
                <div class="grade-score">
                  <span class="earned-score">{{ assignment()?.mySubmission?.earnedMarks }}</span>
                  <span class="total-score">/ {{ assignment()?.maxMarks }} Marks</span>
                </div>
                @if (assignment()?.mySubmission?.feedback) {
                  <div class="feedback-box">
                    💬 <strong>Instructor Feedback:</strong>
                    <p>{{ assignment()?.mySubmission?.feedback }}</p>
                  </div>
                }
              </div>
            }

            <form [formGroup]="submitForm" (ngSubmit)="onSubmit()" class="submission-form">
              <div class="form-group">
                <label>Written Submission / Response</label>
                <textarea
                  formControlName="content"
                  rows="6"
                  placeholder="Type your solution, code walkthrough, or written answer here..."
                  class="form-control"
                ></textarea>
              </div>

              <!-- Cloudinary File Upload Placeholder -->
              <div class="form-group">
                <label>Attach Project / Document File (Cloudinary Storage)</label>
                <input
                  type="text"
                  formControlName="attachmentUrl"
                  placeholder="https://res.cloudinary.com/lms-cloud/raw/upload/v1/assignment_file.pdf"
                  class="form-control"
                />
                <span class="field-help">Placeholder Cloudinary CDN file URL or upload endpoint link.</span>
              </div>

              <div class="form-actions">
                <button type="submit" [disabled]="submitForm.invalid || isSubmitting()" class="btn btn-primary">
                  {{ isSubmitting() ? 'Submitting...' : (assignment()?.mySubmission ? 'Resubmit Assignment' : 'Submit Assignment') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .assignment-container { padding: 2.5rem 1.5rem; max-width: 1000px; margin: 0 auto; color: #f8fafc; }
    .assignment-header { margin-bottom: 2rem; }
    .back-link { color: #38bdf8; text-decoration: none; font-size: 0.875rem; margin-bottom: 0.5rem; display: inline-block; }
    .header-main { display: flex; justify-content: space-between; align-items: flex-end; h1 { font-size: 2rem; margin: 0; } }
    .header-meta { display: flex; gap: 0.75rem; align-items: center; }
    .meta-badge { background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-size: 0.8rem; font-weight: 700; padding: 0.35rem 0.75rem; border-radius: 0.375rem; }
    .meta-due { color: #fca5a5; font-size: 0.85rem; font-weight: 600; }
    .glass-panel { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 1rem; padding: 2rem; }
    .instructions-card { h3 { font-size: 1.25rem; margin: 0 0 1rem 0; color: #38bdf8; } }
    .instructions-text { line-height: 1.6; color: #cbd5e1; white-space: pre-line; }
    .resource-attachment { margin-top: 1.25rem; padding: 0.85rem; background: rgba(15, 23, 42, 0.6); border-radius: 0.5rem; font-size: 0.85rem; }
    .download-link { color: #38bdf8; text-decoration: none; font-weight: 600; margin-left: 0.35rem; }
    .margin-top { margin-top: 2rem; }
    .submission-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; h3 { font-size: 1.25rem; margin: 0; } }
    .status-badge { padding: 0.35rem 0.85rem; border-radius: 9999px; font-weight: 700; font-size: 0.8rem; background: rgba(234, 179, 8, 0.2); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.4); }
    .status-badge.graded { background: rgba(16, 185, 129, 0.2); color: #34d399; border-color: rgba(16, 185, 129, 0.4); }
    .graded-result-box { background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 0.75rem; padding: 1.25rem; margin-bottom: 1.5rem; }
    .grade-score { display: flex; align-items: baseline; gap: 0.35rem; margin-bottom: 0.5rem; }
    .earned-score { font-size: 2.25rem; font-weight: 800; color: #34d399; }
    .total-score { font-size: 1.1rem; color: #94a3b8; }
    .feedback-box { color: #e2e8f0; font-size: 0.9rem; p { margin: 0.35rem 0 0 0; color: #cbd5e1; } }
    .submission-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; label { font-size: 0.85rem; color: #cbd5e1; } }
    .form-control { background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 0.5rem; padding: 0.75rem; color: #f8fafc; outline: none; font-family: inherit; }
    .field-help { font-size: 0.75rem; color: #64748b; }
    .form-actions { display: flex; justify-content: flex-end; }
    .btn { padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer; border: none; }
    .btn-primary { background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); color: #fff; }
    .loading-state { padding: 4rem; text-align: center; color: #94a3b8; }
  `]
})
export class AssignmentViewComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly assignmentService = inject(AssignmentService);
  private readonly route = inject(ActivatedRoute);

  readonly SubmissionStatus = SubmissionStatus;
  readonly assignment = this.assignmentService.currentAssignment;
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);

  lessonId!: string;

  readonly submitForm = this.fb.group({
    content: ['', Validators.required],
    attachmentUrl: ['https://res.cloudinary.com/lms-cloud/raw/upload/v1/assignment_submission_placeholder.pdf']
  });

  ngOnInit(): void {
    this.lessonId = this.route.snapshot.paramMap.get('id') || '';
    if (this.lessonId) {
      this.loadAssignment();
    }
  }

  loadAssignment(): void {
    this.isLoading.set(true);
    this.assignmentService.getAssignmentByLesson(this.lessonId).subscribe({
      next: (asgn) => {
        this.isLoading.set(false);
        if (asgn && asgn.mySubmission) {
          this.submitForm.patchValue({
            content: asgn.mySubmission.content || '',
            attachmentUrl: asgn.mySubmission.attachmentUrl || ''
          });
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

  onSubmit(): void {
    if (this.submitForm.invalid || !this.assignment()) return;
    this.isSubmitting.set(true);
    const values = this.submitForm.value;

    this.assignmentService.submitAssignment(this.assignment()!.id, {
      content: values.content || undefined,
      attachmentUrl: values.attachmentUrl || undefined
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.loadAssignment();
      },
      error: () => this.isSubmitting.set(false)
    });
  }

  getStatusLabel(status?: SubmissionStatus): string {
    switch (status) {
      case SubmissionStatus.Graded: return '✓ Graded';
      case SubmissionStatus.ResubmissionRequired: return '⚠️ Resubmission Required';
      default: return '⏳ Pending Review';
    }
  }
}
