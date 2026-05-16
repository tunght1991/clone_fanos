import { BadRequestException, Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';

import { ContentController } from '../modules/content/index.js';

@Controller('audiobooks')
export class ContentHttpController {
  constructor(private readonly contentController: ContentController) {}

  @Get()
  async listAudiobooks(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.contentController.listAudiobooks({
      page: parseOptionalPositiveInteger(page),
      pageSize: parseOptionalPositiveInteger(pageSize),
    });
  }

  @Get(':id')
  async getAudiobookById(@Param('id') audiobookId: string) {
    const result = await this.contentController.getAudiobookById(audiobookId);
    if (!result) {
      throw new NotFoundException(`Audiobook ${audiobookId} not found`);
    }

    return result;
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
