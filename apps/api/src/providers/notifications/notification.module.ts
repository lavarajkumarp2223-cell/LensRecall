import { Module, Global } from '@nestjs/common';
import { NotificationService } from './notification.service.js';
import { ResendEmailAdapter } from './resend.adapter.js';

@Global()
@Module({
  providers: [
    {
      provide: NotificationService,
      useFactory: (): NotificationService => {
        const provider = process.env['EMAIL_PROVIDER'] ?? 'mock';
        switch (provider) {
          case 'resend':
            return new ResendEmailAdapter();
          case 'mock':
            return new (class extends NotificationService {
              async sendEmail(opts: { to: string; template: string }) {
                console.log(`[MOCK EMAIL] to=${opts.to} template=${opts.template}`);
              }
              async sendSms(opts: { to: string; message: string }) {
                console.log(`[MOCK SMS] to=${opts.to}: ${opts.message}`);
              }
              async healthCheck() {
                return { healthy: true };
              }
            })();
          default:
            throw new Error(`Unknown EMAIL_PROVIDER: "${provider}"`);
        }
      },
    },
  ],
  exports: [NotificationService],
})
export class NotificationProviderModule {}
