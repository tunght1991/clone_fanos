import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthHttpController {
  @Get('health')
  health() {
    return {
      status: 'ok',
    };
  }
}

