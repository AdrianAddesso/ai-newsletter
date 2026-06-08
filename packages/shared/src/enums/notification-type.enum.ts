export const NotificationType = {
  PENDING_REVIEW: "PENDING_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  REMINDER: "REMINDER",
  INFO: "INFO",
  NEW_NEWSLETTER: "NEW_NEWSLETTER",
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationTypeLabel: Record<NotificationType, string> = {
  [NotificationType.PENDING_REVIEW]: "Pending Review",
  [NotificationType.APPROVED]: "Approved",
  [NotificationType.REJECTED]: "Rejected",
  [NotificationType.REMINDER]: "Reminder",
  [NotificationType.INFO]: "Information",
  [NotificationType.NEW_NEWSLETTER]: "New Newsletter",
};