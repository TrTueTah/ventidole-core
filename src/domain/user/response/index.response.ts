import { GetUserResponse } from './get-user.response';
import { UpdateUserResponse } from './update-user.response';
import { UpdateFanResponse } from './update-fan.response';
import { UpdateIdolResponse } from './update-idol.response';

export const userResponses = [
  GetUserResponse,
  UpdateUserResponse,
  UpdateFanResponse,
  UpdateIdolResponse,
];

export * from './get-user.response';
export * from './update-user.response';
export * from './update-fan.response';
export * from './update-idol.response';
export * from './user.response';