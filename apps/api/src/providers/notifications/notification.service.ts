/**
 * NotificationService — Abstract interface for sending notifications.
 *
 * Concrete adapters:
 * - ResendEmailAdapter
 * - MockNotificationAdapter (development only)
 *
 * Future adapters: SES, SendGrid, Twilio SMS, Firebase Push
 */
export interface EmailOptions {
  to: string;
  template: string;
  data: Record<string, unknown>;
  subject?: string; // Override template subject if needed
}

export interface SmsOptions {
  to: string;
  message: string;
}

export abstract class NotificationService {
  abstract sendEmail(options: EmailOptions): Promise<void>;
  abstract sendSms(options: SmsOptions): Promise<void>;
  abstract healthCheck(): Promise<{ healthy: boolean }>;
}
