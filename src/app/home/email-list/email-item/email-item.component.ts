import { Component, Input } from '@angular/core';
import { EmailData } from '../../../shared/interfaces/email-data.interface';
import { EventService } from '../../../services/shared/event.service';
import { StorageService } from '../../../services/shared/storage.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-email-item',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, CommonModule],
  templateUrl: './email-item.component.html',
  styleUrl: './email-item.component.scss'
})

export class EmailItemComponent {
  @Input() email!: EmailData;

  constructor(
    private eventService: EventService,
    private storageService: StorageService
  ) { }

  onViewEmail(): void {
    this.eventService.notifyAnalysisStored(this.email);
  }

  async onDeleteEmail(): Promise<void> {
    await this.storageService.removeData(this.email);
    this.eventService.notifyEmailDeleted(this.email);
  }
}