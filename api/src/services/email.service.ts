import { EmailClient } from '@azure/communication-email';

import { environment } from '../config/environment';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  plainText?: string;
}

export class EmailService {
  private client: EmailClient | undefined;

  private getClient(): EmailClient | undefined {
    if (this.client) {
      return this.client;
    }
    if (!environment.acsConnectionString) {
      return undefined;
    }
    this.client = new EmailClient(environment.acsConnectionString);
    return this.client;
  }

  async send(message: EmailMessage): Promise<{ delivered: boolean; messageId?: string }> {
    const client = this.getClient();
    if (!client) {
      // Local / disconnected dev fallback — keeps the OTP flow testable without ACS.
      console.warn(`[EmailService] ACS not configured. Skipping email to ${message.to} (subject: "${message.subject}")`);
      return { delivered: false };
    }

    const poller = await client.beginSend({
      senderAddress: environment.acsSenderAddress,
      recipients: { to: [{ address: message.to }] },
      content: {
        subject: message.subject,
        html: message.html,
        plainText: message.plainText ?? message.html.replace(/<[^>]+>/g, '')
      }
    });

    const result = await poller.pollUntilDone();
    return { delivered: result.status === 'Succeeded', messageId: result.id };
  }
}

export const emailService = new EmailService();
