export type VerificationParams = {
  login: string;
  password: string;
};

export type GetUsersByFiltersParam = {
  userIds?: string[];
  phones?: string[];
  login?: string;
};

export type GetUsersResponse = {
  items: Account[];
  total: number;
};

export interface Account {
  userId: string;
  phone: string;
  login: string;
  firstName: string;
  lastName: string;
  middleName: string;
  password: string;
}
