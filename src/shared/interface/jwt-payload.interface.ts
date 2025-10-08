import { TokenIssuer } from "@shared/enum/token.enum";
import { Role } from "src/generated/prisma/enums";

export interface IJwtPayload {
  sub: string;
  role: Role;
  iat: number;
  exp: number;
  iss: TokenIssuer;
}

export interface IJwtDecoded {
  header: { alg: string; typ?: string };
  payload: IJwtPayload;
  signature?: string;
}
