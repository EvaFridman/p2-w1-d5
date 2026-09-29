import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PinoLogger } from 'nestjs-pino';
import { UsersService } from '../users/users.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UnauthorizedError, ConflictError } from '../errors/app.exception.js';
import { RegisterDto } from './dto/register.dto.js';
import { UserRole } from '../generated/prisma/index.js';
import { LoginBlockService } from '../redis/login-block.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly loginBlockService: LoginBlockService,
    private readonly logger: PinoLogger,
  ) {}

  async login(email: string, password: string) {
    const blockTtl = await this.loginBlockService.getBlockTtl(email);

    if (blockTtl > 0) {
      this.logger.warn({ blocked: true }, 'Login attempt blocked');

      throw new UnauthorizedError(
        `Too many failed login attempts. Try again in ${Math.ceil(blockTtl / 60)} minutes`,
      );
    }

    const user = await this.usersService.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      await this.loginBlockService.recordFailure(email);
      throw new UnauthorizedError('Invalid credentials');
    }

    await this.loginBlockService.clearFailures(email);

    const tokens = await this.issuePair(user);

    const { passwordHash: _passwordHash, ...publicUser } = user;

    this.logger.info({ userId: user.id }, 'User logged in');

    return { ...tokens, user: publicUser };
  }

  async issuePair(user: { id: number; role: string }) {
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const accessExpires = this.configService.get<string>('ACCESS_TTL');

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const refreshExpires = this.configService.get<string>('REFRESH_TTL');

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, role: user.role },
      { secret: accessSecret, expiresIn: accessExpires as any },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id },
      { secret: refreshSecret, expiresIn: refreshExpires as any },
    );

    return { accessToken, refreshToken };
  }

  async refresh(token: string) {
    if (!token) throw new UnauthorizedError('Refresh token missing');

    try {
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET');
      const payload = await this.jwtService.verifyAsync(token, {
        secret: refreshSecret,
      });

      const user = await this.usersService.findOne(payload.sub);
      if (!user) throw new UnauthorizedError('User not found');

      const tokens = await this.issuePair(user);

      return { ...tokens, user };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  async register(registerDto: RegisterDto) {
    const { email, name, password, phone } = registerDto;
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser)
      throw new ConflictError('User with such an email already exists');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await this.usersService.create({
      email,
      name,
      passwordHash,
      role: UserRole.client,
      phone,
      avatarFileName: null,
    });

    const tokens = await this.issuePair(newUser);

    return { ...tokens, user: newUser };
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) throw new UnauthorizedError('User not found');

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid)
      throw new UnauthorizedError('Invalid current password');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        passwordHash,
        updatedAt: new Date(),
      },
    });

    return { message: 'Password changed' };
  }

  async getCurrentUser(userId: number) {
    return this.usersService.findOne(userId);
  }
}
