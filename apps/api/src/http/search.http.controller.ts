import { BadRequestException, Controller, Get, Query } from '@nestjs/common';

import { SearchController } from '../modules/search/index.js';
import {
  parseSearchRequestQuery,
  SearchQueryParseError,
  type SearchHttpQuery,
} from './search.http.parsers.js';

@Controller('search')
export class SearchHttpController {
  constructor(private readonly searchController: SearchController) {}

  @Get()
  async search(@Query() query: SearchHttpQuery) {
    try {
      return await this.searchController.search(parseSearchRequestQuery(query));
    } catch (error) {
      if (error instanceof SearchQueryParseError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
