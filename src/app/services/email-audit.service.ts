import { Injectable } from '@angular/core';
import { EmailProcessorService } from './email-processor.service';
import { RiskAssessmentService } from './risk-assessment.service';
import { StorageService } from './shared/storage.service';
import { ExtractedEmailData } from '../shared/interfaces/extracted-email-data.interface';
import { RiskAssessment } from '../shared/interfaces/risk-assessment.interface';
import { EventService } from './shared/event.service';

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
      console.log('EmailAuditService received file:', file);
      this.analyzeEmail(file);
    });
  }

  async analyzeEmail(file: File): Promise<void> {
    console.log("RECEIVED");

    const extractedData: ExtractedEmailData = await this.emailProcessorService.processFile(file);
    this.storageService.storeExtractedData(extractedData);

    console.log("Store Data:", this.storageService.getExtractedData());


    // const riskAssessment = this.riskAssessmentService.assessRisk(extractedData);
    // this.storageService.storeRiskAssessment(riskAssessment);

    // console.log('Risk Assessment:', riskAssessment);
  }

  getStoredResults(): { data: ExtractedEmailData[]; assessments: RiskAssessment[] } {
    return {
      data: this.storageService.getExtractedData(),
      assessments: this.storageService.getRiskAssessments(),
    };
  }
}
