import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/db/prisma/enums';
import { DecoratorKey } from '../types/decorator-key.enum';
export const Roles = (...roles: Role[]) =>
  SetMetadata(DecoratorKey.Roles, roles);
