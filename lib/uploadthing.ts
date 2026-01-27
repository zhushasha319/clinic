import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from '../app/api/uploadthing/core'

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();

// UTApi：服务端文件操作
import { UTApi } from "uploadthing/server";
export const utapi = new UTApi();

