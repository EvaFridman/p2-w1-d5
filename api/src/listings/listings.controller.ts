import {
  Controller,
  ParseIntPipe,
  Query,
  StreamableFile,
  Response,
  Body,
  Param,
  Req,
  Get,
  Post,
  Patch,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Delete,
} from '@nestjs/common';
import { ListingsService } from './listings.service.js';
import { ListListingsDto } from './dto/list-listings.dto.js';
import { CreateListingDto } from './dto/create-listing.dto.js';
import { UpdateListingDto } from './dto/update-listing.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { UpdatePhotoDto } from './dto/update-photo.dto.js';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { photoStorage } from '../files/storage/photo.storage.js';
import { PhotoValidationPipe } from '../common/pipes/photo-validation.pipe.js';
import { ListingOwnerGuard } from './guards/listing-owner.guard.js';
import { Throttle } from '@nestjs/throttler';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PdfQueryDto } from './dto/pdf-query.dto.js';
import { PdfBundleQueryDto } from './dto/pdf-bundle-query.dto.js';
import type { Response as ExpressResponse } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ViewingsService } from '../viewings/viewings.service.js';

@ApiTags('Объявления')
@ApiBearerAuth('bearer')
@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly viewingsService: ViewingsService,
  ) { }

  @ApiOperation({
    summary: 'Получить список объявлений с фильтрацией и пагинацией',
  })
  @ApiResponse({
    status: 200,
    description: 'Список объявлений и метаданные пагинации успешно получены',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @Get()
  async findAll(@Query() query: ListListingsDto, @Req() request: Request) {
    const currentUser = request.user as { id: number; role: string };
    return await this.listingsService.findAll(query, currentUser);
  }

  @Roles('moderator')
  @ApiOperation({
    summary:
      'Генерация и потоковая отдача сборника объявлений по списку ID (Доступно только модераторам)',
  })
  @ApiResponse({
    status: 200,
    description: 'Поток многостраничного PDF-документа',
    type: StreamableFile,
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректный формат списка ID объявлений',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({
    status: 403,
    description: 'Выгрузка бандлов доступна только модераторам',
  })
  @ApiResponse({
    status: 404,
    description: 'Ни одного объявления из переданного списка ID не найдено',
  })
  @Get('pdf/bundle')
  async getListingsBundle(
    @Query() query: PdfBundleQueryDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<StreamableFile> {
    const pdfStream = await this.listingsService.getListingsBundleStream(
      query.ids,
    );
    const disposition = query.mode === 'download' ? 'attachment' : 'inline';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="listings-bundle.pdf"`,
    );

    return new StreamableFile(pdfStream);
  }

  @ApiOperation({ summary: 'Создать новое объявление' })
  @ApiResponse({ status: 201, description: 'Объявление успешно создано' })
  @ApiResponse({ status: 400, description: 'Некорректные входные данные' })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @Post()
  async create(@Body() dto: CreateListingDto, @Req() request: Request) {
    const user = request.user as { id: number };
    return await this.listingsService.create(dto, user.id);
  }

  @ApiOperation({ summary: 'Получить информацию об объявлении по ID' })
  @ApiResponse({
    status: 200,
    description: 'Информация об объявлении успешно получена',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({
    status: 403,
    description: 'Агент может просматривать только свои объявления',
  })
  @ApiResponse({ status: 404, description: 'Объявление не найдено' })
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ) {
    if (!request.user) throw new Error('User context is missing');
    return await this.listingsService.findOne(id, request.user);
  }

  @ApiOperation({
    summary: 'Получить список всех заявок на показы для конкретного объявления',
  })
  @ApiResponse({
    status: 200,
    description: 'Список показов для указанного объявления успешно получен',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({ status: 404, description: 'Объявление не найдено' })
  @Get(':id/viewings')
  async findListingViewings(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ) {
    const currentUser = request.user as { id: number; role: string };
    return await this.viewingsService.findAll(
      { listingId: id, page: 1, limit: 100 },
      currentUser,
    );
  }

  @ApiOperation({ summary: 'Обновить параметры существующего объявления' })
  @ApiResponse({
    status: 200,
    description: 'Данные объявления успешно обновлены',
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные входные данные для модификации',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({
    status: 403,
    description: 'Агент имеет право редактировать только свои объявления',
  })
  @ApiResponse({ status: 404, description: 'Объявление не найдено' })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateListingDto,
    @Req() request: Request,
  ) {
    if (!request.user) throw new Error('User context is missing');
    return await this.listingsService.update(id, dto, request.user);
  }

  @ApiOperation({
    summary:
      'Перевести объявление на новый статус (Доступно только модераторам)',
  })
  @ApiResponse({
    status: 200,
    description: 'Статус объявления успешно изменен',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({
    status: 403,
    description: 'Управление статусами доступно только модераторам',
  })
  @ApiResponse({ status: 404, description: 'Объявление не найдено' })
  @ApiResponse({
    status: 409,
    description:
      'Конфликт (запрошенный переход нарушает правила смены статусов)',
  })
  @Roles('moderator')
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return await this.listingsService.updateStatus(id, dto);
  }

  @ApiOperation({ summary: 'Получить список всех фотографий объявления' })
  @ApiResponse({
    status: 200,
    description: 'Список фотографий успешно получен',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({ status: 404, description: 'Объявление не найдено' })
  @Get(':id/photos')
  async findPhotos(@Param('id', ParseIntPipe) id: number) {
    return await this.listingsService.findPhotos(id);
  }

  @ApiOperation({ summary: 'Обновить параметры фотографии' })
  @ApiResponse({
    status: 200,
    description: 'Параметры фотографии успешно обновлены в базе данных',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({
    status: 404,
    description: 'Фотография или объявление не найдены',
  })
  @Patch(':id/photos/:photoId')
  async updatePhoto(
    @Param('id', ParseIntPipe) id: number,
    @Param('photoId', ParseIntPipe) photoId: number,
    @Body() dto: UpdatePhotoDto,
  ) {
    return await this.listingsService.updatePhoto(id, photoId, dto);
  }

  @ApiOperation({ summary: 'Назначить фотографию обложкой объявления' })
  @ApiResponse({
    status: 200,
    description: 'Фотография успешно сделана обложкой объявления',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({
    status: 404,
    description: 'Фотография или объявление не найдены',
  })
  @Patch(':id/photos/:photoId/cover')
  async makePhotoCover(
    @Param('id', ParseIntPipe) id: number,
    @Param('photoId', ParseIntPipe) photoId: number,
  ) {
    return await this.listingsService.updatePhoto(id, photoId, {
      isCover: true,
    });
  }

  @ApiOperation({ summary: 'Загрузка фотографий для объявления' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description:
            'Массив файлов изображений (jpeg, png, webp) до 5 штук, до 5Мб каждый',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Фотографии успешно сохранены' })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({
    status: 403,
    description: 'Агент может добавлять фотографии только в свои объявления',
  })
  @ApiResponse({
    status: 409,
    description:
      'Конфликт (превышен суммарный лимит в 5 фотографий на одно объявление)',
  })
  @ApiResponse({
    status: 422,
    description:
      'Неподдерживаемый формат, расширение или размер файла превышает 5Мб',
  })
  @ApiResponse({
    status: 429,
    description:
      'Превышен лимит частоты запросов на загрузку фотографий (максимум 15 попыток за 30 минут)',
  })
  @Throttle({ upload: { limit: 30, ttl: 15 * 60_000 } })
  @Post(':id/photos')
  @UseGuards(ListingOwnerGuard)
  @UseInterceptors(
    FilesInterceptor('photos', 5, {
      storage: photoStorage,
      limits: { fileSize: 5 * 1024 * 1024, files: 5 },
    }),
  )
  async uploadPhotos(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles(PhotoValidationPipe) files: Express.Multer.File[],
  ) {
    return await this.listingsService.uploadPhotos(id, files);
  }

  @ApiOperation({ summary: 'Удалить фотографию объявления' })
  @ApiResponse({ status: 200, description: 'Запись успешно удалена' })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({
    status: 403,
    description: 'Агент может удалять фотографии только из своих объявлений',
  })
  @ApiResponse({
    status: 404,
    description: 'Фотография или объявление не найдены',
  })
  @Delete(':id/photos/:photoId')
  @UseGuards(ListingOwnerGuard)
  async deletePhoto(
    @Param('id', ParseIntPipe) id: number,
    @Param('photoId', ParseIntPipe) photoId: number,
  ) {
    return await this.listingsService.deletePhoto(id, photoId);
  }

  @ApiOperation({
    summary:
      'Генерация и потоковая отдача PDF объявления (Доступно только модераторам)',
  })
  @ApiResponse({
    status: 200,
    description: 'Поток PDF-документа',
    type: StreamableFile,
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({
    status: 403,
    description: 'Выгрузка PDF доступна только модераторам',
  })
  @ApiResponse({ status: 404, description: 'Объявление не найдено' })
  @Roles('moderator')
  @Get(':id/pdf')
  async getListingPdf(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PdfQueryDto,
    @Req() request: Request,
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<StreamableFile> {
    if (!request.user) throw new Error('User context is missing');
    const pdfStream = await this.listingsService.getListingPdfStream(
      id,
      request.user,
    );
    const disposition = query.mode === 'download' ? 'attachment' : 'inline';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="listing-${id}.pdf"`,
    );

    return new StreamableFile(pdfStream);
  }
}