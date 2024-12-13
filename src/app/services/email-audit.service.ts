import { Injectable } from '@angular/core';
import { EmailProcessorService } from './email-processor.service';
import { RiskAssessmentService } from './risk-assessment.service';
import { StorageService } from './shared/storage.service';
import { ExtractedData } from '../shared/interfaces/extracted-data.interface';
import { RiskAssessment } from '../shared/interfaces/risk-assessment.interface';
import { EventService } from './shared/event.service';
import { EmailData } from '../shared/interfaces/email-data.interface';

@Injectable({
  providedIn: 'root'
})
export class EmailAuditService {
  constructor(
    private eventService: EventService,
    private emailProcessorService: EmailProcessorService,
    private riskAssessmentService: RiskAssessmentService,
    private storageService: StorageService
  ) {
    this.eventService.fileDropped$.subscribe(file => {
      this.analyzeEmail(file);
    });
  }

  async analyzeEmail(file: File): Promise<void> {
    const extractedData: ExtractedData = await this.emailProcessorService.processFile(file);
    const riskAssessment: RiskAssessment = this.riskAssessmentService.assessRisk(extractedData);

    const data: EmailData = { email: extractedData, assessment: riskAssessment };
    await this.storageService.storeData(data);

    console.log('Stored Data:', this.storageService.getData());
  }

}
