import { SetMetadata } from "@nestjs/common";
import { DecoratorKey } from "@shared/enum/decorator.enum";
import { Role } from "src/db/prisma/enums";
export const Roles = (...roles: Role[]) => SetMetadata(DecoratorKey.Roles, roles);
