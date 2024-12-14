export interface ExtractedData {
  sender: string;
  replyTo: string;
  returnPath: string;
  domains: string[];
  subject: string;
  rawEmail: string;
  detectedJavaScript: string[];
  detectedPhishingKeywords: string[];
}