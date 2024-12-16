import { AttachmentDetails } from "./attachment-details.interface";

export interface ExtractedData {
  sender: string;
  replyTo: string;
  returnPath: string;
  domains: string[];
  subject: string;
  rawEmail: string;
  detectedJavaScript: string[];
  detectedPhishingKeywords: string[];
  fileSize: number;
  attachments: AttachmentDetails[] | null;
}