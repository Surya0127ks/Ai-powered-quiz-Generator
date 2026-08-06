import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SectionService } from '../../../core/services/section.service';
import { Lesson, LessonType, Section } from '../../../core/models/section.model';

@Component({
  selector: 'app-section-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="curriculum-container">
      <header class="curriculum-header">
        <div>
          <a routerLink="/courses" class="back-link">← Back to Courses</a>
          <h1>Course Curriculum & Quiz Builder</h1>
          <p>Organize course modules, video lectures, quizzes, and test links for your students</p>
        </div>
        <button (click)="openAddSectionModal()" class="btn btn-primary">
          + Add Section / Module
        </button>
      </header>

      @if (copiedMessage()) {
        <div class="alert-toast">
          <span>✨ {{ copiedMessage() }}</span>
        </div>
      }

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div> Loading curriculum...
        </div>
      } @else if (sections().length === 0) {
        <div class="empty-state white-card">
          <div class="empty-icon">🧩</div>
          <h3>No Sections Yet</h3>
          <p>Start structuring your course by adding your first section or quiz module.</p>
          <button (click)="openAddSectionModal()" class="btn btn-primary margin-top">
            + Create First Section
          </button>
        </div>
      } @else {
        <div class="sections-list">
          @for (sec of sections(); track sec.id; let sIdx = $index) {
            <div class="section-card white-card">
              <div class="section-top">
                <div class="section-title">
                  <span class="section-badge">Section {{ sIdx + 1 }}</span>
                  <h3>{{ sec.title }}</h3>
                </div>
                <div class="section-actions">
                  <button (click)="openAddLessonModal(sec.id)" class="btn-sm btn-outline">+ Add Lesson / Quiz</button>
                  <button (click)="deleteSection(sec.id)" class="btn-sm btn-danger-icon">🗑️</button>
                </div>
              </div>

              @if (sec.description) {
                <p class="section-desc">{{ sec.description }}</p>
              }

              <!-- Lessons List -->
              <div class="lessons-list">
                @if (sec.lessons.length === 0) {
                  <div class="no-lessons">No lessons or quizzes in this section yet. Click "+ Add Lesson / Quiz".</div>
                } @else {
                  @for (les of sec.lessons; track les.id; let lIdx = $index) {
                    <div class="lesson-item">
                      <div class="lesson-left">
                        <span class="type-icon">{{ getLessonTypeIcon(les.type) }}</span>
                        <div class="lesson-info">
                          <div class="title-row">
                            <span class="lesson-title">{{ les.title }}</span>
                            <span class="type-pill">{{ getLessonTypeName(les.type) }}</span>
                            @if (les.isFreePreview) {
                              <span class="preview-badge">Free Preview</span>
                            }
                          </div>
                          <span class="lesson-meta">
                            {{ les.durationMinutes ? les.durationMinutes + ' mins duration' : 'Self-paced' }}
                          </span>
                        </div>
                      </div>

                      <div class="lesson-actions">
                        @if (les.type === LessonType.Quiz) {
                          <button (click)="copyQuizLink(les.id)" class="btn-sm btn-share">
                            📋 Copy Shareable Test Link
                          </button>
                          <a [routerLink]="['/lessons', les.id, 'quiz']" class="btn-sm btn-action">
                            ✏️ Take Quiz
                          </a>
                        }
                        @if (les.type === LessonType.Video) {
                          <a [routerLink]="['/lessons', les.id, 'watch']" class="btn-sm btn-action">
                            ▶ Watch Video
                          </a>
                        }
                        @if (les.type === LessonType.Assignment) {
                          <a [routerLink]="['/lessons', les.id, 'assignment']" class="btn-sm btn-action">
                            📑 Assignment
                          </a>
                        }
                        <button (click)="deleteLesson(les.id)" class="btn-icon">❌</button>
                      </div>
                    </div>
                  }
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Add Section Modal -->
      @if (showSectionModal()) {
        <div class="modal-backdrop">
          <div class="modal-card white-card">
            <h3>Add New Section / Module</h3>
            <form [formGroup]="sectionForm" (ngSubmit)="saveSection()" class="modal-form">
              <div class="form-group">
                <label>Section Title</label>
                <input type="text" formControlName="title" placeholder="e.g. Module 1: Core Fundamentals & Quizzes" class="form-control" />
              </div>
              <div class="form-group">
                <label>Description (Optional)</label>
                <input type="text" formControlName="description" placeholder="Short overview of section goals..." class="form-control" />
              </div>
              <div class="modal-actions">
                <button type="button" (click)="closeModals()" class="btn btn-secondary">Cancel</button>
                <button type="submit" [disabled]="sectionForm.invalid" class="btn btn-primary">Save Section</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Add Lesson / Quiz Modal -->
      @if (showLessonModal()) {
        <div class="modal-backdrop">
          <div class="modal-card white-card">
            <h3>Add New Lesson or Quiz</h3>
            <form [formGroup]="lessonForm" (ngSubmit)="saveLesson()" class="modal-form">
              <div class="form-group">
                <label>Lesson / Quiz Title</label>
                <input type="text" formControlName="title" placeholder="e.g. Midterm Quiz Assessment" class="form-control" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Type</label>
                  <select formControlName="type" class="form-control">
                    <option [value]="LessonType.Quiz">❓ Quiz Assessment</option>
                    <option [value]="LessonType.Video">🎥 Video Lecture</option>
                    <option [value]="LessonType.Text">📝 Article / Reading</option>
                    <option [value]="LessonType.Assignment">📑 Assignment</option>
                    <option [value]="LessonType.Attachment">📎 Attachment File</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Duration (Minutes)</label>
                  <input type="number" formControlName="durationMinutes" placeholder="15" class="form-control" />
                </div>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="isFreePreview" />
                  <span>Allow Free Preview for students</span>
                </label>
              </div>
              <div class="modal-actions">
                <button type="button" (click)="closeModals()" class="btn btn-secondary">Cancel</button>
                <button type="submit" [disabled]="lessonForm.invalid" class="btn btn-primary">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .curriculum-container { padding: 2.5rem 1.5rem; max-width: 1200px; margin: 0 auto; }
    .curriculum-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; }
    .back-link { color: #0284c7; text-decoration: none; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; display: inline-block; }
    .curriculum-header h1 { font-size: 2rem; font-weight: 800; color: #0f172a; margin: 0 0 0.25rem 0; }
    .curriculum-header p { color: #64748b; font-size: 0.95rem; margin: 0; }
    
    .alert-toast {
      background: #f0f9ff;
      border: 1px solid #0284c7;
      color: #0284c7;
      padding: 0.75rem 1.25rem;
      border-radius: 0.5rem;
      font-weight: 700;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    .empty-state { text-align: center; padding: 4rem 2rem; background: #ffffff; }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    .empty-state h3 { font-size: 1.5rem; color: #0f172a; margin-bottom: 0.5rem; }
    .empty-state p { color: #64748b; }
    
    .sections-list { display: flex; flex-direction: column; gap: 1.5rem; }
    .section-card { padding: 1.75rem; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.85rem; }
    .section-top { display: flex; justify-content: space-between; align-items: center; }
    .section-title { display: flex; align-items: center; gap: 0.75rem; h3 { font-size: 1.25rem; color: #0f172a; margin: 0; font-weight: 700; } }
    .section-badge { background: #e0f2fe; color: #0284c7; font-size: 0.78rem; font-weight: 700; padding: 0.3rem 0.75rem; border-radius: 9999px; }
    .section-actions { display: flex; gap: 0.65rem; }
    .section-desc { color: #64748b; font-size: 0.9rem; margin: 0.5rem 0 1rem 0; }
    
    .lessons-list { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.25rem; }
    .no-lessons { color: #94a3b8; font-size: 0.875rem; font-style: italic; padding: 0.75rem 0; }
    .lesson-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      padding: 0.85rem 1.1rem;
      border-radius: 0.65rem;
      border: 1px solid #e2e8f0;
    }
    .lesson-left { display: flex; align-items: center; gap: 0.85rem; }
    .type-icon { font-size: 1.3rem; }
    .lesson-info { display: flex; flex-direction: column; }
    .title-row { display: flex; align-items: center; gap: 0.6rem; }
    .lesson-title { font-weight: 700; font-size: 0.95rem; color: #0f172a; }
    .type-pill { background: #f1f5f9; color: #475569; font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 0.35rem; text-transform: uppercase; }
    .preview-badge { background: #d1fae5; color: #059669; padding: 0.15rem 0.5rem; border-radius: 0.35rem; font-size: 0.72rem; font-weight: 700; }
    .lesson-meta { font-size: 0.78rem; color: #64748b; margin-top: 0.15rem; }
    
    .lesson-actions { display: flex; align-items: center; gap: 0.6rem; }
    .btn-sm { padding: 0.45rem 0.85rem; font-size: 0.825rem; font-weight: 700; border-radius: 0.5rem; border: none; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .btn-share { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; &:hover { background: #fde68a; } }
    .btn-action { background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; &:hover { background: #bae6fd; } }
    .btn-outline { background: #ffffff; border: 1px solid #cbd5e1; color: #334155; &:hover { background: #f8fafc; color: #0f172a; } }
    .btn-danger-icon { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .btn-icon { background: none; border: none; cursor: pointer; opacity: 0.7; &:hover { opacity: 1; } }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-card { width: 100%; max-width: 520px; padding: 2.25rem; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 1rem; }
    .modal-card h3 { font-size: 1.35rem; color: #0f172a; margin-bottom: 1rem; }
    .modal-form { display: flex; flex-direction: column; gap: 1.1rem; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; label { font-size: 0.85rem; color: #334155; font-weight: 600; } }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-control { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 0.5rem; padding: 0.7rem 0.9rem; color: #0f172a; font-size: 0.9rem; outline: none; &:focus { border-color: #0284c7; } }
    .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.85rem; color: #334155; font-weight: 500; }
    
    .btn { padding: 0.75rem 1.35rem; border-radius: 0.5rem; font-weight: 700; cursor: pointer; border: none; font-size: 0.9rem; }
    .btn-primary { background: #0284c7; color: #fff; &:hover { background: #0369a1; } }
    .btn-secondary { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; &:hover { background: #e2e8f0; } }
  `]
})
export class SectionBuilderComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly sectionService = inject(SectionService);
  private readonly route = inject(ActivatedRoute);

  readonly LessonType = LessonType;
  readonly sections = this.sectionService.sections;
  readonly isLoading = signal(false);
  readonly showSectionModal = signal(false);
  readonly showLessonModal = signal(false);
  readonly copiedMessage = signal<string | null>(null);

  courseId!: string;
  activeSectionId: string | null = null;

  readonly sectionForm = this.fb.group({
    title: ['', Validators.required],
    description: ['']
  });

  readonly lessonForm = this.fb.group({
    title: ['', Validators.required],
    type: [LessonType.Quiz, Validators.required],
    durationMinutes: [15],
    isFreePreview: [false]
  });

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('id') || '';
    if (this.courseId) {
      this.loadSections();
    }
  }

  loadSections(): void {
    this.isLoading.set(true);
    this.sectionService.getSectionsByCourse(this.courseId).subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false)
    });
  }

  copyQuizLink(lessonId: string): void {
    const testUrl = `${window.location.origin}/lessons/${lessonId}/quiz`;
    navigator.clipboard.writeText(testUrl).then(() => {
      this.copiedMessage.set(`Shareable Quiz Link Copied: ${testUrl}`);
      setTimeout(() => this.copiedMessage.set(null), 4000);
    });
  }

  openAddSectionModal(): void {
    this.sectionForm.reset();
    this.showSectionModal.set(true);
  }

  openAddLessonModal(sectionId: string): void {
    this.activeSectionId = sectionId;
    this.lessonForm.reset({ type: LessonType.Quiz, durationMinutes: 15, isFreePreview: false });
    this.showLessonModal.set(true);
  }

  closeModals(): void {
    this.showSectionModal.set(false);
    this.showLessonModal.set(false);
  }

  saveSection(): void {
    if (this.sectionForm.invalid) return;
    const values = this.sectionForm.value;
    this.sectionService.createSection(this.courseId, {
      title: values.title!,
      description: values.description || undefined
    }).subscribe(() => {
      this.closeModals();
      this.loadSections();
    });
  }

  saveLesson(): void {
    if (this.lessonForm.invalid || !this.activeSectionId) return;
    const values = this.lessonForm.value;
    this.sectionService.createLesson(this.activeSectionId, {
      title: values.title!,
      type: values.type!,
      durationMinutes: values.durationMinutes || undefined,
      isFreePreview: !!values.isFreePreview
    }).subscribe(() => {
      this.closeModals();
      this.loadSections();
    });
  }

  deleteSection(sectionId: string): void {
    if (confirm('Delete section and all its lessons?')) {
      this.sectionService.deleteSection(sectionId).subscribe(() => this.loadSections());
    }
  }

  deleteLesson(lessonId: string): void {
    if (confirm('Delete lesson?')) {
      this.sectionService.deleteLesson(lessonId).subscribe(() => this.loadSections());
    }
  }

  getLessonTypeIcon(type: LessonType): string {
    switch (type) {
      case LessonType.Video: return '🎥';
      case LessonType.Text: return '📝';
      case LessonType.Quiz: return '❓';
      case LessonType.Assignment: return '📑';
      default: return '📎';
    }
  }

  getLessonTypeName(type: LessonType): string {
    switch (type) {
      case LessonType.Video: return 'Video Lecture';
      case LessonType.Text: return 'Reading Article';
      case LessonType.Quiz: return 'Quiz Test';
      case LessonType.Assignment: return 'Assignment';
      default: return 'Attachment';
    }
  }
}
