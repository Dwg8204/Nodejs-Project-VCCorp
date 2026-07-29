import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  constructor(private readonly config: ConfigService) {}

  async sendPasswordResetOtp(input: {
    recipient: string;
    displayName: string;
    otp: string;
    expiresInSeconds: number;
  }): Promise<void> {
    const user = this.config.getOrThrow<string>('SMTP_USER');
    const pass = this.config.getOrThrow<string>('SMTP_APP_PASSWORD');
    const from = this.config.getOrThrow<string>('SMTP_FROM');
    if (!user || !pass || !from) {
      throw new ServiceUnavailableException('AUTH_RESET_EMAIL_NOT_CONFIGURED');
    }

    const transporter = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port: this.config.getOrThrow<number>('SMTP_PORT'),
      secure: this.config.getOrThrow<boolean>('SMTP_SECURE'),
      auth: { user, pass },
    });
    const minutes = Math.max(1, Math.ceil(input.expiresInSeconds / 60));
    const safeName = this.escapeHtml(input.displayName);

    try {
      await transporter.sendMail({
        from,
        to: input.recipient,
        subject: 'Mã OTP đặt lại mật khẩu VCCorp Blog',
        text: `Xin chào ${input.displayName}, mã OTP đặt lại mật khẩu của bạn là ${input.otp}. Mã có hiệu lực trong ${minutes} phút.`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#242424">
            <h2>Đặt lại mật khẩu VCCorp Blog</h2>
            <p>Xin chào ${safeName},</p>
            <p>Mã OTP đặt lại mật khẩu của bạn là:</p>
            <div style="font-size:30px;font-weight:700;letter-spacing:8px;padding:18px 22px;background:#f2f2f2;border-radius:10px;text-align:center">
              ${input.otp}
            </div>
            <p>Mã có hiệu lực trong <strong>${minutes} phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
          </div>
        `,
      });
    } catch {
      throw new ServiceUnavailableException('AUTH_RESET_EMAIL_SEND_FAILED');
    }
  }

  private escapeHtml(value: string): string {
    return value.replace(
      /[&<>"']/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;',
        })[character]!,
    );
  }
}
