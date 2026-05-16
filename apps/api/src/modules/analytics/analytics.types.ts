export interface AnalyticsEventRow {
  id: string;
  userId: string;
  eventName: string;
  payloadJson: Record<string, unknown>;
  sourcePlatform: 'ios' | 'android' | 'web';
  createdAt: Date;
}

