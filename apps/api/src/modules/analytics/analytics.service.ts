import type { AnalyticsIngestRequestDto, AnalyticsIngestResponseDto } from './analytics.dto.js';
import type { AnalyticsRepositoryBundle } from './analytics.repository.js';

export interface AnalyticsServiceDependencies {
  repositories: AnalyticsRepositoryBundle;
}

export class AnalyticsService {
  constructor(private readonly dependencies: AnalyticsServiceDependencies) {}

  async ingest(userId: string, request: AnalyticsIngestRequestDto): Promise<AnalyticsIngestResponseDto> {
    if (!request.events.length) {
      throw new Error('At least one analytics event is required');
    }

    const acceptedEvents = [];
    for (const event of request.events) {
      const eventName = normalizeEventName(event.eventName);
      const sourcePlatform = normalizeSourcePlatform(event.sourcePlatform);
      const occurredAt = event.occurredAt ? new Date(event.occurredAt) : new Date();
      if (Number.isNaN(occurredAt.getTime())) {
        throw new Error(`Invalid occurredAt for event ${eventName}`);
      }

      const recorded = await this.dependencies.repositories.analyticsRepository.recordEvent({
        userId,
        eventName,
        payloadJson: event.payload ?? {},
        sourcePlatform,
        occurredAt,
      });
      acceptedEvents.push(recorded);
    }

    return {
      acceptedCount: acceptedEvents.length,
      eventNames: acceptedEvents.map((event) => event.eventName),
    };
  }
}

function normalizeEventName(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error('eventName is required');
  }

  return normalized;
}

function normalizeSourcePlatform(value: string): 'ios' | 'android' | 'web' {
  if (value === 'ios' || value === 'android' || value === 'web') {
    return value;
  }

  throw new Error(`Unsupported sourcePlatform ${value}`);
}

