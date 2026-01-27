import { redirect } from "next/navigation";
import { auth } from "@/auth";

function redirectToErrorPage(errorType?: string, errorMessage?: string) {
  const params = new URLSearchParams();

  if (errorType) params.set("errorType", errorType);
  if (errorMessage) params.set("errorMessage", errorMessage);

  const query = params.toString();
  redirect(query ? `/?${query}` : "/");
}

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  if (session.user.role !== "ADMIN") {
    redirectToErrorPage("unauthorized", "你没有权限访问该页面。");
  }

  return session;
}
