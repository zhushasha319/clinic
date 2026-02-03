import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { getAppTimeZone } from "@/lib/config";

export default getRequestConfig(async () => {
  // 从 cookie 中获取语言设置,默认为中文
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "zh";
  const timeZone = getAppTimeZone();

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone,
  };
});
