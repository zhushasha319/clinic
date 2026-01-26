//auth.ts是总逻辑：规定“怎么登录”、登录后“我是谁”、权限字段怎么保存。
import NextAuth, { NextAuthConfig } from "next-auth";
import prisma from "@/db/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter"; //让 NextAuth 能把用户/账号/session 等信息跟 Prisma 数据库对接（即使你用 jwt，也常见会配 adapter）
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials"; //用户名密码登录
import { compareSync } from "bcryptjs";
import { Role } from "@/lib/generated/prisma";

export const config: NextAuthConfig = {
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  }, //登录/错误页去哪
  session: {
    strategy: "jwt", // Use JSON Web Tokens for session management
    maxAge: 30 * 24 * 60 * 60, // token 30 天过期
  },
  adapter: PrismaAdapter(prisma) as NextAuthConfig["adapter"],
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null; // Invalid credentials format
        }

        // Find the user in the database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        // 直接禁止 DOCTOR 登录
        if (!user || user.role === Role.DOCTOR) {
          return null;
        }

        if (user && user.password) {
          // Verify the password
          const passwordsMatch = compareSync(
            credentials.password as string,
            user.password,
          );

          if (passwordsMatch) {
            // On successful authentication, return user details
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              image: user.image,
            };
          }
        }

        // If password does not match, return null
        return null;
      }, //正式登录
    }),
  ], //登录方式
  callbacks: {
    ...authConfig.callbacks, //把 auth.config.ts 里的 callbacks 合进来

    async redirect({ url, baseUrl }) {
      // Parse the url to check for callbackUrl in query params
      try {
        const urlObj = new URL(url, baseUrl);
        const callbackUrl = urlObj.searchParams.get("callbackUrl");

        if (callbackUrl && callbackUrl.startsWith("/")) {
          return `${baseUrl}${callbackUrl}`;
        }
      } catch (e) {
        // Ignore parse errors
      }

      // If url is a relative path, make it absolute
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      // If url is already absolute and same-origin, use it
      if (url.startsWith(baseUrl)) {
        return url;
      }

      // Otherwise fall back to home page
      return baseUrl;
    },
    async jwt({ token, user, trigger, session }) {
      //  把 user 信息写进 token
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        return token;
      }

      // On subsequent requests, refresh token data if needed
      if (trigger === "update" && session?.user) {
        if (session.user.image) {
          token.picture = session.user.image;
        }
        if (session.user.name) {
          token.name = session.user.name;
        }
      }

      return token;
    },

    async session({ session, token }) {
      //把 token 映射到 session（给前端用）
      if (token.sub) {
        session.user.id = token.sub;

        // 每次都从数据库获取最新的用户信息
        try {
          const user = await prisma.user.findUnique({
            where: { id: token.sub },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          });

          if (user) {
            session.user.name = user.name;
            session.user.email = user.email;
            session.user.image = user.image;
            session.user.role = user.role as Role;
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          // 如果数据库查询失败，使用 token 中的数据作为备用
          if (token.role) {
            session.user.role = token.role as Role;
          }
          session.user.name = token.name;
          session.user.email = token.email as string;
          session.user.image = token.picture;
        }
      }

      return session;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(config);
//handlers 给 route.ts 用（API 入口）

//auth 给 middleware.ts 用（保护路由时读取登录状态）
