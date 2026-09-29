import {
  Controller,
  Get,
  Param,
  StreamableFile,
  Response,
  Headers,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SafeFilenamePipe } from './pipes/safe-filename.pipe.js';
import {
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
} from '../errors/app.exception.js';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import type { Response as ExpressResponse } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@ApiTags('Фотографии')
@Controller('files')
export class FilesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @ApiOperation({
    summary: 'Защищенное потоковое получение фотографии объявления',
  })
  @ApiResponse({
    status: 200,
    description: 'Поток файла изображения',
    type: StreamableFile,
  })
  @ApiResponse({
    status: 400,
    description:
      'Некорректный формат имени файла или попытка Path Traversal атак',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен, агент не является владельцем объявления)',
  })
  @ApiResponse({
    status: 404,
    description: 'Фотография или файл на диске не найдены',
  })
  @Get('photos/:fileName')
  async getPhoto(
    @Param('fileName', SafeFilenamePipe) fileName: string,
    @Response({ passthrough: true }) res: ExpressResponse,
    @Headers('authorization') authHeader?: string,
  ): Promise<StreamableFile> {
    const photo = await this.prisma.listingPhotos.findFirst({
      where: { fileName: fileName },
      include: { listing: true },
    });
    if (!photo)
      throw new NotFoundError('Photo not found', null, 'PHOTO_NOT_FOUND');

    if (photo.listing.status !== 'PUBLISHED') {
      if (!authHeader)
        throw new UnauthorizedError(
          'Token required for non-published listings photos',
        );

      try {
        const token = authHeader.startsWith('Bearer ')
          ? authHeader.slice(7)
          : authHeader;
        const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
        const payload = await this.jwtService.verifyAsync(token, { secret });

        const fullUser = await this.prisma.users.findUnique({
          where: { id: Number(payload.sub) },
        });
        if (!fullUser) throw new UnauthorizedError('User from token not found in database');
        const { passwordHash: _passwordHash, ...publicUser } = fullUser;
        res.req.user = publicUser;
      } catch {
        throw new UnauthorizedError('Invalid or expired token');
      }

      const user = res.req.user;
      if (!user) throw new UnauthorizedError('User context is empty');
      if (user.role !== 'moderator') {
        const listing = await this.prisma.listings.findUnique({
          where: { id: photo.listingId },
        });
        if (!listing || listing.agentId !== user.id)
          throw new ForbiddenError(
            'Forbidden access to this photo',
            null,
            'FORBIDDEN',
          );
      }
    }

    const filePath = path.resolve(`./uploads/photos/${fileName}`);
    if (!fs.existsSync(filePath))
      throw new NotFoundError(
        'Physical file not found on disk',
        null,
        'FILE_NOT_FOUND',
      );

    const contentType = mime.lookup(filePath) || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    return new StreamableFile(fs.createReadStream(filePath));
  }

  @Public()
  @ApiOperation({
    summary: 'Публичное потоковое получение аватарки пользователя',
  })
  @ApiResponse({
    status: 200,
    description: 'Поток файла изображения',
    type: StreamableFile,
  })
  @ApiResponse({ status: 400, description: 'Некорректный формат имени файла' })
  @ApiResponse({ status: 404, description: 'Файл аватарки не найден на диске' })
  @Get('avatars/:fileName')
  async getAvatar(
    @Param('fileName', SafeFilenamePipe) fileName: string,
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<StreamableFile> {
    const filePath = path.resolve(`./uploads/avatars/${fileName}`);
    if (!fs.existsSync(filePath))
      throw new NotFoundError(
        'Avatar file not found on disk',
        null,
        'AVATAR_NOT_FOUND',
      );
    const contentType = mime.lookup(filePath) || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    return new StreamableFile(fs.createReadStream(filePath));
  }
}
