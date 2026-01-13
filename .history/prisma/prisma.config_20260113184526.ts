import { defineConfig } from "@prisma/config";
import dotenv from "dotenv";
import path from "path";

// ✅ 强制从项目根目录加载 .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
