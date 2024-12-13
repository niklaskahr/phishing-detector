import { ExtractedData } from "./extracted-data.interface";
import { RiskAssessment } from "./risk-assessment.interface";

export interface EmailData {
    email: ExtractedData;
    assessment: RiskAssessment;
}