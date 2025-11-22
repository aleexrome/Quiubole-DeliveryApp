// ==========================================
// EMAIL SERVICE - SendGrid Integration
// ==========================================

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';

// Tipos
interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  attachments?: {
    content: string;
    filename: string;
    type: string;
    disposition: 'attachment' | 'inline';
  }[];
}

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  restaurantName: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  deliveryAddress: string;
  estimatedTime: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private isConfigured = false;
  private fromEmail: string;
  private fromName: string;

  onModuleInit() {
    this.initializeSendGrid();
  }

  private initializeSendGrid() {
    const apiKey = process.env.SENDGRID_API_KEY;

    if (!apiKey) {
      this.logger.warn('SendGrid API key not configured - emails will be logged only');
      return;
    }

    sgMail.setApiKey(apiKey);
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@quiubole.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Quiúbole!';
    this.isConfigured = true;
    this.logger.log('SendGrid initialized successfully');
  }

  // ==========================================
  // ENVÍO GENÉRICO
  // ==========================================

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.log(`[EMAIL SIMULATED] To: ${options.to}, Subject: ${options.subject}`);
      return true;
    }

    try {
      const msg: sgMail.MailDataRequired = {
        to: options.to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: options.subject,
      };

      if (options.templateId) {
        msg.templateId = options.templateId;
        msg.dynamicTemplateData = options.dynamicTemplateData;
      } else {
        msg.text = options.text;
        msg.html = options.html;
      }

      if (options.attachments) {
        msg.attachments = options.attachments;
      }

      await sgMail.send(msg);
      this.logger.log(`Email sent to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error('Error sending email:', error);
      return false;
    }
  }

  // ==========================================
  // EMAILS DE AUTENTICACIÓN
  // ==========================================

  async sendVerificationEmail(email: string, name: string, code: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF6B35; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .code { font-size: 32px; font-weight: bold; color: #FF6B35; text-align: center; letter-spacing: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido a Quiúbole!</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${name}</strong>,</p>
            <p>Gracias por registrarte en Quiúbole! Para verificar tu cuenta, ingresa el siguiente código:</p>
            <div class="code">${code}</div>
            <p>Este código expira en 15 minutos.</p>
            <p>Si no creaste esta cuenta, puedes ignorar este correo.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Quiúbole! - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Tu código de verificación: ${code}`,
      html,
      text: `Hola ${name}, tu código de verificación es: ${code}. Expira en 15 minutos.`,
    });
  }

  async sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF6B35; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Recuperar Contraseña</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${name}</strong>,</p>
            <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente botón:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
            </p>
            <p>Este enlace expira en 1 hora.</p>
            <p>Si no solicitaste esto, ignora este correo. Tu contraseña no será modificada.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Quiúbole! - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Recuperar tu contraseña - Quiúbole',
      html,
      text: `Hola ${name}, para restablecer tu contraseña visita: ${resetUrl}. El enlace expira en 1 hora.`,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF6B35; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido a Quiúbole!</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${name}</strong>,</p>
            <p>¡Tu cuenta ha sido verificada exitosamente!</p>
            <p>Ya puedes empezar a pedir comida de tus restaurantes favoritos.</p>
            <p>Descubre restaurantes cerca de ti y disfruta de entregas rápidas.</p>
            <p>¡Buen provecho! 🍔🌮🍕</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Quiúbole! - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '¡Bienvenido a Quiúbole! - Tu cuenta está lista',
      html,
    });
  }

  // ==========================================
  // EMAILS DE PEDIDOS
  // ==========================================

  async sendOrderConfirmation(email: string, data: OrderEmailData): Promise<boolean> {
    const itemsHtml = data.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.quantity}x ${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
        </tr>
      `,
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF6B35; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          table { width: 100%; border-collapse: collapse; }
          .total-row { font-weight: bold; font-size: 18px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Pedido Confirmado!</h1>
            <p>Pedido #${data.orderNumber}</p>
          </div>
          <div class="content">
            <p>Hola <strong>${data.customerName}</strong>,</p>
            <p>Tu pedido de <strong>${data.restaurantName}</strong> ha sido confirmado.</p>

            <h3>Detalle del pedido:</h3>
            <table>
              ${itemsHtml}
              <tr>
                <td style="padding: 8px;">Subtotal</td>
                <td style="padding: 8px; text-align: right;">$${data.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px;">Envío</td>
                <td style="padding: 8px; text-align: right;">$${data.deliveryFee.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px;">Tarifa de servicio</td>
                <td style="padding: 8px; text-align: right;">$${data.serviceFee.toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td style="padding: 12px; border-top: 2px solid #FF6B35;">Total</td>
                <td style="padding: 12px; border-top: 2px solid #FF6B35; text-align: right; color: #FF6B35;">$${data.total.toFixed(2)}</td>
              </tr>
            </table>

            <h3>Dirección de entrega:</h3>
            <p>${data.deliveryAddress}</p>

            <h3>Tiempo estimado:</h3>
            <p>${data.estimatedTime}</p>

            <p>Puedes seguir tu pedido en tiempo real desde la app.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Quiúbole! - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Pedido #${data.orderNumber} confirmado - Quiúbole`,
      html,
    });
  }

  async sendOrderDelivered(email: string, orderNumber: string, customerName: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; text-align: center; }
          .emoji { font-size: 48px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Pedido Entregado!</h1>
          </div>
          <div class="content">
            <div class="emoji">🎉</div>
            <p>Hola <strong>${customerName}</strong>,</p>
            <p>Tu pedido <strong>#${orderNumber}</strong> ha sido entregado.</p>
            <p>¡Esperamos que lo disfrutes!</p>
            <p>No olvides calificar tu experiencia en la app.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Quiúbole! - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `¡Pedido #${orderNumber} entregado! - Quiúbole`,
      html,
    });
  }

  // ==========================================
  // EMAILS PARA RESTAURANTES
  // ==========================================

  async sendRestaurantApproved(email: string, restaurantName: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF6B35; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Felicidades!</h1>
          </div>
          <div class="content">
            <p>Tu restaurante <strong>${restaurantName}</strong> ha sido aprobado en Quiúbole!</p>
            <p>Ya puedes empezar a recibir pedidos. Asegúrate de:</p>
            <ul>
              <li>Completar tu menú con todos tus productos</li>
              <li>Configurar tus horarios de atención</li>
              <li>Tener la app abierta para recibir notificaciones</li>
            </ul>
            <p>¡Mucho éxito!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `¡${restaurantName} aprobado en Quiúbole!`,
      html,
    });
  }

  // ==========================================
  // EMAILS PARA REPARTIDORES
  // ==========================================

  async sendDriverApproved(email: string, driverName: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF6B35; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido al equipo!</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${driverName}</strong>,</p>
            <p>¡Tu solicitud como repartidor ha sido aprobada!</p>
            <p>Ya puedes empezar a hacer entregas con Quiúbole. Recuerda:</p>
            <ul>
              <li>Activa tu disponibilidad en la app cuando estés listo</li>
              <li>Mantén actualizada tu ubicación</li>
              <li>Liquida tus comisiones diariamente</li>
            </ul>
            <p>¡Buenas entregas!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '¡Tu cuenta de repartidor está activa! - Quiúbole',
      html,
    });
  }

  async sendSettlementReminder(email: string, driverName: string, amount: number): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FFC107; color: #333; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .amount { font-size: 32px; font-weight: bold; color: #FF6B35; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Recordatorio de Liquidación</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${driverName}</strong>,</p>
            <p>Tienes un saldo pendiente por liquidar:</p>
            <div class="amount">$${amount.toFixed(2)} MXN</div>
            <p>Por favor, realiza la transferencia antes del final del día para evitar la suspensión de tu cuenta.</p>
            <p>Si ya realizaste el pago, ignora este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '⚠️ Recordatorio: Liquidación pendiente - Quiúbole',
      html,
    });
  }
}
