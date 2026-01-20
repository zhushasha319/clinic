import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from '../app/api/uploadthing/core'

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();

// UTApi for server-side file operations
import { UTApi } from "uploadthing/server";
export const utapi = new UTApi();
