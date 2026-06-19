import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';

import { AuthController } from '../modules/auth/index.js';
import { RetentionController } from '../modules/retention/index.js';
import { AuthContextError, resolveRequestPrincipal } from './auth-context.js';

@Controller('retention')
export class RetentionHttpController {
  constructor(
    private readonly retentionController: RetentionController,
    private readonly authController: AuthController,
  ) {}

  @Get('home')
  async getHome(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
  ) {
    const principal = await this.resolvePrincipal(authorization, userId);
    return this.retentionController.getHome(principal.userId);
  }

  private async resolvePrincipal(authorization: string | undefined, userId: string | undefined) {
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
