import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {}

  private async sendEmail(to: string, subject: string, html: string) {
    // In production, integrate with SendGrid, AWS SES, or nodemailer
    // For now, log the email
    console.log('='.repeat(50));
    console.log(`[EMAIL] To: ${to}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] Body preview: ${html.substring(0, 100)}...`);
    console.log('='.repeat(50));

    return { success: true };
  }

  async sendVerificationEmail(email: string, code: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF6B35, #FF8C42); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">¡Bienvenido a Quiúbole!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Verifica tu correo electrónico</h2>
          <p style="color: #666; font-size: 16px;">
            Tu código de verificación es:
          </p>
          <div style="background: #FF6B35; color: white; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #666; font-size: 14px;">
            Este código expira en 10 minutos.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(email, 'Verifica tu cuenta - Quiúbole!', html);
  }

  async sendPasswordResetEmail(email: string, code: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF6B35, #FF8C42); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Quiúbole!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Restablecer contraseña</h2>
          <p>Tu código es: <strong>${code}</strong></p>
          <p>Este código expira en 15 minutos.</p>
        </div>
      </div>
    `;

    return this.sendEmail(email, 'Restablecer contraseña - Quiúbole!', html);
  }

  async sendOrderConfirmation(email: string, order: any) {
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h1>¡Pedido Confirmado!</h1>
        <p>Pedido #${order.orderNumber}</p>
        <p>Total: $${order.total}</p>
        <p>Dirección: ${order.deliveryAddress}</p>
      </div>
    `;

    return this.sendEmail(email, `Pedido #${order.orderNumber} confirmado - Quiúbole!`, html);
  }

  async sendOrderDelivered(email: string, order: any) {
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h1>¡Pedido Entregado!</h1>
        <p>Pedido #${order.orderNumber} ha sido entregado.</p>
        <p>¡Buen provecho!</p>
      </div>
    `;

    return this.sendEmail(email, `¡Buen provecho! Pedido #${order.orderNumber} entregado`, html);
  }

  async sendWelcomeEmail(email: string, firstName: string) {
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h1>¡Bienvenido a Quiúbole!</h1>
        <p>¡Hola ${firstName}!</p>
        <p>Nos alegra tenerte. Ahora puedes disfrutar de tus restaurantes favoritos.</p>
      </div>
    `;

    return this.sendEmail(email, '¡Bienvenido a Quiúbole!', html);
  }
}
