import {
  Controller,
  Query,
  Param,
  Get,
  Post,
  Patch,
  Body,
  Req,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ViewingsService } from './viewings.service.js';
import { UnauthorizedError } from '../errors/app.exception.js';
import { ListViewingsDto } from './dto/list-viewings.dto.js';
import { RecentViewingsDto } from './dto/recent-viewings.dto.js';
import { AgentSelfGuard } from './guards/agent-self.guard.js';
import { CreateViewingDto } from './dto/create-viewing.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { Public } from '../auth/decorators/public.decorator.js';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Заявки на показ')
@Controller()
export class ViewingsController {
  constructor(private readonly viewingsService: ViewingsService) {}

  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Получить список всех заявок на показ с фильтрацией',
  })
  @ApiResponse({
    status: 200,
    description: 'Список заявок на показ успешно получен',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалидный' })
  @Get('viewings')
  async findAll(@Query() query: ListViewingsDto, @Req() request: Request) {
    if (!request.user) throw new UnauthorizedError('User context is missing');
    return await this.viewingsService.findAll(query, request.user);
  }

  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Получить последние заявки на показ по объявлениям агента',
  })
  @ApiResponse({
    status: 200,
    description: 'Последние заявки агента, от новых к старым',
  })
  @ApiResponse({ status: 400, description: 'Некорректный лимит (от 1 до 50)' })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалидный' })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен (агент может смотреть только свои заявки)',
  })
  @ApiResponse({ status: 404, description: 'Агент не найден' })
  @UseGuards(AgentSelfGuard)
  @Get('agents/:id/viewings/recent')
  async findRecentByAgent(
    @Param('id', ParseIntPipe) agentId: number,
    @Query() query: RecentViewingsDto,
  ) {
    return await this.viewingsService.findRecentByAgent(agentId, query);
  }

  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Получить информацию о показе по ID' })
  @ApiResponse({
    status: 200,
    description: 'Информация о заявке на показ успешно получена',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалидный' })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен (показ принадлежит чужому объявлению)',
  })
  @ApiResponse({ status: 404, description: 'Заявка на показ не найдена' })
  @Get('viewings/:id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ) {
    if (!request.user) throw new UnauthorizedError('User context is missing');
    return await this.viewingsService.findOne(id, request.user);
  }

  @ApiOperation({ summary: 'Создать новую заявку на показ для объявления' })
  @ApiResponse({ status: 201, description: 'Заявка на показ успешно создана' })
  @ApiResponse({ status: 400, description: 'Некорректные входные данные' })
  @ApiResponse({ status: 404, description: 'Объявление не найдено' })
  @ApiResponse({
    status: 422,
    description: 'Ошибка валидации полей или превышен лимит частоты запросов',
  })
  @Throttle({ viewing: { ttl: 60 * 60_000, limit: 20 } })
  @Public()
  @Post('listings/:id/viewings')
  async create(
    @Param('id', ParseIntPipe) listingId: number,
    @Body() dto: CreateViewingDto,
  ) {
    return await this.viewingsService.create(listingId, dto);
  }

  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Изменить статус заявки на показ' })
  @ApiResponse({
    status: 200,
    description: 'Статус заявки на показ успешно обновлен',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалидный' })
  @ApiResponse({
    status: 403,
    description:
      'Доступ запрещен (изменять статус может только владелец объявления)',
  })
  @ApiResponse({ status: 404, description: 'Заявка на показ не найдена' })
  @ApiResponse({
    status: 409,
    description: 'Конфликт (недопустимый переход между статусами)',
  })
  @Patch('viewings/:id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
    @Req() request: Request,
  ) {
    if (!request.user) throw new UnauthorizedError('User context is missing');
    return await this.viewingsService.updateStatus(id, dto, request.user);
  }
}
