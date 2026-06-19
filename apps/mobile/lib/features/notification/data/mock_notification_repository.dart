import '../domain/notification_models.dart';
import '../domain/notification_repository.dart';

class MockNotificationRepository implements NotificationRepository {
  const MockNotificationRepository();

  @override
  Future<NotificationHomeData> getHomeData({
    required String? userId,
    required String? accessToken,
  }) async {
    return NotificationHomeData(
      resumeReminder: NotificationResumeReminder(
        audiobookId: 'book-japanese-listening',
        chapterId: 'chapter-2',
        title: 'Japanese Daily Listening',
        subtitle: 'Resume Chapter 2 at 04:12',
        progressMs: 252000,
        lastActivityAt: DateTime.utc(2026, 6, 9, 2, 0, 0),
      ),
      generatedAt: DateTime.utc(2026, 6, 9, 12, 0, 0),
      windowDays: 7,
    );
  }
}
