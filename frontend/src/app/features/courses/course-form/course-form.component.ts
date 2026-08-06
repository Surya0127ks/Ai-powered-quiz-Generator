import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { Category, CourseLevel } from '../../../core/models/course.model';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="form-page-container">
      <div class="form-card glass-panel">
        <header class="form-header">
          <h2>{{ isEditMode() ? 'Edit Course' : 'Create New Course' }}</h2>
          <p>Fill in the course details below</p>
        </header>

        @if (errorMessage()) {
          <div class="alert alert-error">
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form [formGroup]="courseForm" (ngSubmit)="onSubmit()" class="course-form">
          <div class="form-group">
            <label for="title">Course Title</label>
            <input id="title" type="text" formControlName="title" placeholder="e.g. Master Angular 20 & ASP.NET Core 9" class="form-control" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="categoryId">Category</label>
              <select id="categoryId" formControlName="categoryId" class="form-control">
                <option value="">Select Category</option>
                @for (cat of categories(); track cat.id) {
                  <option [value]="cat.id">{{ cat.name }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label for="level">Difficulty Level</label>
              <select id="level" formControlName="level" class="form-control">
                <option [value]="CourseLevel.Beginner">Beginner</option>
                <option [value]="CourseLevel.Intermediate">Intermediate</option>
                <option [value]="CourseLevel.Advanced">Advanced</option>
                <option [value]="CourseLevel.AllLevels">All Skill Levels</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="shortDescription">Short Summary</label>
            <input id="shortDescription" type="text" formControlName="shortDescription" placeholder="Brief overview of course contents..." class="form-control" />
          </div>

          <div class="form-group">
            <label for="description">Full Description</label>
            <textarea id="description" formControlName="description" rows="5" placeholder="Detailed course syllabus, prerequisites, and learning outcomes..." class="form-control"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="language">Language</label>
              <input id="language" type="text" formControlName="language" class="form-control" placeholder="English" />
            </div>

            <div class="form-group">
              <label for="currency">Currency</label>
              <input id="currency" type="text" formControlName="currency" class="form-control" placeholder="USD" />
            </div>
          </div>

          <!-- Pricing Section -->
          <div class="pricing-card glass-panel">
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" formControlName="isFree" (change)="onIsFreeChange()" />
                <span>This is a Free Course</span>
              </label>
            </div>

            @if (!courseForm.get('isFree')?.value) {
              <div class="form-row margin-top">
                <div class="form-group">
                  <label for="price">Regular Price ($)</label>
                  <input id="price" type="number" formControlName="price" class="form-control" placeholder="99.99" />
                </div>

                <div class="form-group">
                  <label for="discountPrice">Discount Price ($)</label>
                  <input id="discountPrice" type="number" formControlName="discountPrice" class="form-control" placeholder="49.99" />
                </div>
              </div>
            }
          </div>

          <!-- Cloudinary Thumbnail Placeholder -->
          <div class="form-group">
            <label for="thumbnailUrl">Course Thumbnail URL (Cloudinary Placeholder)</label>
            <input id="thumbnailUrl" type="text" formControlName="thumbnailUrl" placeholder="https://res.cloudinary.com/demo/image/upload/sample.jpg" class="form-control" />
            <small class="help-text">Using Cloudinary CDN URL placeholder. Cloudinary API key configured in env files.</small>
          </div>

          <div class="form-actions">
            <a routerLink="/courses" class="btn btn-secondary">Cancel</a>
            <button type="submit" class="btn btn-primary" [disabled]="courseForm.invalid || isLoading()">
              @if (isLoading()) {
                <span class="spinner"></span> Saving...
              } @else {
                {{ isEditMode() ? 'Update Course' : 'Create Course' }}
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-page-container {
      padding: 2.5rem 1.5rem;
      max-width: 800px;
      margin: 0 auto;
    }
    .glass-panel {
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 1rem;
      padding: 2.5rem;
    }
    .form-header {
      margin-bottom: 2rem;
      h2 { color: #f8fafc; font-size: 1.75rem; }
      p { color: #94a3b8; font-size: 0.875rem; }
    }
    .alert-error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .course-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      label { color: #cbd5e1; font-size: 0.875rem; font-weight: 500; }
      .form-control {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 0.5rem;
        padding: 0.75rem 1rem;
        color: #f8fafc;
        font-size: 0.95rem;
        outline: none;
        &:focus { border-color: #38bdf8; }
      }
      .help-text { color: #64748b; font-size: 0.75rem; margin-top: 0.25rem; }
    }
    .pricing-card {
      padding: 1.25rem;
      background: rgba(15, 23, 42, 0.4);
      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #f8fafc;
        cursor: pointer;
      }
    }
    .margin-top { margin-top: 1rem; }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      text-decoration: none;
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: #f8fafc;
      &:hover { background: rgba(255, 255, 255, 0.15); }
    }
    .btn-primary {
      background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
      color: #fff;
      &:hover:not(:disabled) { opacity: 0.95; }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
  `]
})
export class CourseFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly courseService = inject(CourseService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly CourseLevel = CourseLevel;
  readonly categories = this.courseService.categories;
  readonly isEditMode = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  courseId: string | null = null;

  readonly courseForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    categoryId: ['', Validators.required],
    level: [CourseLevel.Beginner, Validators.required],
    shortDescription: ['', [Validators.required, Validators.maxLength(500)]],
    description: ['', Validators.required],
    language: ['English', Validators.required],
    currency: ['USD', Validators.required],
    isFree: [false],
    price: [49.99, [Validators.min(0)]],
    discountPrice: [null as number | null],
    thumbnailUrl: ['https://res.cloudinary.com/demo/image/upload/sample.jpg']
  });

  ngOnInit(): void {
    this.courseService.getCategories().subscribe();

    this.courseId = this.route.snapshot.paramMap.get('id');
    if (this.courseId) {
      this.isEditMode.set(true);
      this.loadCourse(this.courseId);
    }
  }

  loadCourse(id: string): void {
    this.isLoading.set(true);
    this.courseService.getCourseById(id).subscribe({
      next: (course) => {
        this.isLoading.set(false);
        this.courseForm.patchValue({
          title: course.title,
          categoryId: course.categoryId,
          level: course.level,
          shortDescription: course.shortDescription,
          description: course.description,
          language: course.language,
          currency: course.currency,
          isFree: course.isFree,
          price: course.price,
          discountPrice: course.discountPrice,
          thumbnailUrl: course.thumbnailUrl
        });
      },
      error: () => this.isLoading.set(false)
    });
  }

  onIsFreeChange(): void {
    if (this.courseForm.get('isFree')?.value) {
      this.courseForm.patchValue({ price: 0, discountPrice: null });
    }
  }

  onSubmit(): void {
    if (this.courseForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const values = this.courseForm.value;
    const payload = {
      categoryId: values.categoryId!,
      title: values.title!,
      shortDescription: values.shortDescription!,
      description: values.description!,
      level: values.level!,
      language: values.language!,
      thumbnailUrl: values.thumbnailUrl || undefined,
      price: values.isFree ? 0 : (values.price || 0),
      discountPrice: values.isFree ? undefined : (values.discountPrice || undefined),
      isFree: !!values.isFree,
      currency: values.currency!
    };

    const request$ = this.isEditMode() && this.courseId
      ? this.courseService.updateCourse(this.courseId, payload)
      : this.courseService.createCourse(payload);

    request$.subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/courses']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to save course.');
      }
    });
  }
}
