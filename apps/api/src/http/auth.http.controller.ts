import { Body, Controller, Get, Headers, NotFoundException, Post, UnauthorizedException } from '@nestjs/common';

import { AuthController } from '../modules/auth/index.js';
import { AuthContextError, resolveRequestPrincipal } from './auth-context.js';
import {
  parseAuthLoginRequest,
  parseAuthLogoutRequest,
  parseAuthRegisterRequest,
  parseAuthRefreshRequest,
} from './request-schema.js';

@Controller('auth')
export class AuthHttpController {
  constructor(private readonly authController: AuthController) {}

  @Post('register')
  async register(@Body() body: unknown) {
    return this.authController.register(parseAuthRegisterRequest(body));
  }

  @Post('login')
  async login(@Body() body: unknown) {
    return this.authController.login(parseAuthLoginRequest(body));
  }

  @Post('refresh')
  async refresh(@Body() body: unknown) {
    return this.authController.refresh(parseAuthRefreshRequest(body));
  }

  @Post('logout')
  async logout(@Body() body: unknown) {
    return this.authController.logout(parseAuthLogoutRequest(body));
  }

  @Get('me')
  async me(@Headers('authorization') authorization?: string, @Headers('x-user-id') userId?: string) {
    const principal = await this.resolvePrincipal(authorization, userId);
    const profile = await this.authController.me(principal.userId);
    if (!profile) {
      throw new NotFoundException(`User ${principal.userId} not found`);
    }

    return profile;
  }

  private async resolvePrincipal(authorization?: string, userId?: string) {
    try {
      return await resolveRequestPrincipal(this.authController, authorization, userId);
    } catch (error) {
      if (error instanceof AuthContextError) {
        throw new UnauthorizedException(error.message);
      }

      throw error;
    }
  }
}
