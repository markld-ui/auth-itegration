import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { InternalAccountService } from '../internal/account/account.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let accountService: { verification: ReturnType<typeof vi.fn>; getUsersByFilter: ReturnType<typeof vi.fn> };
  let jwtService: { sign: ReturnType<typeof vi.fn>; verify: ReturnType<typeof vi.fn> };
  let redis: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    accountService = {
      verification: vi.fn(),
      getUsersByFilter: vi.fn(),
    };

    jwtService = {
      sign: vi.fn((payload: Record<string, string>) => `token:${payload.userId}`),
      verify: vi.fn(() => ({ userId: 'user-1', login: 'ivan' })),
    };
    redis = {
      get: vi.fn(),
      set: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: InternalAccountService, useValue: accountService },
        { provide: 'REDIS_TOKEN', useValue: redis },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, defaultValue?: string) => ({
              JWT_ACCESS_SECRET: 'access-secret',
              JWT_ALG: 'HS256',
              JWT_ACCESS_EXP: '1h',
              JWT_REFRESH_SECRET: 'refresh-secret',
              JWT_REFRESH_EXP: '24h',
              ACCOUNT_URL: 'http://localhost:9000/api/account',
            }[key] ?? defaultValue ?? key),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should issue access and refresh tokens after successful login', async () => {
    accountService.verification.mockResolvedValue(true);
    accountService.getUsersByFilter.mockResolvedValue({ items: [{ userId: 'user-1', login: 'ivan' }] });

    const result = await service.login({ login: 'ivan', password: 'secret' });

    expect(accountService.verification).toHaveBeenCalledWith({ login: 'ivan', password: 'secret' });
    expect(accountService.getUsersByFilter).toHaveBeenCalledWith({ login: 'ivan' });
    expect(redis.get).toHaveBeenCalledWith('ivan');
    expect(redis.set).toHaveBeenCalledWith('ivan', 'user-1');
    expect(jwtService.sign).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      access: 'token:user-1',
      refresh: 'token:user-1',
    });
  });

  it('should use the cached user id without looking it up in Account', async () => {
    accountService.verification.mockResolvedValue(true);
    redis.get.mockResolvedValue('cached-user-id');

    const result = await service.login({ login: 'ivan', password: 'secret' });

    expect(accountService.getUsersByFilter).not.toHaveBeenCalled();
    expect(redis.set).not.toHaveBeenCalled();
    expect(result).toEqual({
      access: 'token:cached-user-id',
      refresh: 'token:cached-user-id',
    });
  });

  it('should not cache a user when Account cannot find them', async () => {
    accountService.verification.mockResolvedValue(true);
    accountService.getUsersByFilter.mockResolvedValue({ items: [] });

    await expect(service.login({ login: 'ivan', password: 'secret' })).rejects.toThrow(
      'User not found',
    );

    expect(redis.set).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when password is invalid', async () => {
    accountService.verification.mockResolvedValue(false);

    await expect(service.login({ login: 'ivan', password: 'wrong' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('should refresh tokens for a valid refresh token', async () => {
    accountService.getUsersByFilter.mockResolvedValue({ items: [{ userId: 'user-1', login: 'ivan' }] });

    const result = await service.refreshToken({ refresh: 'valid-refresh-token' });

    expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token', expect.objectContaining({
      secret: 'refresh-secret',
      algorithms: ['HS256'],
    }));
    expect(result).toEqual({
      access: 'token:user-1',
      refresh: 'token:user-1',
    });
  });
});
