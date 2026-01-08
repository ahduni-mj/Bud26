
export interface QuarterDetail {
  rate: number;
  quantity: number;
}

export interface SubActivity {
  id: string;
  name: string;
  description: string;
  remarks: string;
  reviewComments: string;
  ledgerName: string;
  ledgerCode: string;
  unit: string;
  q1: QuarterDetail;
  q2: QuarterDetail;
  q3: QuarterDetail;
  q4: QuarterDetail;
}

export interface Activity {
  id: string;
  name: string;
  subActivities: SubActivity[];
}

export interface Goal {
  id: string;
  name: string;
  activities: Activity[];
}

export interface BudgetData {
  goals: Goal[];
}

export type ViewType = 'PLANNER' | 'DASHBOARD';
