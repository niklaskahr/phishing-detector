import { Injectable } from '@angular/core';
import { EmailProcessorService } from './email-processor.service';
import { RiskAssessmentService } from './risk-assessment.service';
import { StorageService } from './shared/storage.service';
import { ExtractedData } from '../shared/interfaces/extracted-data.interface';
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
      this.analyzeEmail(file);
    });
  }

  async analyzeEmail(file: File): Promise<void> {
    const extractedData: ExtractedData = await this.emailProcessorService.processFile(file);
    this.storageService.storeExtractedData(extractedData);

    console.log("Store Data:", this.storageService.getExtractedData());


    // const riskAssessment = this.riskAssessmentService.assessRisk(extractedData);
    // this.storageService.storeRiskAssessment(riskAssessment);

    // console.log('Risk Assessment:', riskAssessment);
  }

  getStoredResults(): { data: ExtractedData[]; assessments: RiskAssessment[] } {
    return {
      data: this.storageService.getExtractedData(),
      assessments: this.storageService.getRiskAssessments(),
    };
  }
}
