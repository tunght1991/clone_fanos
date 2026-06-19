class NotificationResumeReminder {
  final String audiobookId;
  final String chapterId;
  final String title;
  final String? subtitle;
  final int progressMs;
  final DateTime lastActivityAt;

  const NotificationResumeReminder({
    required this.audiobookId,
    required this.chapterId,
    required this.title,
    required this.subtitle,
    required this.progressMs,
    required this.lastActivityAt,
  });
}

class NotificationHomeData {
  final NotificationResumeReminder? resumeReminder;
  final DateTime generatedAt;
  final int windowDays;

  const NotificationHomeData({
    required this.resumeReminder,
    required this.generatedAt,
    required this.windowDays,
  });

  NotificationHomeData.empty()
      : resumeReminder = null,
        generatedAt = DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
        windowDays = 7;
}
