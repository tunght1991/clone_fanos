import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';

import { AuthController } from '../modules/auth/index.js';
import { AnalyticsController } from '../modules/analytics/index.js';
import { AuthContextError, resolveRequestPrincipal } from './auth-context.js';
import { parseAnalyticsIngestRequest } from './request-schema.js';

@Controller('analytics')
export class AnalyticsHttpController {
  constructor(
    private readonly analyticsController: AnalyticsController,
    private readonly authController: AuthController,
  ) {}

  @Post('events')
  async ingest(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Body() body: unknown,
  ) {
    const principal = await this.resolvePrincipal(authorization, userId);
    return this.analyticsController.ingest(principal.userId, parseAnalyticsIngestRequest(body));
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
