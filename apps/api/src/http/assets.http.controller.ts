import { Body, Controller, ForbiddenException, Headers, NotFoundException, Post, UnauthorizedException } from '@nestjs/common';

import { AuthController } from '../modules/auth/index.js';
import { AssetAccessService } from '../modules/assets/index.js';
import { ContentController } from '../modules/content/index.js';
import { SubscriptionController } from '../modules/subscription/index.js';
import { AuthContextError, resolveRequestPrincipal } from './auth-context.js';
import { parseAssetAccessRequest } from './request-schema.js';

@Controller('assets')
export class AssetsHttpController {
  constructor(
    private readonly assetAccessService: AssetAccessService,
    private readonly contentController: ContentController,
    private readonly subscriptionController: SubscriptionController,
    private readonly authController: AuthController,
  ) {}

  @Post('access')
  async access(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const principal = await this.resolvePrincipal(authorization);
    const request = parseAssetAccessRequest(body);

    if (request.kind === 'AUDIO' && request.purpose === 'STREAM') {
      const assetContext = await this.contentController.getPublishedAudioAssetAccessContext(request.assetKey);
      if (!assetContext) {
        throw new NotFoundException(`Asset ${request.assetKey} not found`);
      }

      if (assetContext.premiumFlag) {
        const subscription = await this.subscriptionController.getMySubscription(principal.userId);
        if (!subscription?.entitlement.canAccessPremium) {
          throw new ForbiddenException('Premium subscription required to access this asset');
        }
      }
    }

    return this.assetAccessService.resolve(request);
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
