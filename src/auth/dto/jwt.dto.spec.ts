import { ValidationPipe } from '@nestjs/common';
import { RefreshJwtDto } from './jwt.dto.js';

describe('RefreshJwtDto HTTP validation', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });
  const metadata = { type: 'body' as const, metatype: RefreshJwtDto };

  it('accepts a refresh token with the application whitelist enabled', async () => {
    await expect(
      pipe.transform({ refresh: 'signed-refresh-token' }, metadata),
    ).resolves.toMatchObject({ refresh: 'signed-refresh-token' });
  });

  it.each([{}, { refresh: '' }, { refresh: 42 }])(
    'rejects an invalid body: %j',
    async (body) => {
      await expect(pipe.transform(body, metadata)).rejects.toThrow();
    },
  );

  it('rejects unexpected fields', async () => {
    await expect(
      pipe.transform({ refresh: 'token', extra: true }, metadata),
    ).rejects.toThrow();
  });
});
