import type { Role } from "@/lib/generated/prisma";
import type { DefaultSession, User as DefaultUser } from "next-auth";

declare module "next-auth" {
  /**
   * Extends the built-in session.user object to include `id` and `role`.
   */
  export interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"]; // 保留默认字段
  }
  export interface User extends DefaultUser {
    role: Role;
  }
}

