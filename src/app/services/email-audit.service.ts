import { Injectable } from '@angular/core';
import { EmailProcessorService } from './email-processor.service';
import { RiskAssessmentService } from './risk-assessment.service';
import { StorageService } from './storage.service';
import { ExtractedEmailData } from '../shared/enums/interfaces/extracted-email-data.interface';
import { RiskAssessment } from '../shared/enums/interfaces/risk-assessment.interface';

@Injectable({
  providedIn: 'root'
})
export class EmailAuditService {
  constructor(
    private emailProcessorService: EmailProcessorService,
    private riskAssessmentService: RiskAssessmentService,
    private storageService: StorageService
  ) {}

  async analyzeEmail(file: File): Promise<void> {
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
