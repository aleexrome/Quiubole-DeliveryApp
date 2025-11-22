// ==========================================
// AUTH SERVICE - Logica de Autenticacion
// ==========================================

import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { VerificationCode } from './verification-code.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(VerificationCode)
    private verificationRepository: Repository<VerificationCode>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  // Registro
  async register(data: {
    email: string;
    password: string;
    name: string;
    phone: string;
    role: string;
  }) {
    // Verificar si email existe
    const existingUser = await this.usersRepository.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestException('El email ya esta registrado');
    }

    // Encriptar password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Crear usuario
    const user = this.usersRepository.create({
      ...data,
      password: hashedPassword,
      emailVerified: false,
      phoneVerified: false,
    });

    await this.usersRepository.save(user);

    // Generar token
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  // Login
  async login(email: string, password: string) {
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  // Enviar email de verificacion
  async sendVerificationEmail(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Invalidar codigos anteriores
    await this.verificationRepository.update(
      { userId, type: 'email', isUsed: false },
      { isUsed: true },
    );

    // Generar codigo de 6 digitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Guardar codigo (expira en 15 minutos)
    const verification = this.verificationRepository.create({
      userId,
      type: 'email',
      code,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    await this.verificationRepository.save(verification);

    // Enviar email
    await this.mailService.sendVerificationCode(user.email, user.name, code);
  }

  // Verificar email
  async verifyEmail(userId: string, code: string): Promise<boolean> {
    const verification = await this.verificationRepository.findOne({
      where: {
        userId,
        type: 'email',
        code,
        isUsed: false,
      },
    });

    if (!verification) {
      throw new BadRequestException('Codigo invalido');
    }

    if (new Date() > verification.expiresAt) {
      throw new BadRequestException('Codigo expirado');
    }

    // Marcar como usado
    verification.isUsed = true;
    await this.verificationRepository.save(verification);

    // Actualizar usuario
    await this.usersRepository.update(userId, { emailVerified: true });

    return true;
  }

  // Enviar email de recuperacion
  async sendPasswordResetEmail(email: string) {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      // No revelar si el email existe
      return;
    }

    // Generar token
    const token = this.jwtService.sign(
      { userId: user.id, type: 'password-reset' },
      { expiresIn: '1h' },
    );

    // Enviar email
    await this.mailService.sendPasswordResetEmail(user.email, user.name, token);
  }

  // Restablecer password
  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token);

      if (payload.type !== 'password-reset') {
        throw new BadRequestException('Token invalido');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.usersRepository.update(payload.userId, {
        password: hashedPassword,
      });
    } catch (error) {
      throw new BadRequestException('Token invalido o expirado');
    }
  }

  // Obtener perfil
  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    return { user: this.sanitizeUser(user) };
  }

  // Actualizar perfil
  async updateProfile(userId: string, data: Partial<User>) {
    // Campos que no se pueden actualizar
    delete data.password;
    delete data.email;
    delete data.role;
    delete data.emailVerified;

    await this.usersRepository.update(userId, data);

    const user = await this.usersRepository.findOne({ where: { id: userId } });

    return { user: this.sanitizeUser(user) };
  }

  // Generar JWT
  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  // Remover password del objeto user
  private sanitizeUser(user: User) {
    const { password, ...result } = user;
    return result;
  }
}
