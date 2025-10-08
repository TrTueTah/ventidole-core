import { SetMetadata } from "@nestjs/common";
import { DecoratorKey } from "@shared/enum/decorator.enum";
import { Role } from "src/generated/prisma/enums";
export const Roles = (...roles: Role[]) => SetMetadata(DecoratorKey.Roles, roles);
