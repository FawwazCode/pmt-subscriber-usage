
export type SubscriberPlan = "Basic" | "Premium" | "Family";

export interface Subscriber {
  subscriber_id: string;
  name: string;
  plan: SubscriberPlan;
  activation_date: string;
}

export interface UsageRecord {
  id: number;
  subscriberId: string;
  callMinutes: number;
  smsCount: number;
  dataUsageMB: number;
  timestamp: string;
}

export interface CreateUsagePayload {
  subscriberId: string;
  callMinutes: number;
  smsCount: number;
  dataUsageMB: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
