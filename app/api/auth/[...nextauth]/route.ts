import { handlers } from "@/auth"; // Referring to the auth.ts we just created
export const { GET, POST } = handlers;
//我这个 API 路由 GET/POST 的处理逻辑，都交给 auth.ts 里 NextAuth 来做。