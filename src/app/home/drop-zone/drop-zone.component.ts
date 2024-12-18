import { Component, EventEmitter, Output } from '@angular/core';
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

  constructor(private eventService: EventService) { }

  handleDrop(event: DragEvent): void {
    this.isHovered = false;
    this.errorMessage = null;

    if (!event.dataTransfer) {
      console.error("No dataTransfer found on the event.");
      return;
    }

    event.preventDefault(); // prevent file from being opened
    const files: File[] = [];

    if (event.dataTransfer.items) {
      for (let i = 0; i < event.dataTransfer.items.length; i++) {
        const item = event.dataTransfer.items[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file && this.isEmlFile(file)) {
            files.push(file);
          } else if (file && !this.isEmlFile(file)) {
            this.errorMessage = "One or more files are not .eml files.";
          }
        }
      }
    } else if (event.dataTransfer.files) {
      for (let i = 0; i < event.dataTransfer.files.length; i++) {
        const file = event.dataTransfer.files[i];
        if (this.isEmlFile(file)) {
          files.push(file);
        } else {
          this.errorMessage = "One or more files are not .eml files.";
        }
      }
    }

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
}
