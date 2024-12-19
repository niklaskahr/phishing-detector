import { Component, Input, OnInit } from '@angular/core';
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
  @Input() email: EmailData | null = null;
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

  get trustworthinessScore(): number {
    return this.email?.assessment?.trustworthiness ?? 0;
  }

  get riskLevel(): string {
    const level = this.mostRecentAnalysis?.assessment.riskLevel ?? 'Unknown';
    return level.charAt(0).toUpperCase() + level.slice(1);
  }

  get fileSize(): string | null {
    const sizeInBytes = this.mostRecentAnalysis?.assessment.conspicuousFileSize;
    return sizeInBytes != null ? `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB` : null;
  }

  get attachments(): { name: string; type: string }[] {
    return this.mostRecentAnalysis?.email.attachments ?? [];
  }

  get blacklistedDomains(): string[] {
    return this.mostRecentAnalysis?.assessment.blacklistResults.blacklistedDomains ?? [];
  }

  get detectedJavaScript(): string[] {
    return this.mostRecentAnalysis?.email.detectedJavaScript ?? [];
  }

  get phishingKeywords(): string[] {
    return this.mostRecentAnalysis?.email.detectedPhishingKeywords ?? [];
  }
}