import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { InternalAccountModule } from '../internal/account/account.module.js';
import { RedisModule } from '../config/redis/redis.module.js';

@Module({
  imports: [
    ConfigModule.forRoot(),
    InternalAccountModule,
    RedisModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET ?? 'accessSecret',
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
