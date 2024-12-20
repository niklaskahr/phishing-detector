import { Component, OnInit } from '@angular/core';
import { DropZoneComponent } from './drop-zone/drop-zone.component';
import { ReportComponent } from './report/report.component';
import { EmailListComponent } from './email-list/email-list.component';
import { EmailData } from '../shared/interfaces/email-data.interface';
import { EventService } from '../services/shared/event.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DropZoneComponent, ReportComponent, EmailListComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  selectedEmail: EmailData | null = null;

  constructor(private eventService: EventService) {}

  ngOnInit(): void {
    this.eventService.analysisStored$.subscribe((email: EmailData) => {
      this.selectedEmail = email;
    });

    this.eventService.emailDeleted$.subscribe((deletedEmail: EmailData) => {
      if (this.selectedEmail?.email === deletedEmail.email) {
        this.selectedEmail = null;
      }
    });
  }

  onEmailSelected(email: EmailData): void {
    this.selectedEmail = email;
  }
}