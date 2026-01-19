// components/molecules/mobile-user-signinoravatar.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";

import { InteractiveSignInButton } from "./interactive-sign-in-button";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MobileUserMenuProps {
  onMobileActionComplete?: () => void;
  session: Session | null;
}

export default function MobileUserSignOrAvatar({
  onMobileActionComplete,
  session,
}: MobileUserMenuProps) {
  const [open, setOpen] = React.useState(false);

  if (!session?.user) {
    return <InteractiveSignInButton onNavigateStart={async () => {
      await onMobileActionComplete?.();
    }} />;
  }

  const { name, image, email, role } = session.user;
  const userName = name ?? "User";
  const userEmail = email ?? "";
  const userImage = image ?? "";
  const firstInitial = userName.charAt(0).toUpperCase();

  const isPatient = role === "PATIENT";
  const isAdmin = role === "ADMIN";

  async function handleSignOut() {
    try {
      setOpen(false);
      onMobileActionComplete?.();
      await signOut({ callbackUrl: "/" });
    } catch {
      // Optional: add toast/error UI here
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-muted"
          aria-label="Open user menu"
          onClick={() => setOpen(true)}
        >
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border bg-background text-sm font-semibold">
            {userImage ? (
              <Image
                src={userImage}
                alt={`${userName} avatar`}
                width={40}
                height={40}
                className="h-10 w-10 object-cover"
              />
            ) : (
              <span className="select-none">{firstInitial}</span>
            )}
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-medium leading-5">
              {userName}
            </div>
            {userEmail ? (
              <div className="truncate text-xs text-muted-foreground">
                {userEmail}
              </div>
            ) : null}
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="truncate">{userName}</DialogTitle>
          {userEmail ? (
            <DialogDescription className="truncate">
              {userEmail}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="space-y-2">
          {isPatient ? (
            <Button
              variant="ghost"
              className="w-full justify-start"
              asChild
              onClick={() => {
                setOpen(false);
                onMobileActionComplete?.();
              }}
            >
              <Link href="/user/profile">User Profile</Link>
            </Button>
          ) : null}

          {isAdmin ? (
            <Button
              variant="ghost"
              className="w-full justify-start"
              asChild
              onClick={() => {
                setOpen(false);
                onMobileActionComplete?.();
              }}
            >
              <Link href="/admin/dashboard">Admin Dashboard</Link>
            </Button>
          ) : null}

          <Button
            variant="ghost"
            className="w-full justify-start text-destructive"
            onClick={handleSignOut}
          >
            Sign out
          </Button>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
              onMobileActionComplete?.();
            }}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
