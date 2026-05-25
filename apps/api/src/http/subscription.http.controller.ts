import { Body, Controller, Get, Headers, NotFoundException, Post, UnauthorizedException } from '@nestjs/common';

import { AuthController } from '../modules/auth/index.js';
import { SubscriptionController } from '../modules/subscription/index.js';
import { AuthContextError, resolveRequestPrincipal } from './auth-context.js';
import {
  parseSubscriptionCheckoutRequest,
  parseSubscriptionVerifyRequest,
  parseSubscriptionWebhookEvent,
} from './request-schema.js';

@Controller('subscriptions')
export class SubscriptionHttpController {
  constructor(
    private readonly subscriptionController: SubscriptionController,
    private readonly authController: AuthController,
  ) {}

  @Get('plans')
  async listPlans() {
    return this.subscriptionController.listPlans();
  }

  @Get('me')
  async getMySubscription(@Headers('authorization') authorization: string | undefined) {
    const principal = await this.resolvePrincipal(authorization);
    const result = await this.subscriptionController.getMySubscription(principal.userId);
    if (!result) {
      throw new NotFoundException(`Subscription for user ${principal.userId} not found`);
    }

    return result;
  }

  @Post('verify')
  async verifySubscription(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: unknown = {},
  ) {
    const principal = await this.resolvePrincipal(authorization);
    const result = await this.subscriptionController.verifySubscriptionWithContext(
      principal.userId,
      parseSubscriptionVerifyRequest(body),
    );
    if (!result) {
      throw new NotFoundException(`Subscription for user ${principal.userId} not found`);
    }

    return result;
  }

  @Post('checkout')
  async checkout(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const principal = await this.resolvePrincipal(authorization);
    return this.subscriptionController.checkout(principal.userId, parseSubscriptionCheckoutRequest(body));
  }

  @Post('webhook')
  async webhook(
    @Headers('x-webhook-signature') signature: string | undefined,
    @Body() body: unknown,
  ) {
    return this.subscriptionController.handleWebhook(parseSubscriptionWebhookEvent(body), signature);
  }

  private async resolvePrincipal(authorization: string | undefined) {
    try {
      return await resolveRequestPrincipal(this.authController, authorization);
    } catch (error) {
      if (error instanceof AuthContextError) {
        throw new UnauthorizedException(error.message);
      }

      throw error;
    }
  }
}
