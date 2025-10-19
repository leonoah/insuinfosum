export interface PensionProduct {
  id: string;
  company: string;
  productType: 'קרן השתלמות' | 'קופת גמל' | 'חברת ביטוח' | 'קרן פנסיה חדשה' | 'ביטוח משכנתא';
  policyNumber: string;
  status: 'פעיל' | 'לא פעיל';
  currentBalance: number;
  managementFeeFromDeposit: number;
  managementFeeFromBalance: number;
  annualReturn: number;
  lastDeposit?: {
    employee: number;
    employer: number;
    date?: string;
  };
  eligibleForWithdrawal?: string | boolean;
  projectedBalanceAtRetirement: number;
  projectedMonthlyPension?: number;
  insuranceCoverage?: {
    deathBenefit: number;
    disabilityBenefit: number;
  };
  planOpenDate?: string;
  notes?: string;
}

export interface PensionSummary {
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  reportDate: string;
  products: PensionProduct[];
  totalByType: {
    'קרנות השתלמות': number;
    'קופות גמל': number;
    'חברות ביטוח': number;
    'קרנות פנסיה חדשות': number;
  };
}

export interface PensionFileData {
  fileName: string;
  parsedDate: string;
  summary: PensionSummary;
}