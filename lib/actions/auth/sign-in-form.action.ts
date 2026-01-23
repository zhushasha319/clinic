"use server";

import { signInWithCredentials } from "../user.actions";

/** 表单 Action：调用凭证登录后交由上层处理重定向。 */
export async function signInWithCredentialsFormAction(formData: FormData) {
  await signInWithCredentials(formData);
  // 不 return 任何东西，让返回类型是 Promise<void>
}
