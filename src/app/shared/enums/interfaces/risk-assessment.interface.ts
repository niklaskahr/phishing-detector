export interface RiskAssessment {
  score: number;
  isHighRisk: boolean; // make this a three-state enum or similar (low/medium/high risk)
  warnings: string[];
}

// export interface RiskAssessment {
//   item: string; // The email, domain, or URL being assessed
//   riskScore: number; // A numeric score representing the risk level
//   riskLevel: 'low' | 'medium' | 'high'; // A categorized risk level
//   blacklisted: boolean; // Whether the item is on a blacklist
//   findings: string[]; // Detailed findings, e.g., flagged keywords, malicious TLDs
// }