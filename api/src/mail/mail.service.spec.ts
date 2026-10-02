import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import type { Transporter } from 'nodemailer';
import { jest, describe, it, expect } from '@jest/globals';
import { MailService } from './mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PdfService } from '../pdf/pdf.service.js';

const LEGACY_BEFORE = '2026-10-02T00:00:00Z';

async function createService(
  config: Record<string, string>,
  counts = { users: 0, viewings: 0 },
) {
  const prisma = {
    users: {
      count: jest
        .fn<(args: unknown) => Promise<number>>()
        .mockResolvedValue(counts.users),
    },
    viewings: {
      count: jest
        .fn<(args: unknown) => Promise<number>>()
        .mockResolvedValue(counts.viewings),
    },
  };
  const module = await Test.createTestingModule({
    providers: [
      MailService,
      // Any value other than real/stream gives the mocked transporter.
      {
        provide: ConfigService,
        useValue: {
          get: (key: string) => ({ MAIL_TRANSPORT: 'mock', ...config })[key],
        },
      },
      { provide: PrismaService, useValue: prisma },
      { provide: PdfService, useValue: {} },
      { provide: PinoLogger, useValue: { info: jest.fn() } },
    ],
  }).compile();

  return { service: module.get(MailService), prisma };
}

describe('MailService recipients from imported data', () => {
  it('sends to everyone when MAIL_LEGACY_BEFORE is not set', async () => {
    const { service, prisma } = await createService(
      {},
      { users: 1, viewings: 0 },
    );

    await expect(service.isLegacyRecipient('agent@mail.ru')).resolves.toBe(
      false,
    );
    expect(prisma.users.count).not.toHaveBeenCalled();
  });

  it('holds an address of a user created before the cutoff', async () => {
    const { service, prisma } = await createService(
      { MAIL_LEGACY_BEFORE: LEGACY_BEFORE },
      { users: 1, viewings: 0 },
    );

    await expect(service.isLegacyRecipient('Agent@Mail.ru')).resolves.toBe(
      true,
    );
    expect(prisma.users.count).toHaveBeenCalledWith({
      where: {
        email: { equals: 'agent@mail.ru', mode: 'insensitive' },
        createdAt: { lt: new Date(LEGACY_BEFORE) },
      },
    });
  });

  it('holds a client address from a viewing created before the cutoff', async () => {
    const { service } = await createService(
      { MAIL_LEGACY_BEFORE: LEGACY_BEFORE },
      { users: 0, viewings: 1 },
    );

    await expect(service.isLegacyRecipient('client@example.com')).resolves.toBe(
      true,
    );
  });

  it('sends to an address that appeared after the cutoff', async () => {
    const { service } = await createService({
      MAIL_LEGACY_BEFORE: LEGACY_BEFORE,
    });

    await expect(service.isLegacyRecipient('new-user@mail.ru')).resolves.toBe(
      false,
    );
  });

  it('sends to an allowed address without asking the database', async () => {
    const { service, prisma } = await createService(
      {
        MAIL_LEGACY_BEFORE: LEGACY_BEFORE,
        MAIL_ALLOWED_RECIPIENTS: 'a@x.ru, Owner@Mail.ru',
      },
      { users: 1, viewings: 0 },
    );

    await expect(service.isLegacyRecipient('owner@mail.ru')).resolves.toBe(
      false,
    );
    expect(prisma.users.count).not.toHaveBeenCalled();
  });

  it('holds everything when the cutoff date cannot be parsed', async () => {
    const { service } = await createService({
      MAIL_LEGACY_BEFORE: 'not a date',
    });

    await expect(service.isLegacyRecipient('new-user@mail.ru')).resolves.toBe(
      true,
    );
  });

  it('writes mail to a legacy address to the log instead of the transport', async () => {
    const { service } = await createService(
      { MAIL_LEGACY_BEFORE: LEGACY_BEFORE },
      { users: 1, viewings: 0 },
    );
    const transporter = (service as unknown as { transporter: Transporter })
      .transporter;
    const send = jest.spyOn(transporter, 'sendMail');

    const info = (await service.sendMailSafely({
      to: 'agent@mail.ru',
      subject: 'Тест',
    })) as {
      message?: Buffer;
    };

    expect(send).not.toHaveBeenCalled();
    expect(info.message?.toString()).toContain('agent@mail.ru');
  });

  it('sends mail to a new address through the transport', async () => {
    const { service } = await createService({
      MAIL_LEGACY_BEFORE: LEGACY_BEFORE,
    });
    const transporter = (service as unknown as { transporter: Transporter })
      .transporter;
    const send = jest.spyOn(transporter, 'sendMail');

    await service.sendMailSafely({ to: 'new-user@mail.ru', subject: 'Тест' });

    expect(send.mock.calls[0]?.[0]).toMatchObject({ to: 'new-user@mail.ru' });
  });
});
