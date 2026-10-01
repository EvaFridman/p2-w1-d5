import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import fs from 'fs';
import path from 'path';
import { Prisma } from '../generated/prisma/index.js';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../errors/app.exception.js';
import type { User, PublicUser } from './users.types.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private formatPublicUser(user: User): PublicUser {
    const { passwordHash: _passwordHash, ...publicUser } = user;

    const baseUrl = this.configService.get<string>('PUBLIC_URL');

    const avatarUrl = user.avatarFileName
      ? `${baseUrl}/files/avatars/${user.avatarFileName}`
      : `${baseUrl}/static/default-avatar.webp`;

    return { ...publicUser, avatarUrl } as PublicUser;
  }

  private throwIfUniqueViolation(error: unknown) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== 'P2002'
    )
      return;

    if (JSON.stringify(error.meta).includes('Users_phone_key'))
      throw new ConflictError(
        'User with such a phone already exists',
        null,
        'USER_PHONE_TAKEN',
      );
    throw new ConflictError(
      'User with such an email already exists',
      null,
      'USER_EMAIL_TAKEN',
    );
  }

  async create(
    data: CreateUserDto & { passwordHash?: string },
  ): Promise<PublicUser> {
    try {
      const user = await this.prisma.users.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role,
          passwordHash: data.passwordHash ?? '',
          avatarFileName: data.avatarFileName ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return this.formatPublicUser(user);
    } catch (error) {
      this.throwIfUniqueViolation(error);
      throw error;
    }
  }

  async findAll(
    page?: number,
    limit?: number,
    role?: 'agent' | 'moderator' | 'client',
  ) {
    const pageSizeDefault = Number(
      this.configService.get<number>('PAGE_SIZE_DEFAULT') ?? 20,
    );
    const pageSizeMax = Number(
      this.configService.get<number>('PAGE_SIZE_MAX') ?? 100,
    );

    const finalPage = !page || page < 1 ? 1 : page;
    let finalLimit = !limit || limit < 1 ? pageSizeDefault : limit;
    if (finalLimit > pageSizeMax) finalLimit = pageSizeMax;

    const whereCondition = role ? { role } : {};

    const [items, total] = await Promise.all([
      this.prisma.users.findMany({
        where: whereCondition,
        skip: (finalPage - 1) * finalLimit,
        take: finalLimit,
      }),
      this.prisma.users.count({ where: whereCondition }),
    ]);

    const totalPages = total > 0 ? Math.ceil(total / finalLimit) : 0;
    const publicItems = items.map((user) => this.formatPublicUser(user));

    return {
      items: publicItems,
      meta: { page: finalPage, limit: finalLimit, total, totalPages },
    };
  }

  async findOne(id: number): Promise<PublicUser> {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User not found');
    return this.formatPublicUser(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.users.findUnique({ where: { email } });
  }

  async count(): Promise<number> {
    return this.prisma.users.count();
  }

  async update(id: number, data: UpdateUserDto): Promise<PublicUser> {
    try {
      const updatedUser = await this.prisma.users.update({
        where: { id },
        data: { ...data, updatedAt: new Date() },
      });
      return this.formatPublicUser(updatedUser);
    } catch (error) {
      this.throwIfUniqueViolation(error);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundError('User not found');
      throw error;
    }
  }

  async updateAvatar(
    userId: number,
    file: Express.Multer.File,
  ): Promise<PublicUser> {
    if (!file) throw new ValidationError('File is required');
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');
    const oldFileName = user.avatarFileName;

    const updatedUser = await this.prisma.users.update({
      where: { id: userId },
      data: { avatarFileName: file.filename, updatedAt: new Date() },
    });

    if (oldFileName) {
      const oldFilePath = path.resolve(`./uploads/avatars/${oldFileName}`);
      if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
    }

    return this.formatPublicUser(updatedUser);
  }

  async removeAvatar(userId: number): Promise<PublicUser> {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');
    const oldFileName = user.avatarFileName;
    if (!oldFileName) return this.formatPublicUser(user);

    const updatedUser = await this.prisma.users.update({
      where: { id: userId },
      data: { avatarFileName: null, updatedAt: new Date() },
    });

    const filePath = path.resolve(`./uploads/avatars/${oldFileName}`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return this.formatPublicUser(updatedUser);
  }
}
