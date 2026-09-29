import {
  Controller,
  Query,
  ParseIntPipe,
  Get,
  Post,
  Body,
  Patch,
  Param,
} from '@nestjs/common';
import { DistrictsService } from './districts.service.js';
import { CreateDistrictDto } from './dto/create-district.dto.js';
import { UpdateDistrictDto } from './dto/update-district.dto.js';
import { ListDistrictsDto } from './dto/list-districts.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { District } from './districts.types.js';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Районы')
@Controller('districts')
export class DistrictsController {
  constructor(private readonly districtsService: DistrictsService) {}

  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Создать новый район (Доступно только модераторам)',
  })
  @ApiResponse({ status: 201, description: 'Район успешно создан' })
  @ApiResponse({ status: 400, description: 'Некорректные входные данные' })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({
    status: 403,
    description: 'Управление списком районов доступно только модераторам',
  })
  @ApiResponse({
    status: 409,
    description:
      'Конфликт (район с таким названием уже существует в данном городе)',
  })
  @Roles('moderator')
  @Post()
  async create(@Body() dto: CreateDistrictDto): Promise<District> {
    return await this.districtsService.create(dto);
  }

  @ApiOperation({
    summary: 'Получить список всех районов с фильтрацией и пагинацией',
  })
  @ApiResponse({ status: 200, description: 'Список районов успешно получен' })
  @Get()
  async findAll(@Query() query: ListDistrictsDto) {
    const { page, limit, city } = query;
    return await this.districtsService.findAll(page, limit, city);
  }

  @ApiOperation({ summary: 'Получить общее количество районов в базе данных' })
  @ApiResponse({
    status: 200,
    description: 'Общее число районов успешно получено',
  })
  @Get('count')
  async count(): Promise<number> {
    return await this.districtsService.count();
  }

  @ApiOperation({ summary: 'Получить информацию о районе по его ID' })
  @ApiResponse({
    status: 200,
    description: 'Информация о районе успешно получена',
  })
  @ApiResponse({ status: 404, description: 'Район не найден' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<District> {
    return await this.districtsService.findOne(id);
  }

  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Обновить статус или параметры района' })
  @ApiResponse({ status: 200, description: 'Данные района успешно обновлены' })
  @ApiResponse({
    status: 400,
    description: 'Некорректные данные для обновления',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({
    status: 403,
    description: 'Изменение параметров районов доступно только модераторам',
  })
  @ApiResponse({ status: 404, description: 'Район не найден' })
  @Patch(':id/status')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDistrictDto,
  ): Promise<District> {
    return await this.districtsService.update(id, dto);
  }
}
