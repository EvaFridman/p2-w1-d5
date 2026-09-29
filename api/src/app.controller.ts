import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Общее')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Проверка работоспособности корня приложения' })
  @ApiResponse({
    status: 200,
    description: 'Приветственная строка успешно возвращена',
  })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
