import { redirect } from "next/navigation";
import { signOut } from "@/auth";

export default async function SignOutPage() {
  await signOut({ redirect: false });
  redirect("/sign-in");
}
