import { ExtractedData } from "./extracted-data.interface";
import { Assessment } from "./assessment.interface";

export interface EmailData {
    email: ExtractedData;
    assessment: Assessment;
}