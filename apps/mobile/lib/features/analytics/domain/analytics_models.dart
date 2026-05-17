class AnalyticsEvent {
  final String eventName;
  final String sourcePlatform;
  final Map<String, Object?> payload;
  final DateTime occurredAt;

  const AnalyticsEvent({
    required this.eventName,
    required this.sourcePlatform,
    required this.payload,
    required this.occurredAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'eventName': eventName,
      'sourcePlatform': sourcePlatform,
      'payload': payload,
      'occurredAt': occurredAt.toUtc().toIso8601String(),
    };
  }
}
