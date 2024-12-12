export interface ExtractedEmailData {
    subject: string;
    sender: string;
    replyTo: string;
    returnPath: string;
    domains: string[];
  }