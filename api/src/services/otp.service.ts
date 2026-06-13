import { createHash, randomInt } from 'crypto';

import { environment } from '../config/environment';
import { emailService } from './email.service';

interface OtpEntry {
  emailKey: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
}

const MAX_ATTEMPTS = 5;

const hashCode = (email: string, code: string): string => {
  return createHash('sha256').update(`${email.toLowerCase()}::${code}`).digest('hex');
};

/**
 * Simple in-memory OTP store. For production, swap with a Cosmos container that
 * has a TTL on the documents and indexes on `emailKey`.
 */
export class OtpService {
  private readonly store = new Map<string, OtpEntry>();

  async issue(email: string): Promise<{ delivered: boolean; expiresAt: string; previewCode?: string }> {
    const normalized = email.trim().toLowerCase();
    const code = String(randomInt(0, 10 ** environment.otpLength)).padStart(environment.otpLength, '0');
    const expiresAt = Date.now() + environment.otpTtlSeconds * 1000;

    this.store.set(normalized, {
      emailKey: normalized,
      codeHash: hashCode(normalized, code),
      expiresAt,
      attempts: 0
    });

    const subject = 'Your Fabric IQ sign-in code';
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937;">
        <h2>Fabric IQ Ontology AI Generator</h2>
        <p>Use this one-time code to finish signing in:</p>
        <p style="font-size: 28px; letter-spacing: 4px; font-weight: 600; background: #f3f4f6; padding: 12px 16px; display: inline-block; border-radius: 8px;">
          ${code}
        </p>
        <p>The code expires in ${Math.round(environment.otpTtlSeconds / 60)} minutes. If you did not request this, you can safely ignore this email.</p>
      </div>
    `;

    const sendResult = await emailService.send({ to: normalized, subject, html });

    return {
      delivered: sendResult.delivered,
      expiresAt: new Date(expiresAt).toISOString(),
      // Only surface the raw code in non-production for local development.
      previewCode: environment.nodeEnv === 'production' ? undefined : code
    };
  }

  async verify(email: string, code: string): Promise<boolean> {
    const normalized = email.trim().toLowerCase();
    const entry = this.store.get(normalized);
    if (!entry) {
      return false;
    }

    if (entry.expiresAt < Date.now()) {
      this.store.delete(normalized);
      return false;
    }

    entry.attempts += 1;
    if (entry.attempts > MAX_ATTEMPTS) {
      this.store.delete(normalized);
      return false;
    }

    const matches = hashCode(normalized, code.trim()) === entry.codeHash;
    if (matches) {
      this.store.delete(normalized);
    }
    return matches;
  }
}

export const otpService = new OtpService();
