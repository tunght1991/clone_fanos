export type AnalyticsSourcePlatform = 'ios' | 'android' | 'web';

export interface AnalyticsEventRequestDto {
  eventName: string;
  sourcePlatform: AnalyticsSourcePlatform;
  payload?: Record<string, unknown>;
  occurredAt?: string;
}

export interface AnalyticsIngestRequestDto {
  events: AnalyticsEventRequestDto[];
}

export interface AnalyticsIngestResponseDto {
  acceptedCount: number;
  eventNames: string[];
}

