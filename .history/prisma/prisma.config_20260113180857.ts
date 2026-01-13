import { defineConfig } from "@prisma/config";

export default defineConfig({
  datasource: {
    // url: process.env.DATABASE_URL,
    // Using explicit env loading if process.env is empty might be needed, 
    // but typically Prisma CLI loads .env before reading this file.
    // However, let's try to verify if we need to manually use dotnev or similar if we were debugging.
    // Actually, simply ensuring we don't return undefined is key.
    url: process.env.DATABASE_URL ?? "",
  },
});
