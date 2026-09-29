import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import ms, { StringValue } from 'ms';
import { RegisterDto } from './dto/register.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { Public } from './decorators/public.decorator.js';
import { Throttle } from '@nestjs/throttler';
import { LoginThrottlerGuard } from './guards/login-throttler.guard.js';
import { RegisterThrottlerGuard } from './guards/register-throttler.guard.js';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Аутентификация')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Аутентификация пользователя' })
  @ApiResponse({ status: 200, description: 'Успешный вход' })
  @ApiResponse({
    status: 400,
    description: 'Некорректный формат входных данных',
  })
  @ApiResponse({
    status: 401,
    description: 'Неверные учетные данные (Неверный email или пароль)',
  })
  @ApiResponse({
    status: 429,
    description:
      'Превышен лимит попыток входа (максимум 10 запросов за 15 минут)',
  })
  @UseGuards(LoginThrottlerGuard)
  @Throttle({ login: { ttl: 15 * 60_000, limit: 10 } })
  @Post('login')
  @Public()
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, refreshToken, user } = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );

    const isProduction =
      (this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV) ===
      'production';
    const refreshTtl =
      this.configService.get<StringValue>('REFRESH_TTL') ?? '30d';

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      path: '/auth',
      maxAge: ms(refreshTtl) as number,
    });

    return { accessToken, user };
  }

  @ApiOperation({ summary: 'Обновление сессии' })
  @ApiResponse({ status: 200, description: 'Пара токенов успешно обновлена' })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @Post('refresh')
  @Public()
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = request.cookies?.['refreshToken'];
    const { accessToken, refreshToken, user } =
      await this.authService.refresh(token);

    const isProduction =
      (this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV) ===
      'production';
    const refreshTtl =
      this.configService.get<StringValue>('REFRESH_TTL') ?? '30d';

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      path: '/auth',
      maxAge: ms(refreshTtl) as number,
    });

    return { accessToken, user };
  }

  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Выход из системы' })
  @ApiResponse({ status: 200, description: 'Сессия успешно завершена' })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('refreshToken', { path: '/auth' });
    return { message: 'Logged out' };
  }

  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Получение профиля текущего аутентифицированного пользователя',
  })
  @ApiResponse({ status: 200, description: 'Данные профиля успешно получены' })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  @Get('me')
  async me(@Req() request: Request) {
    const userId = request.user?.id;
    if (!userId) throw new Error('User not found in request context');
    return this.authService.getCurrentUser(userId);
  }

  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Смена пароля текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Пароль успешно изменен' })
  @ApiResponse({
    status: 400,
    description: 'Некорректные данные нового пароля',
  })
  @ApiResponse({
    status: 401,
    description: 'Текущий пароль неверный или пользователь не авторизован',
  })
  @Patch('password')
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() request: Request,
  ) {
    const userId = request.user?.id;
    if (!userId) throw new Error('User not found in request context');
    return await this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiResponse({
    status: 201,
    description: 'Новый аккаунт успешно зарегистрирован',
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные параметры регистрации',
  })
  @ApiResponse({
    status: 409,
    description:
      'Конфликт (пользователь с таким email уже существует в системе)',
  })
  @ApiResponse({
    status: 429,
    description: 'Превышен лимит регистраций (максимум 5 запросов в час)',
  })
  @UseGuards(RegisterThrottlerGuard)
  @Throttle({ register: { ttl: 60 * 60_000, limit: 5 } })
  @Post('register')
  @Public()
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.register(registerDto);

    const isProduction =
      (this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV) ===
      'production';
    const refreshTtl =
      this.configService.get<StringValue>('REFRESH_TTL') ?? '30d';

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      path: '/auth',
      maxAge: ms(refreshTtl) as number,
    });

    return { accessToken, user };
  }
}
