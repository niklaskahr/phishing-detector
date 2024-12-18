import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmailData } from '../../shared/interfaces/email-data.interface';
import { EventService } from '../../services/shared/event.service';
import { StorageService } from '../../services/shared/storage.service';
import { TrustworthinessGaugeComponent } from './trustworthiness-gauge/trustworthiness-gauge.component';
@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, TrustworthinessGaugeComponent],
  templateUrl: './report.component.html',
  styleUrl: './report.component.scss'
})
export class ReportComponent implements OnInit {
  hasBeenAssessed: boolean = false;
  mostRecentAnalysis: EmailData | undefined;

  constructor(
    private eventService: EventService,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.eventService.analysisStored$.subscribe((data: EmailData) => {
      this.mostRecentAnalysis = data;
      this.hasBeenAssessed = true;
    });
  }
}