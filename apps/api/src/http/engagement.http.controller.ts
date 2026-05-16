import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthController } from '../modules/auth/index.js';
import type {
  BookmarkListResponseDto,
  CreateBookmarkRequestDto,
  CreateNoteRequestDto,
  FavoriteListResponseDto,
  FavoriteToggleResponseDto,
  NoteDetailResponseDto,
  NoteListResponseDto,
  UpdateNoteRequestDto,
} from '../modules/engagement/index.js';
import { EngagementController } from '../modules/engagement/index.js';
import { AuthContextError, resolveRequestPrincipal } from './auth-context.js';

@Controller()
export class EngagementHttpController {
  constructor(
    private readonly engagementController: EngagementController,
    private readonly authController: AuthController,
  ) {}

  @Post('bookmarks')
  async createBookmark(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Body() body: CreateBookmarkRequestDto,
  ) {
    const principal = await this.resolvePrincipal(authorization, userId);
    return this.engagementController.createBookmark(principal.userId, body);
  }

  @Get('bookmarks')
  async listBookmarks(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('audiobookId') audiobookId?: string,
  ): Promise<BookmarkListResponseDto> {
    const principal = await this.resolvePrincipal(authorization, userId);
    return this.engagementController.listBookmarks(principal.userId, {
      page: parseOptionalPositiveInteger(page),
      pageSize: parseOptionalPositiveInteger(pageSize),
      audiobookId,
    });
  }

  @Delete('bookmarks/:id')
  async deleteBookmark(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Param('id') bookmarkId: string | undefined,
  ) {
    const principal = await this.resolvePrincipal(authorization, userId);
    if (!bookmarkId) {
      throw new BadRequestException('Bookmark id is required');
    }

    const result = await this.engagementController.deleteBookmark(principal.userId, bookmarkId);
    if (!result.deleted) {
      throw new NotFoundException(`Bookmark ${bookmarkId} not found`);
    }

    return result;
  }

  @Post('favorites/:audiobookId')
  async addFavorite(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Param('audiobookId') audiobookId: string | undefined,
  ): Promise<FavoriteToggleResponseDto> {
    const principal = await this.resolvePrincipal(authorization, userId);
    if (!audiobookId) {
      throw new BadRequestException('Audiobook id is required');
    }

    return this.engagementController.addFavorite(principal.userId, audiobookId);
  }

  @Delete('favorites/:audiobookId')
  async removeFavorite(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Param('audiobookId') audiobookId: string | undefined,
  ) {
    const principal = await this.resolvePrincipal(authorization, userId);
    if (!audiobookId) {
      throw new BadRequestException('Audiobook id is required');
    }

    const result = await this.engagementController.removeFavorite(principal.userId, audiobookId);
    if (!result.deleted) {
      throw new NotFoundException(`Favorite for audiobook ${audiobookId} not found`);
    }

    return result;
  }

  @Get('favorites')
  async listFavorites(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('audiobookId') audiobookId?: string,
  ): Promise<FavoriteListResponseDto> {
    const principal = await this.resolvePrincipal(authorization, userId);
    return this.engagementController.listFavorites(principal.userId, {
      page: parseOptionalPositiveInteger(page),
      pageSize: parseOptionalPositiveInteger(pageSize),
      audiobookId,
    });
  }

  @Post('notes')
  async createNote(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Body() body: CreateNoteRequestDto,
  ) {
    const principal = await this.resolvePrincipal(authorization, userId);
    return this.engagementController.createNote(principal.userId, body);
  }

  @Get('notes')
  async listNotes(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('audiobookId') audiobookId?: string,
  ): Promise<NoteListResponseDto> {
    const principal = await this.resolvePrincipal(authorization, userId);
    return this.engagementController.listNotes(principal.userId, {
      page: parseOptionalPositiveInteger(page),
      pageSize: parseOptionalPositiveInteger(pageSize),
      audiobookId,
    });
  }

  @Get('notes/:id')
  async getNote(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Param('id') noteId: string | undefined,
  ): Promise<NoteDetailResponseDto> {
    const principal = await this.resolvePrincipal(authorization, userId);
    if (!noteId) {
      throw new BadRequestException('Note id is required');
    }

    const result = await this.engagementController.getNote(principal.userId, noteId);
    if (!result) {
      throw new NotFoundException(`Note ${noteId} not found`);
    }

    return result;
  }

  @Patch('notes/:id')
  async updateNote(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Param('id') noteId: string | undefined,
    @Body() body: UpdateNoteRequestDto,
  ): Promise<NoteDetailResponseDto> {
    const principal = await this.resolvePrincipal(authorization, userId);
    if (!noteId) {
      throw new BadRequestException('Note id is required');
    }

    const result = await this.engagementController.updateNote(principal.userId, noteId, body);
    if (!result) {
      throw new NotFoundException(`Note ${noteId} not found`);
    }

    return result;
  }

  @Delete('notes/:id')
  async deleteNote(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Param('id') noteId: string | undefined,
  ) {
    const principal = await this.resolvePrincipal(authorization, userId);
    if (!noteId) {
      throw new BadRequestException('Note id is required');
    }

    const result = await this.engagementController.deleteNote(principal.userId, noteId);
    if (!result.deleted) {
      throw new NotFoundException(`Note ${noteId} not found`);
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

function parseOptionalPositiveInteger(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestException(`Invalid integer value: ${value}`);
  }

  return parsed;
}
