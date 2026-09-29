import {
  Controller,
  Query,
  ParseIntPipe,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UploadedFile,
  UseGuards,
  Delete,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ListUsersDto } from './dto/list-users.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { PublicUser } from './users.types.js';
import { avatarStorage } from '../files/storage/avatar.storage.js';
import { PhotoValidationPipe } from '../common/pipes/photo-validation.pipe.js';
import { UserAvatarAccessGuard } from './guards/user-avatar-access.guard.js';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Пользователи')
@ApiBearerAuth('bearer')
@Roles('moderator')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: 'Создание нового пользователя (Доступно только модераторам)',
  })
  @ApiResponse({ status: 201, description: 'Пользователь успешно создан' })
  @ApiResponse({ status: 400, description: 'Некорректные входные данные' })
  @ApiResponse({
    status: 401,
    description: 'Токен отсутствует, просрочен или невалиден',
  })
  @ApiResponse({
    status: 403,
    description:
      'Требуется роль модератор, у текущего пользователя недостаточно прав',
  })
  @ApiResponse({
    status: 409,
    description: 'Конфликт (пользователь с таким email уже существует)',
  })
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<PublicUser> {
    return await this.usersService.create(createUserDto);
  }

  @ApiOperation({
    summary: 'Получение списка всех пользователей с пагинацией и фильтрацией',
  })
  @ApiResponse({
    status: 200,
    description: 'Список пользователей успешно получен',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({
    status: 403,
    description: 'Доступ к списку пользователей разрешён только модераторам',
  })
  @Get()
  async findAll(@Query() query: ListUsersDto) {
    const { page, limit, role } = query;
    return await this.usersService.findAll(page, limit, role);
  }

  @ApiOperation({
    summary: 'Получение детальной информации о пользователе по ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Информация о пользователе успешно получена',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({
    status: 403,
    description:
      'Просмотр профилей доступен только в своем профиле и модераторам',
  })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<PublicUser> {
    return await this.usersService.findOne(id);
  }

  @ApiOperation({ summary: 'Обновление данных пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Данные пользователя успешно обновлены',
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные данные для обновления',
  })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({
    status: 403,
    description:
      'Редактирование профилей доступно только в своем профиле и модераторам',
  })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<PublicUser> {
    return await this.usersService.update(id, updateUserDto);
  }

  @ApiOperation({
    summary:
      'Загрузка или обновление аватарки пользователя (Сам себе или модератор)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description:
            'Файл изображения (jpeg, png, webp) размером до 5 мегабайт',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Аватарка успешно обновлена' })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({
    status: 403,
    description:
      'Агент может изменять аватар только в своём собственном профиле',
  })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({
    status: 422,
    description:
      'Неподдерживаемый тип содержимого или размер файла превышает 5Мб',
  })
  @Throttle({ upload: { limit: 30, ttl: 15 * 60_000 } })
  @UseGuards(UserAvatarAccessGuard)
  @Post(':id/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: avatarStorage,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async updateAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(PhotoValidationPipe) file: Express.Multer.File,
  ) {
    return await this.usersService.updateAvatar(id, file);
  }

  @ApiOperation({ summary: 'Удаление аватарки пользователя' })
  @ApiResponse({ status: 200, description: 'Аватарка успешно удалена' })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @ApiResponse({
    status: 403,
    description:
      'Агент может удалять аватар только в своём собственном профиле',
  })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @UseGuards(UserAvatarAccessGuard)
  @Delete(':id/avatar')
  async removeAvatar(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.removeAvatar(id);
  }
}
