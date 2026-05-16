import { Body, Controller, Post } from '@nestjs/common';

import { AssetAccessService } from '../modules/assets/index.js';
import { parseAssetAccessRequest } from './request-schema.js';

@Controller('assets')
export class AssetsHttpController {
  constructor(private readonly assetAccessService: AssetAccessService) {}

  @Post('access')
  async access(@Body() body: unknown) {
    return this.assetAccessService.resolve(parseAssetAccessRequest(body));
  }
}
