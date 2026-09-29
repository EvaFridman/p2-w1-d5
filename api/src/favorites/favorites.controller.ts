import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service.js';
import { ListFavoritesDto } from './dto/list-favorites.dto.js';
import type { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Избранное')
@ApiBearerAuth('bearer')
@Controller('users/:userId/favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @ApiOperation({ summary: 'Добавить объявление в избранное пользователя' })
  @ApiResponse({
    status: 201,
    description: 'Объявление успешно добавлено в избранное',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({
    status: 403,
    description:
      'Агент может управлять избранным только в своём собственном профиле',
  })
  @ApiResponse({
    status: 404,
    description: 'Пользователь или объявление не найдены',
  })
  @ApiResponse({
    status: 409,
    description:
      'Конфликт (объявление уже находится в избранном этого пользователя)',
  })
  @Post(':listingId')
  async add(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('listingId', ParseIntPipe) listingId: number,
    @Req() request: Request,
  ) {
    return await this.favoritesService.add(
      userId,
      listingId,
      request.user as any,
    );
  }

  @ApiOperation({ summary: 'Удалить объявление из избранного пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Объявление успешно удалено из избранного',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({
    status: 403,
    description:
      'Агент может удалять из избранного только в своём собственном профиле',
  })
  @ApiResponse({
    status: 404,
    description: 'Запись в избранном или пользователь не найдены',
  })
  @Delete(':listingId')
  async remove(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('listingId', ParseIntPipe) listingId: number,
    @Req() request: Request,
  ) {
    return await this.favoritesService.remove(
      userId,
      listingId,
      request.user as any,
    );
  }

  @ApiOperation({
    summary: 'Получить список всех избранных объявлений пользователя',
  })
  @ApiResponse({
    status: 200,
    description: 'Список избранных объявлений успешно получен',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({
    status: 403,
    description:
      'Просмотр списка избранного доступен только владельцу профиля или модератору',
  })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @Get()
  async findAll(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: ListFavoritesDto,
    @Req() request: Request,
  ) {
    return await this.favoritesService.findAll(
      userId,
      query,
      request.user as any,
    );
  }
}
