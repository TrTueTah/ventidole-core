import { Request } from 'express';

interface UserModel {
  id: string;
  role: Role;
}

export interface IRequest extends Request {
  user: UserModel;
}
