export const NOTIFICATION_HOME_WINDOW_DAYS = 7 as const;

export interface NotificationResumeReminderDto {
  audiobookId: string;
  chapterId: string;
  title: string;
  subtitle: string | null;
  progressMs: number;
  lastActivityAt: string;
}

export interface NotificationHomeDataDto {
  resumeReminder: NotificationResumeReminderDto | null;
}

export interface NotificationHomeResponseDto {
  data: NotificationHomeDataDto;
  meta: {
    generatedAt: string;
    windowDays: number;
  };
}
