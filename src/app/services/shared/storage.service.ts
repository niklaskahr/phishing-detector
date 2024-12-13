import { Injectable } from '@angular/core';
import { ExtractedEmailData } from '../../shared/interfaces/extracted-email-data.interface';
import { RiskAssessment } from '../../shared/interfaces/risk-assessment.interface';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private emailDataStore: ExtractedEmailData[] = [];
  private riskAssessmentStore: RiskAssessment[] = [];

  storeExtractedData(data: ExtractedEmailData): void {
    this.emailDataStore.push(data);
  }

  getExtractedData(): ExtractedEmailData[] {
    return [...this.emailDataStore];
  }

  storeRiskAssessment(assessment: RiskAssessment): void {
    this.riskAssessmentStore.push(assessment);
  }

  getRiskAssessments(): RiskAssessment[] {
    return [...this.riskAssessmentStore];
  }
}