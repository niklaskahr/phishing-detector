export enum RiskLevel {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export interface RiskAssessment {
  riskScore: number; // A numeric score representing the risk level
  riskLevel: RiskLevel;
  isBlacklisted: boolean; // Whether something within the email is on a blacklist
  findings: string[]; // Detailed findings, e.g., flagged keywords, malicious TLDs
}