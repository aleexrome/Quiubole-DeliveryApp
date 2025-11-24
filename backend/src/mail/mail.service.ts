import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const from = this.configService.get<string>('MAIL_FROM') || 'noreply@quiubole.com';

      await sgMail.send({
        to,
        from,
        subject,
        html,
      });

      this.logger.log(`Email sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      return false;
    }
  }

  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    const subject = 'Verifica tu cuenta - Quiúbole!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF6B00;">¡Hola!</h1>
        <p>Tu código de verificación es:</p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px;">
          ${code}
        </div>
        <p>Este código expira en 15 minutos.</p>
        <p>Si no solicitaste este código, ignora este mensaje.</p>
        <hr>
        <p style="color: #888; font-size: 12px;">Quiúbole! - Tu app de delivery favorita</p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendPasswordReset(email: string, token: string): Promise<boolean> {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${token}`;
    const subject = 'Restablecer contraseña - Quiúbole!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF6B00;">Restablecer contraseña</h1>
        <p>Haz clic en el siguiente botón para restablecer tu contraseña:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #FF6B00; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
            Restablecer contraseña
          </a>
        </div>
        <p>Este enlace expira en 1 hora.</p>
        <p>Si no solicitaste restablecer tu contraseña, ignora este mensaje.</p>
        <hr>
        <p style="color: #888; font-size: 12px;">Quiúbole! - Tu app de delivery favorita</p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendOrderConfirmation(email: string, orderNumber: string, orderDetails: any): Promise<boolean> {
    const subject = `Pedido confirmado #${orderNumber} - Quiúbole!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF6B00;">¡Pedido confirmado!</h1>
        <p>Tu pedido #${orderNumber} ha sido confirmado.</p>
        <p>Total: $${orderDetails.total}</p>
        <p>Te notificaremos cuando tu pedido esté en camino.</p>
        <hr>
        <p style="color: #888; font-size: 12px;">Quiúbole! - Tu app de delivery favorita</p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }
}
