"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface SignOutButtonProps {
  className?: string;
  variant?: "default" | "secondary" | "ghost" | "outline" | "destructive";
  onSignedOut?: () => void;
}

export default function SignOutButton({
  className,
  variant = "ghost",
  onSignedOut,
}: SignOutButtonProps) {
  return (
    <Button
      variant={variant}
      className={className}
      onClick={async () => {
        onSignedOut?.();
        await signOut({ callbackUrl: "/" });
      }}
    >
      Sign out
    </Button>
  );
}
