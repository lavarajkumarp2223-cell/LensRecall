import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { NotificationService, EmailOptions, SmsOptions } from './notification.service.js';

/**
 * ResendEmailAdapter — Email delivery via Resend.
 *
 * Resend uses React Email templates or plain HTML.
 * Templates are referenced by name and resolved to HTML in the template registry.
 *
 * Env vars:
 * - RESEND_API_KEY
 * - EMAIL_FROM_ADDRESS
 * - EMAIL_FROM_NAME
 */
@Injectable()
export class ResendEmailAdapter extends NotificationService {
  private readonly logger = new Logger(ResendEmailAdapter.name);
  private readonly client: Resend;
  private readonly fromAddress: string;
  private readonly fromName: string;

  constructor() {
    super();

    const apiKey = process.env['RESEND_API_KEY'];
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }

    this.client = new Resend(apiKey);
    this.fromAddress = process.env['EMAIL_FROM_ADDRESS'] ?? 'noreply@lensrecall.com';
    this.fromName = process.env['EMAIL_FROM_NAME'] ?? 'LensRecall';
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const html = await this.renderTemplate(options.template, options.data);
    const subject = options.subject ?? this.getDefaultSubject(options.template, options.data);

    const { error } = await this.client.emails.send({
      from: `${this.fromName} <${this.fromAddress}>`,
      to: options.to,
      subject,
      html,
    });

    if (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`);
      throw new Error(`Email delivery failed: ${error.message}`);
    }

    this.logger.debug(`Email sent to ${options.to} (template: ${options.template})`);
  }

  async sendSms(_options: SmsOptions): Promise<void> {
    // Resend does not support SMS — this would require Twilio or similar
    throw new Error('SMS is not supported by ResendEmailAdapter. Configure a SMS adapter.');
  }

  async healthCheck(): Promise<{ healthy: boolean }> {
    try {
      // Resend doesn't have a direct health endpoint; check by listing domains
      await this.client.domains.list();
      return { healthy: true };
    } catch {
      return { healthy: false };
    }
  }

  private async renderTemplate(
    templateName: string,
    data: Record<string, unknown>,
  ): Promise<string> {
    // In a full implementation, this would use React Email or a template engine
    // For now, returns a basic branded HTML wrapper
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; background: #f9f9f9; }
    .container { max-width: 560px; margin: 40px auto; background: white; border-radius: 12px; padding: 40px; }
    .logo { font-size: 20px; font-weight: 700; color: #111; margin-bottom: 24px; }
    .content { font-size: 16px; line-height: 1.6; }
    .footer { font-size: 12px; color: #888; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">LensRecall</div>
    <div class="content">
      ${this.renderTemplateContent(templateName, data)}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} LensRecall. Find every moment you're in.
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private renderTemplateContent(template: string, data: Record<string, unknown>): string {
    switch (template) {
      case 'magic-link':
        return `
          <p>Hi ${data['name'] ?? 'there'},</p>
          <p>Click the link below to sign in to LensRecall:</p>
          <p><a href="${data['url']}" style="background:#111;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Sign In</a></p>
          <p>This link expires in 10 minutes.</p>
        `;
      case 'upload-complete':
        return `
          <p>Your upload of ${data['photoCount']} photos to <strong>${data['eventName']}</strong> is complete.</p>
          <p>Photos are being processed and will be ready for guests soon.</p>
        `;
      case 'processing-complete':
        return `
          <p>Processing complete for <strong>${data['eventName']}</strong>.</p>
          <p>${data['photoCount']} photos processed, ${data['facesFound']} faces indexed.</p>
          <p>Guests can now scan the QR and find their moments.</p>
        `;
      case 'download-ready':
        return `
          <p>Your download is ready!</p>
          <p><a href="${data['downloadUrl']}" style="background:#111;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Download Photos</a></p>
          <p>This link expires in 24 hours.</p>
        `;
      case 'photographer-invitation':
        return `
          <p>You've been invited to photograph <strong>${data['eventName']}</strong> on LensRecall.</p>
          <p><a href="${data['acceptUrl']}" style="background:#111;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Accept Invitation</a></p>
        `;
      default:
        return `<p>${data['message'] ?? 'You have a notification from LensRecall.'}</p>`;
    }
  }

  private getDefaultSubject(template: string, data: Record<string, unknown>): string {
    const subjects: Record<string, string> = {
      'magic-link': 'Sign in to LensRecall',
      'upload-complete': `Upload complete — ${data['eventName'] ?? 'your event'}`,
      'processing-complete': `Photos ready — ${data['eventName'] ?? 'your event'}`,
      'processing-failed': 'Processing error — action required',
      'download-ready': 'Your photos are ready to download',
      'photographer-invitation': `Invitation: photograph ${data['eventName'] ?? 'an event'}`,
      'privacy-request-received': 'Privacy request received',
      'privacy-request-completed': 'Privacy request completed',
    };
    return subjects[template] ?? 'Notification from LensRecall';
  }
}
