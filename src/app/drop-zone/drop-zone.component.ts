import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventService } from '../services/shared/event.service';

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
    const item = event.dataTransfer.items[0];

    if (event.dataTransfer.items.length > 1 || !item) {
      this.errorMessage = "Please drop only one file.";
      return;
    }

    if (item.kind === "file") {
      const file = item.getAsFile();
      if (file) {
        if (this.isEmlFile(file)) {
          this.eventService.notifyFileDropped(file);
        } else {
          this.errorMessage = "Please drop a .eml file.";
        }
      }
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
