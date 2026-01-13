import { defineConfig } from "@prisma/config";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
console.log("DATABASE_URL =", process.env.DATABASE_URL);

export default defineConfig({
  datasource: {
    
    url: process.env.DATABASE_URL!,
  },
});
