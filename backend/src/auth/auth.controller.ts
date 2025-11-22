// ==========================================
// AUTH CONTROLLER - Autenticacion y Verificacion
// ==========================================

import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// DTOs
class RegisterDto {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: 'customer' | 'restaurant' | 'driver';
}

class LoginDto {
  email: string;
  password: string;
}

class VerifyEmailDto {
  code: string;
}

class ForgotPasswordDto {
  email: string;
}

class ResetPasswordDto {
  token: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Registro de usuario
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    // Enviar codigo de verificacion por email
    await this.authService.sendVerificationEmail(result.user.id);
    return result;
  }

  // Login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  // Verificar email con codigo
  @Post('verify-email')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Request() req, @Body() dto: VerifyEmailDto) {
    const success = await this.authService.verifyEmail(req.user.id, dto.code);
    return { success };
  }

  // Reenviar codigo de verificacion
  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Request() req) {
    await this.authService.sendVerificationEmail(req.user.id);
    return { message: 'Codigo enviado' };
  }

  // Recuperar password
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.sendPasswordResetEmail(dto.email);
    return { message: 'Email enviado si existe la cuenta' };
  }

  // Restablecer password
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { message: 'Password actualizado' };
  }

  // Obtener perfil
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  // Actualizar perfil
  @Post('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req, @Body() dto: any) {
    return this.authService.updateProfile(req.user.id, dto);
  }
}
