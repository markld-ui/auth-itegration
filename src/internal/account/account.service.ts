import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { GetUsersByFiltersParam, GetUsersResponse, VerificationParams } from './account.types.js';

@Injectable()
export class InternalAccountService {
  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async verification(params: VerificationParams): Promise<boolean> {
    const baseUrl = this.config.get<string>('ACCOUNT_URL', 'http://localhost:9000/api/account');
    const url = `${baseUrl}/user/verification`;

    const response = await this.httpService.axiosRef.get<boolean>(url, { params });

    return response.data;
  }

  async getUsersByFilter(params: GetUsersByFiltersParam): Promise<GetUsersResponse> {
    const baseUrl = this.config.get<string>('ACCOUNT_URL', 'http://localhost:9000/api/account');
    const url = `${baseUrl}/user`;

    const response = await this.httpService.axiosRef.get<GetUsersResponse>(url, { params });

    return response.data;
  }
}
