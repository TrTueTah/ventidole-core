import { Request } from "express";
import { Role } from "src/generated/prisma/enums";

interface UserModel {
  id: string;
  role: Role;
}

export interface IRequest extends Request {
  user: UserModel;
}
