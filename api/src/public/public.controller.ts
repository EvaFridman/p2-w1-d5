import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  Post,
  Body,
  Req,
  Delete,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator.js';
import { OptionalAuth } from '../auth/decorators/optional-auth.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { PublicService } from './public.service.js';
import { SavedSearchesService } from '../saved-searches/saved-searches.service.js';
import { CreateSavedSearchDto } from '../saved-searches/dto/create-saved-search.dto.js';
import { UnauthorizedError } from '../errors/app.exception.js';
import { PublicListingsDto } from './dto/public-listings.dto.js';
import { ListDistrictsDto } from '../districts/dto/list-districts.dto.js';
import { CreateViewingDto } from '../viewings/dto/create-viewing.dto.js';
import { ListViewingsDto } from '../viewings/dto/list-viewings.dto.js';
import type { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Витрина')
@Controller('public')
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly savedSearchesService: SavedSearchesService,
  ) {}

  @ApiOperation({ summary: 'Список опубликованных объявлений для витрины' })
  @ApiResponse({
    status: 200,
    description: 'Список объявлений и метаданные пагинации успешно получены',
  })
  @Public()
  @Get('listings')
  async findAllListings(@Query() query: PublicListingsDto) {
    return await this.publicService.findAllListings(query);
  }

  @ApiOperation({ summary: 'Номер телефона агента по ID' })
  @ApiResponse({
    status: 200,
    description: 'Номер телефона агента успешно получен',
  })
  @ApiResponse({ status: 404, description: 'Номер телефона агента не найден' })
  @Public()
  @Get('agents/:id/phone')
  async findAgentPhone(@Param('id', ParseIntPipe) id: number) {
    return await this.publicService.findAgentPhone(id);
  }

  @ApiOperation({
    summary: 'Информация занятом времени для просмотра по объявлению',
  })
  @ApiResponse({
    status: 200,
    description:
      'Информация о занятом времени для просмотра по объявлению успешно получена',
  })
  @ApiResponse({
    status: 404,
    description: 'Информация об объявлении не найдена',
  })
  @Public()
  @Get('listings/:id/busy-viewing-times')
  async findBusyViewingTimes(@Param('id', ParseIntPipe) id: number) {
    return await this.publicService.findBusyViewingTimes(id);
  }

  @ApiOperation({ summary: 'Информация об объявлении по ID' })
  @ApiResponse({
    status: 200,
    description: 'Информация об объявлении успешно получена',
  })
  @ApiResponse({ status: 404, description: 'Объявление не найдено' })
  @Public()
  @Get('listings/:id')
  async findOneListing(@Param('id', ParseIntPipe) id: number) {
    return await this.publicService.findOneListing(id);
  }

  @ApiOperation({ summary: 'Создать заявку на просмотр объявления' })
  @ApiResponse({
    status: 201,
    description: 'Заявка на просмотр успешно создана',
  })
  @ApiResponse({ status: 400, description: 'Некорректные входные данные' })
  @ApiResponse({ status: 404, description: 'Объявление не найдено' })
  @ApiResponse({ status: 429, description: 'Превышен лимит заявок' })
  @Throttle({ viewingPublic: { ttl: 15 * 60_000, limit: 5 } })
  @OptionalAuth()
  @Post('listings/:id/viewings')
  async createViewing(
    @Param('id', ParseIntPipe) listingId: number,
    @Body() dto: CreateViewingDto,
    @Req() request: Request,
  ) {
    return await this.publicService.createViewing(
      listingId,
      dto,
      request.user ?? undefined,
    );
  }

  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Получить заявки на просмотр текущего пользователя',
  })
  @ApiResponse({
    status: 200,
    description: 'Заявки текущего пользователя успешно получены',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @Get('viewings/my')
  async findMyViewings(
    @Query() query: ListViewingsDto,
    @Req() request: Request,
  ) {
    if (!request.user) throw new UnauthorizedError('User context is missing');
    return await this.publicService.findMyViewings(query, request.user);
  }

  @ApiOperation({
    summary: 'Получить ID избранных объявлений текущего пользователя',
  })
  @ApiResponse({
    status: 200,
    description: 'ID избранных объявлений успешно получены',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @Get('favorites')
  async findAllFavorites(@Req() request: Request) {
    if (!request.user) throw new UnauthorizedError('User context is missing');
    return await this.publicService.findAllFavorites(request.user);
  }

  @ApiOperation({
    summary:
      'Получить опубликованные объявления из избранного текущего пользователя',
  })
  @ApiBearerAuth('bearer')
  @ApiResponse({
    status: 200,
    description: 'Объявления из избранного успешно получены',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @Get('favorites/listings')
  async findFavoriteListings(@Req() request: Request) {
    if (!request.user) throw new UnauthorizedError('User context is missing');
    return await this.publicService.findFavoriteListings(request.user);
  }

  @ApiOperation({ summary: 'Добавить объявление в избранное' })
  @ApiResponse({
    status: 201,
    description: 'Объявление успешно добавлено в избранное',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({ status: 404, description: 'Объявление не найдено' })
  @Post('listings/:id/favorite')
  async addFavorite(
    @Param('id', ParseIntPipe) listingId: number,
    @Req() request: Request,
  ) {
    if (!request.user) throw new UnauthorizedError('User context is missing');
    return await this.publicService.addFavorite(listingId, request.user);
  }

  @ApiOperation({ summary: 'Удалить объявление из избранного' })
  @ApiResponse({
    status: 200,
    description: 'Объявление успешно удалено из избранного',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({
    status: 404,
    description: 'Объявление или запись в избранном не найдены',
  })
  @Delete('listings/:id/favorite')
  async removeFavorite(
    @Param('id', ParseIntPipe) listingId: number,
    @Req() request: Request,
  ) {
    if (!request.user) throw new UnauthorizedError('User context is missing');
    return await this.publicService.removeFavorite(listingId, request.user);
  }

  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Сохранённые поиски текущего клиента' })
  @ApiResponse({ status: 200, description: 'Список сохранённых поисков' })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({ status: 403, description: 'Доступно только клиентам' })
  @Roles('client')
  @Get('saved-searches')
  async findAllSavedSearches(@Req() request: Request) {
    if (!request.user) throw new UnauthorizedError('User context is missing');
    return await this.savedSearchesService.findAll(request.user.id);
  }

  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Сохранить текущий набор фильтров каталога' })
  @ApiResponse({ status: 201, description: 'Поиск сохранён' })
  @ApiResponse({ status: 400, description: 'Некорректное тело запроса' })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({ status: 403, description: 'Доступно только клиентам' })
  @ApiResponse({
    status: 409,
    description: 'Такой набор фильтров или такое имя уже сохранены',
  })
  @ApiResponse({
    status: 422,
    description:
      'Каталог не принимает эти параметры или достигнут лимит сохранений',
  })
  @Roles('client')
  @Post('saved-searches')
  async createSavedSearch(
    @Body() dto: CreateSavedSearchDto,
    @Req() request: Request,
  ) {
    if (!request.user) throw new UnauthorizedError('User context is missing');
    return await this.savedSearchesService.create(request.user.id, dto);
  }

  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Удалить свой сохранённый поиск' })
  @ApiResponse({ status: 200, description: 'Поиск удалён' })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({ status: 403, description: 'Доступно только клиентам' })
  @ApiResponse({
    status: 404,
    description: 'Поиск не найден или принадлежит другому клиенту',
  })
  @Roles('client')
  @Delete('saved-searches/:id')
  async removeSavedSearch(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ) {
    if (!request.user) throw new UnauthorizedError('User context is missing');
    return await this.savedSearchesService.remove(request.user.id, id);
  }

  @ApiOperation({
    summary: 'Параметры сохранённого поиска по публичной ссылке',
  })
  @ApiResponse({
    status: 200,
    description: 'Строка параметров каталога и признак устаревания, без имени',
  })
  @ApiResponse({ status: 404, description: 'Поиск не найден' })
  @Public()
  @Get('saved-searches/by-token/:token')
  async findSavedSearchByToken(@Param('token') token: string) {
    return await this.savedSearchesService.findByToken(token);
  }

  @ApiOperation({
    summary: 'Список районов с количеством опубликованных объектов',
  })
  @ApiResponse({ status: 200, description: 'Список районов успешно получен' })
  @Public()
  @Get('districts')
  async findAllDistricts(@Query() query: ListDistrictsDto) {
    const { page, limit, city } = query;
    return await this.publicService.findAllDistricts(page, limit, city);
  }

  @ApiOperation({ summary: 'Информация о районе по slug' })
  @ApiResponse({ status: 200, description: 'Район успешно получен' })
  @ApiResponse({ status: 404, description: 'Район не найден' })
  @Public()
  @Get('districts/:slug')
  async findDistrictBySlug(@Param('slug') slug: string) {
    return await this.publicService.findDistrictBySlug(slug);
  }

  @ApiOperation({ summary: 'Список опубликованных объявлений для sitemap' })
  @ApiResponse({
    status: 200,
    description: 'Данные для sitemap успешно получены',
  })
  @Public()
  @Get('sitemap/listings')
  async findSitemapListings() {
    return await this.publicService.findSitemapListings();
  }
}
