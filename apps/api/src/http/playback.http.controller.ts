import { Body, Controller, Get, Headers, NotFoundException, Param, Post, UnauthorizedException } from '@nestjs/common';

import { AuthController } from '../modules/auth/index.js';
import { PlaybackController } from '../modules/playback/index.js';
import { AuthContextError, resolveRequestPrincipal } from './auth-context.js';
import { parsePlaybackProgressRequest } from './request-schema.js';

@Controller('playback')
export class PlaybackHttpController {
  constructor(
    private readonly playbackController: PlaybackController,
    private readonly authController: AuthController,
  ) {}

  @Post('progress')
  async saveProgress(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Body() body: unknown,
  ) {
    const principal = await this.resolvePrincipal(authorization, userId);
    return this.playbackController.saveProgress(principal.userId, parsePlaybackProgressRequest(body));
  }

  @Get('progress/:audiobookId')
  async getProgress(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Param('audiobookId') audiobookId: string | undefined,
  ) {
    const principal = await this.resolvePrincipal(authorization, userId);
    if (!audiobookId) {
      throw new NotFoundException('Audiobook id is required');
    }

    const result = await this.playbackController.getProgress(principal.userId, audiobookId);
    if (!result) {
      throw new NotFoundException(`Progress for audiobook ${audiobookId} not found`);
    }

    return result;
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
