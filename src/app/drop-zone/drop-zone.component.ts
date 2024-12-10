import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-drop-zone',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drop-zone.component.html',
  styleUrl: './drop-zone.component.scss'
})
export class DropZoneComponent {
  showQuantityErrorMessage = false;
  showFileErrorMessage = false;

  handleDrop(event: DragEvent): void {
    this.showFileErrorMessage = false;

    if (!event.dataTransfer) {
      console.error("No dataTransfer found on the event.");
      return;
    }

    event.preventDefault(); // prevent file from being opened

    if (event.dataTransfer.items) {
      const item = event.dataTransfer.items[0];

      if (event.dataTransfer.items.length > 1 || !item) {
        this.showQuantityErrorMessage = true;
        return;
      }

      this.showQuantityErrorMessage = false;

      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          if (this.isEmlFile(file)) {
          } else {
            this.showFileErrorMessage = true;
          }
        }
      }
    } else {
      const file = event.dataTransfer.files[0];

      if (event.dataTransfer.files.length > 1 || !file) {
        this.showQuantityErrorMessage = true;
        return;
      }

      this.showQuantityErrorMessage = false;

      if (this.isEmlFile(file)) {
      } else {
        this.showFileErrorMessage = true;
      }
    }
  }

  handleDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  isEmlFile(file: File): boolean {
    return file.type === "message/rfc822" || file.name.endsWith(".eml");
  }
}
