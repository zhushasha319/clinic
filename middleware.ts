//middleware.ts 负责"拦不拦"
//auth.config.ts 负责"怎么判断 + 怎么处理"

import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth;

// 配置 middleware 运行的路径

export const config = {
  matcher: ["/admin/:path*", "/user/:path*", "/appointments/:path*"],
};
