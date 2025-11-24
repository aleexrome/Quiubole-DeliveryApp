import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { VerificationCode } from './verification-code.entity';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(VerificationCode)
    private verificationCodesRepository: Repository<VerificationCode>,
    private jwtService: JwtService,
    private mailService: MailService,
    private usersService: UsersService,
  ) {}

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<{ user: Partial<User>; accessToken: string }> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = this.usersRepository.create({
      ...data,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);

    // Send verification code
    await this.sendVerificationCode(savedUser);

    const accessToken = this.generateToken(savedUser);

    const { password, ...userWithoutPassword } = savedUser;

    return {
      user: userWithoutPassword,
      accessToken,
    };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ user: Partial<User>; accessToken: string }> {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const accessToken = this.generateToken(user);

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
    };
  }

  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.usersService.findOne(userId);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async verifyEmail(email: string, code: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const verificationCode = await this.verificationCodesRepository.findOne({
      where: {
        email,
        code,
        type: 'email',
        isUsed: false,
      },
    });

    if (!verificationCode) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    if (new Date() > verificationCode.expiresAt) {
      throw new BadRequestException('Verification code has expired');
    }

    await this.usersRepository.update(user.id, { emailVerified: true });
    await this.verificationCodesRepository.update(verificationCode.id, {
      isUsed: true,
    });

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const token = this.generateRandomCode(32);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.verificationCodesRepository.save({
      userId: user.id,
      email: user.email,
      code: token,
      type: 'password_reset',
      expiresAt,
    });

    await this.mailService.sendPasswordReset(user.email, token);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const verificationCode = await this.verificationCodesRepository.findOne({
      where: {
        code: token,
        type: 'password_reset',
        isUsed: false,
      },
    });

    if (!verificationCode) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (new Date() > verificationCode.expiresAt) {
      throw new BadRequestException('Reset token has expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.usersRepository.update(verificationCode.userId, {
      password: hashedPassword,
    });

    await this.verificationCodesRepository.update(verificationCode.id, {
      isUsed: true,
    });

    return { message: 'Password reset successfully' };
  }

  async resendVerificationCode(email: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.sendVerificationCode(user);

    return { message: 'Verification code sent' };
  }

  private async sendVerificationCode(user: User): Promise<void> {
    const code = this.generateRandomCode(6);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await this.verificationCodesRepository.save({
      userId: user.id,
      email: user.email,
      code,
      type: 'email',
      expiresAt,
    });

    await this.mailService.sendVerificationCode(user.email, code);
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  private generateRandomCode(length: number): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
