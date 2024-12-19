import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventService } from '../../services/shared/event.service';

@Component({
  selector: 'app-drop-zone',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drop-zone.component.html',
  styleUrl: './drop-zone.component.scss'
})
export class DropZoneComponent {
  isHovered: boolean = false;
  errorMessage: string | null = null;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(private eventService: EventService) { }

  handleDrop(event: DragEvent): void {
    this.isHovered = false;
    this.errorMessage = null;

    if (!event.dataTransfer) {
      console.error("No dataTransfer found on the event.");
      return;
    }

    event.preventDefault(); // prevent file from being opened
    const files = this.getFilesFromDataTransfer(event.dataTransfer);

    if (files.length > 0) {
      this.eventService.notifyFilesDropped(files);
    } else if (!this.errorMessage) {
      this.errorMessage = "No valid .eml files were dropped.";
    }
  }

  handleDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isHovered = true;
  }

  handleDragLeave(): void {
    this.isHovered = false;
  }

  isEmlFile(file: File): boolean {
    return file.type === "message/rfc822" || file.name.endsWith(".eml");
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  handleFileSelection(event: Event): void {
    this.errorMessage = null;
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = this.getFilesFromFileList(input.files);

      if (files.length > 0) {
        this.eventService.notifyFilesDropped(files);
      } else {
        this.errorMessage = 'No valid .eml files were selected.';
      }
    }
  }

  private getFilesFromDataTransfer(dataTransfer: DataTransfer): File[] {
    const files: File[] = [];
    for (let i = 0; i < dataTransfer.items.length; i++) {
      const item = dataTransfer.items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file && this.isEmlFile(file)) {
          files.push(file);
        } else if (file && !this.isEmlFile(file)) {
          this.errorMessage = 'One or more files are not .eml files.';
        }
      } else {
        this.errorMessage = 'Directories are not allowed.';
      }
    }
    return files;
  }

  private getFilesFromFileList(fileList: FileList): File[] {
    const files: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (this.isEmlFile(file)) {
        files.push(file);
      } else {
        this.errorMessage = 'One or more files are not .eml files.';
      }
    }
    return files;
  }
}
