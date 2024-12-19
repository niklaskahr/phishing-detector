import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmailItemComponent } from './email-item/email-item.component';
import { StorageService } from '../services/shared/storage.service';
import { EmailData } from '../shared/interfaces/email-data.interface';
import { EventService } from '../services/shared/event.service';

@Component({
  selector: 'app-email-list',
  standalone: true,
  imports: [CommonModule, EmailItemComponent],
  templateUrl: './email-list.component.html',
  styleUrl: './email-list.component.scss'
})
export class EmailListComponent implements OnInit {
  emails: EmailData[] = [];

  constructor(
    private eventService: EventService,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.emails = this.storageService.getData();

    this.eventService.emailDeleted$.subscribe(() => {
      this.emails = this.storageService.getData();
    });

    this.eventService.analysisStored$.subscribe(() => {
      this.emails = this.storageService.getData();
    });
  }
}