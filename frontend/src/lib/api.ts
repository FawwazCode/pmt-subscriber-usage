import type {
  ApiResponse,
  Subscriber,
  UsageRecord,
  CreateUsagePayload,
} from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    cache: "no-store",
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message ?? `Request failed with status ${response.status}`
    );
  }

  return result;
}

export async function getSubscribers(): Promise<Subscriber[]> {
  const response = await apiRequest<ApiResponse<Subscriber[]>>(
    "/api/subscribers"
  );

  return response.data;
}

export async function getUsageRecords(
  subscriberId?: string
): Promise<UsageRecord[]> {
  const query = subscriberId
    ? `?subscriberId=${encodeURIComponent(subscriberId)}`
    : "";

  const response = await apiRequest<ApiResponse<UsageRecord[]>>(
    `/api/usage${query}`
  );

  return response.data;
}

export async function createUsageRecord(
  payload: CreateUsagePayload
): Promise<UsageRecord> {
  const response = await apiRequest<ApiResponse<UsageRecord>>(
    "/api/usage",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  return response.data;
}
