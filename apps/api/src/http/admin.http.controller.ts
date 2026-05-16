import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthController } from '../modules/auth/index.js';
import { ContentMutationService } from '../modules/content/index.js';
import { AuthContextError, requireRole, resolveRequestPrincipal } from './auth-context.js';
import {
  parseAdminCreateAudiobookRequest,
  parseAdminCreateChapterRequest,
  parseAdminUpdateAudiobookRequest,
  parseAdminUpdateChapterRequest,
} from './request-schema.js';

@Controller('admin')
export class AdminHttpController {
  constructor(
    private readonly authController: AuthController,
    private readonly contentMutationService: ContentMutationService,
  ) {}

  @Get('me')
  async me(@Headers('authorization') authorization: string | undefined, @Headers('x-user-id') userId: string | undefined) {
    const principal = await this.resolvePrincipal(authorization, userId);
    requireRole(principal, 'admin');

    return {
      userId: principal.userId,
      email: principal.email,
      displayName: principal.displayName,
      role: principal.role,
    };
  }

  @Post('audiobooks')
  async createAudiobook(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Body() body: unknown,
  ) {
    await this.resolveAdminPrincipal(authorization, userId);
    return this.contentMutationService.createAudiobook(
      mapAdminCreateAudiobookInput(parseAdminCreateAudiobookRequest(body)),
    );
  }

  @Patch('audiobooks/:id')
  async updateAudiobook(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Param('id') audiobookId: string,
    @Body() body: unknown,
  ) {
    await this.resolveAdminPrincipal(authorization, userId);
    return this.contentMutationService.updateAudiobook({
      id: audiobookId,
      ...mapAdminUpdateAudiobookInput(parseAdminUpdateAudiobookRequest(body)),
    });
  }

  @Patch('audiobooks/:id/publish')
  async publishAudiobook(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Headers('x-request-id') requestId: string | undefined,
    @Param('id') audiobookId: string,
  ) {
    await this.resolveAdminPrincipal(authorization, userId);
    return this.contentMutationService.publishAudiobook(audiobookId, requestId);
  }

  @Patch('audiobooks/:id/unpublish')
  async unpublishAudiobook(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Headers('x-request-id') requestId: string | undefined,
    @Param('id') audiobookId: string,
  ) {
    await this.resolveAdminPrincipal(authorization, userId);
    return this.contentMutationService.unpublishAudiobook(audiobookId, requestId);
  }

  @Post('chapters')
  async createChapter(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Body() body: unknown,
  ) {
    await this.resolveAdminPrincipal(authorization, userId);
    return this.contentMutationService.createChapter(mapAdminCreateChapterInput(parseAdminCreateChapterRequest(body)));
  }

  @Patch('chapters/:id')
  async updateChapter(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Param('id') chapterId: string,
    @Body() body: unknown,
  ) {
    await this.resolveAdminPrincipal(authorization, userId);
    return this.contentMutationService.updateChapter({
      id: chapterId,
      ...mapAdminUpdateChapterInput(parseAdminUpdateChapterRequest(body)),
    });
  }

  @Patch('chapters/:id/publish')
  async publishChapter(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Headers('x-request-id') requestId: string | undefined,
    @Param('id') chapterId: string,
  ) {
    await this.resolveAdminPrincipal(authorization, userId);
    return this.contentMutationService.publishChapter(chapterId, requestId);
  }

  @Patch('chapters/:id/unpublish')
  async unpublishChapter(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Headers('x-request-id') requestId: string | undefined,
    @Param('id') chapterId: string,
  ) {
    await this.resolveAdminPrincipal(authorization, userId);
    return this.contentMutationService.unpublishChapter(chapterId, requestId);
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

  private async resolveAdminPrincipal(authorization: string | undefined, userId: string | undefined) {
    const principal = await this.resolvePrincipal(authorization, userId);
    requireRole(principal, 'admin');
    return principal;
  }
}

function mapAdminCreateAudiobookInput(request: ReturnType<typeof parseAdminCreateAudiobookRequest>) {
  return {
    title: request.title,
    description: request.description ?? null,
    coverImageAssetKey: request.coverImageAssetKey ?? null,
    authorId: request.authorId,
    durationSec: request.durationSec ?? 0,
    premiumFlag: request.premiumFlag ?? false,
    languageCode: request.languageCode ?? 'vi',
  };
}

function mapAdminUpdateAudiobookInput(request: ReturnType<typeof parseAdminUpdateAudiobookRequest>) {
  return {
    title: request.title,
    description: request.description ?? null,
    coverImageAssetKey: request.coverImageAssetKey ?? null,
    authorId: request.authorId,
    durationSec: request.durationSec ?? 0,
    premiumFlag: request.premiumFlag ?? false,
    languageCode: request.languageCode ?? 'vi',
  };
}

function mapAdminCreateChapterInput(request: ReturnType<typeof parseAdminCreateChapterRequest>) {
  return {
    audiobookId: request.audiobookId,
    title: request.title,
    orderIndex: request.orderIndex,
    durationSec: request.durationSec ?? 0,
    audioAssetKey: request.audioAssetKey,
    transcript: request.transcript ?? null,
  };
}

function mapAdminUpdateChapterInput(request: ReturnType<typeof parseAdminUpdateChapterRequest>) {
  return {
    title: request.title,
    orderIndex: request.orderIndex,
    durationSec: request.durationSec ?? 0,
    audioAssetKey: request.audioAssetKey,
    transcript: request.transcript ?? null,
  };
}
