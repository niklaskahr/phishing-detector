import { Injectable } from '@angular/core';
import { EmailProcessorService } from './email-processor.service';
import { AssessmentService } from './assessment.service';
import { StorageService } from './shared/storage.service';
import { ExtractedData } from '../shared/interfaces/extracted-data.interface';
import { Assessment } from '../shared/interfaces/assessment.interface';
import { EventService } from './shared/event.service';
import { EmailData } from '../shared/interfaces/email-data.interface';

@Injectable({
  providedIn: 'root'
})
export class EmailAuditService {
  constructor(
    private eventService: EventService,
    private emailProcessorService: EmailProcessorService,
    private riskAssessmentService: AssessmentService,
    private storageService: StorageService
  ) {
    this.eventService.filesDropped$.subscribe(files => {
      files.forEach(file => this.analyzeEmail(file));
    });
  }

  async analyzeEmail(file: File): Promise<void> {
    try {
      const extractedData: ExtractedData = await this.emailProcessorService.processFile(file);
      const riskAssessment: Assessment = await this.riskAssessmentService.assessTrustworthiness(extractedData);

      const data: EmailData = { email: extractedData, assessment: riskAssessment };
      await this.storageService.storeData(data);

      const isNewData = await this.storageService.storeData(data); // Store data and check if new
      if (!isNewData) {
        console.log(`Email "${file.name}" is a duplicate and was not reprocessed.`);
      }
      console.log('Stored Data:', this.storageService.getData());
    } catch (error) {
      console.error('Error analyzing email:', error);
    }
  }
}