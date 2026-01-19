// 用户已登录，显示头像和下拉菜单，如果未登录，显示登录按钮。

import Image from "next/image";
import Link from "next/link";

import { auth } from "@/auth";
import {InteractiveSignInButton} from "./interactive-sign-in-button";
import { signOutUser } from "@/lib/actions/user.actions";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default async function SigninOrAvatar() {
  const session = await auth();

  if (!session?.user) {
    return <InteractiveSignInButton />;
  }
  const userName = session.user.name ?? "User";
  const userEmail = session.user.email ?? "";
  const userImage = session.user.image ?? "";
  const role = session.user.role;
  const firstInitial = userName.charAt(0).toUpperCase();

  const isPatient = role === "PATIENT";
  const isAdmin = role === "ADMIN";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open user menu"
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border bg-background text-sm font-semibold text-foreground shadow-sm"
        >
          {userImage ? (
            <Image
              src={userImage}
              alt={`${userName} avatar`}
              width={40}
              height={40}
              className="h-10 w-10 object-cover"
              priority={false}
            />
          ) : (
            <span className="select-none">{firstInitial}</span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="space-y-0.5">
          <div className="text-sm font-medium leading-none">{userName}</div>
          {userEmail ? (
            <div className="text-xs font-normal text-muted-foreground">
              {userEmail}
            </div>
          ) : null}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {isPatient ? (
          <DropdownMenuItem asChild>
            <Link href="/user/profile">User Profile</Link>
          </DropdownMenuItem>
        ) : null}

        {isAdmin ? (
          <DropdownMenuItem asChild>
            <Link href="/admin/dashboard">Admin Dashboard</Link>
          </DropdownMenuItem>
        ) : null}

        {(isPatient || isAdmin) ? <DropdownMenuSeparator /> : null}

        <div className="px-2 py-1.5">
          <form
            action={async () => {
              "use server";
              await signOutUser();
            }}
          >
            <Button variant="ghost" className="w-full justify-start" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
