import { Request } from "express";
import { Role } from "src/db/prisma/enums";

interface UserModel {
  id: string;
  role: Role;
}

export interface IRequest extends Request {
  user: UserModel;
}
