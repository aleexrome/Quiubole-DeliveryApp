import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Configure transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get('SMTP_PORT') || '587'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  private async sendEmail(to: string, subject: string, html: string) {
    const fromEmail = this.configService.get('SMTP_FROM') || 'noreply@quiubole.com';

    try {
      await this.transporter.sendMail({
        from: `"Quiúbole!" <${fromEmail}>`,
        to,
        subject,
        html,
      });
      console.log(`Email sent to ${to}: ${subject}`);
      return { success: true };
    } catch (error) {
      console.error('Email send error:', error);
      // Don't throw - email failures shouldn't break app flow
      return { success: false, error: error.message };
    }
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
            Este código expira en 10 minutos. Si no solicitaste este código, ignora este correo.
          </p>
        </div>
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Quiúbole! - Comida a tu puerta
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
          <p style="color: #666; font-size: 16px;">
            Recibimos una solicitud para restablecer tu contraseña. Tu código es:
          </p>
          <div style="background: #FF6B35; color: white; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #666; font-size: 14px;">
            Este código expira en 15 minutos. Si no solicitaste restablecer tu contraseña, ignora este correo.
          </p>
        </div>
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Quiúbole! - Comida a tu puerta
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(email, 'Restablecer contraseña - Quiúbole!', html);
  }

  async sendOrderConfirmation(email: string, order: any) {
    const itemsHtml = order.items
      .map(
        (item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.total.toFixed(2)}</td>
        </tr>
      `,
      )
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF6B35, #FF8C42); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">¡Pedido Confirmado!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Pedido #${order.orderNumber}</h2>
          <p style="color: #666;">
            Tu pedido de <strong>${order.restaurantName}</strong> ha sido confirmado.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #eee;">
                <th style="padding: 10px; text-align: left;">Producto</th>
                <th style="padding: 10px; text-align: center;">Cant.</th>
                <th style="padding: 10px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="border-top: 2px solid #FF6B35; padding-top: 15px;">
            <p style="margin: 5px 0;"><strong>Subtotal:</strong> $${order.subtotal.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Envío:</strong> $${order.deliveryFee.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Servicio:</strong> $${order.serviceFee.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>IVA:</strong> $${order.tax.toFixed(2)}</p>
            <p style="margin: 5px 0; font-size: 18px; color: #FF6B35;"><strong>Total:</strong> $${order.total.toFixed(2)}</p>
          </div>

          <div style="background: #fff; padding: 15px; margin-top: 20px; border-left: 4px solid #FF6B35;">
            <p style="margin: 0; color: #666;">
              <strong>Dirección de entrega:</strong><br>
              ${order.deliveryAddress}
            </p>
          </div>
        </div>
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Quiúbole! - Comida a tu puerta
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(email, `Pedido #${order.orderNumber} confirmado - Quiúbole!`, html);
  }

  async sendOrderDelivered(email: string, order: any) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4CAF50, #8BC34A); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">¡Pedido Entregado!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9; text-align: center;">
          <h2 style="color: #333;">Pedido #${order.orderNumber}</h2>
          <p style="color: #666; font-size: 18px;">
            Tu pedido de <strong>${order.restaurantName}</strong> ha sido entregado.
          </p>
          <p style="color: #666;">
            ¡Buen provecho! 🍔🌮🍕
          </p>
          <div style="margin: 30px 0;">
            <p style="color: #666;">¿Cómo estuvo tu experiencia?</p>
            <a href="#" style="display: inline-block; background: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Calificar Pedido
            </a>
          </div>
        </div>
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Quiúbole! - Comida a tu puerta
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(email, `¡Buen provecho! Pedido #${order.orderNumber} entregado`, html);
  }

  async sendWelcomeEmail(email: string, firstName: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF6B35, #FF8C42); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">¡Bienvenido a Quiúbole!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">¡Hola ${firstName}! 👋</h2>
          <p style="color: #666; font-size: 16px;">
            Nos alegra tenerte en Quiúbole. Ahora puedes disfrutar de tus restaurantes favoritos sin salir de casa.
          </p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="#" style="display: inline-block; background: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Explorar Restaurantes
            </a>
          </div>
          <h3 style="color: #333;">¿Qué puedes hacer?</h3>
          <ul style="color: #666;">
            <li>Descubrir restaurantes cerca de ti</li>
            <li>Ordenar tu comida favorita</li>
            <li>Seguir tu pedido en tiempo real</li>
            <li>Ganar puntos con cada compra</li>
          </ul>
        </div>
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Quiúbole! - Comida a tu puerta
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(email, '¡Bienvenido a Quiúbole!', html);
  }
}
