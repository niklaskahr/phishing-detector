import { RiskLevel } from "../enums/risk-level.enum";
import { BlacklistResults } from "./blacklist-details.interface";

export interface Assessment {
  trustworthiness: number;
  riskLevel: RiskLevel;
  blacklistResults: BlacklistResults;
  conspicuousFileSize?: number;
}