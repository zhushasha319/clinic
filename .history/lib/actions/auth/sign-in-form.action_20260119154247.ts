"use server";

import { signInWithCredentials } from "./user.actions"; 

export async function signInWithCredentialsFormAction(formData: FormData) {
  await signInWithCredentials(formData);
  // 不 return 任何东西，让返回类型是 Promise<void>
}
