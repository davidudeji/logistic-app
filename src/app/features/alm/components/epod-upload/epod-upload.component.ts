import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EpodService } from '../../services/epod.service';
import { EpodSubmissionResponse } from '../../models/epod-audit.model';

@Component({
  selector: 'app-epod-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="epod-card">
      <div class="card-header">
        <h4 class="card-title">Electronic Proof of Delivery (ePOD)</h4>
        <span class="card-subtitle">Upload signed receipt or parcel handover photo</span>
      </div>

      <!-- Drag & Drop Zone / File Picker -->
      <div
        class="dropzone"
        [class.has-file]="!!selectedFile()"
        [class.dragover]="isDragging()"
        (dragover)="onDragOver($event)"
        (dragleave)="isDragging.set(false)"
        (drop)="onDrop($event)"
      >
        @if (imagePreviewUrl()) {
          <div class="preview-wrapper">
            <img [src]="imagePreviewUrl()" alt="Proof of delivery preview" class="preview-img" />
            <button type="button" class="btn-remove-img" (click)="removeSelectedFile()">Remove</button>
          </div>
        } @else {
          <div class="drop-prompt">
            <svg class="upload-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <div class="prompt-text">Drag & drop document photo or click to browse</div>
            <div class="prompt-hint">Supports JPEG, PNG, WebP up to 10 MB</div>
            <input
              type="file"
              #fileInput
              class="hidden-file-input"
              accept="image/jpeg,image/png,image/webp"
              (change)="onFileSelected($event)"
            />
            <button type="button" class="btn btn-secondary btn-sm" (click)="fileInput.click()">
              Select Document
            </button>
          </div>
        }
      </div>

      <!-- Extra Information -->
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Receiver Name</label>
          <input
            type="text"
            class="form-input"
            placeholder="e.g. Adeola Adeleke"
            [(ngModel)]="receiverName"
          />
        </div>
        <div class="form-group">
          <label class="form-label">Delivery Notes</label>
          <input
            type="text"
            class="form-input"
            placeholder="e.g. Left at security desk, package intact"
            [(ngModel)]="deliveryNotes"
          />
        </div>
      </div>

      <!-- Validation Error -->
      @if (epodService.uploadError(); as err) {
        <div class="error-box">{{ err }}</div>
      }

      <!-- Action Button -->
      <div class="action-row">
        <button
          type="button"
          class="btn btn-primary"
          [disabled]="!selectedFile() || epodService.isUploading()"
          (click)="onSubmitEpod()"
        >
          @if (epodService.isUploading()) {
            Uploading & Running AI Audit...
          } @else {
            Submit Proof of Delivery
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .epod-card {
      background: #fbfbfb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .card-header {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .card-title {
      font-size: 15px;
      margin: 0;
      color: #000000;
    }

    .card-subtitle {
      font-size: 12px;
      color: #666666;
    }

    .dropzone {
      border: 1.5px dashed #cccccc;
      border-radius: 6px;
      padding: 20px;
      text-align: center;
      background: #fafafa;
      position: relative;
      transition: border-color 150ms ease;
    }

    .dropzone.dragover {
      border-color: #000000;
      background: #f0f0f0;
    }

    .drop-prompt {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .upload-icon {
      color: #888888;
    }

    .prompt-text {
      font-size: 13px;
      font-weight: 500;
      color: #222222;
    }

    .prompt-hint {
      font-size: 11px;
      color: #888888;
    }

    .hidden-file-input {
      display: none;
    }

    .preview-wrapper {
      position: relative;
      display: inline-block;
      max-width: 100%;
    }

    .preview-img {
      max-height: 220px;
      max-width: 100%;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
      object-fit: cover;
    }

    .btn-remove-img {
      position: absolute;
      top: 6px;
      right: 6px;
      background: rgba(0, 0, 0, 0.7);
      color: #ffffff;
      border: none;
      border-radius: 3px;
      padding: 3px 8px;
      font-size: 11px;
      cursor: pointer;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .error-box {
      padding: 8px 12px;
      background: rgba(124, 31, 31, 0.05);
      border: 1px solid #7c1f1f;
      color: #7c1f1f;
      border-radius: 4px;
      font-size: 12px;
    }

    .action-row {
      display: flex;
      justify-content: flex-end;
    }

    @media (max-width: 600px) {
      .form-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class EpodUploadComponent {
  readonly epodService = inject(EpodService);

  @Input() deliveryId = 'DEL-001';
  @Output() epodUploaded = new EventEmitter<EpodSubmissionResponse>();

  receiverName = '';
  deliveryNotes = '';
  readonly selectedFile = signal<File | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);
  readonly isDragging = signal<boolean>(false);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (event.dataTransfer?.files.length) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    const validation = this.epodService.validateImageFile(file);
    if (!validation.valid) {
      this.epodService.uploadError.set(validation.error || 'Invalid file');
      return;
    }

    this.selectedFile.set(file);
    this.epodService.uploadError.set(null);

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreviewUrl.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeSelectedFile(): void {
    this.selectedFile.set(null);
    this.imagePreviewUrl.set(null);
  }

  onSubmitEpod(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.epodService
      .submitEpod(this.deliveryId, {
        image: file,
        receiverName: this.receiverName || undefined,
        deliveryNotes: this.deliveryNotes || undefined,
        capturedAt: new Date().toISOString(),
        clientMutationId: `mut_${Date.now()}`,
      })
      .subscribe({
        next: (res) => {
          this.epodUploaded.emit(res);
        },
      });
  }
}
