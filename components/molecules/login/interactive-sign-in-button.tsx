"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InteractiveSignInButtonProps {
  className?: string;
  text?: string;
  onNavigateStart?: () => void | Promise<void>;
}

export function InteractiveSignInButton({
  className,
  text = "Sign in",
  onNavigateStart,
}: InteractiveSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    setIsLoading(true);
    if (onNavigateStart) {
      await onNavigateStart();
    }
    // Simulate a small delay or just wait for navigation
    router.push("/sign-in");
  };

  return (
    <Button
      variant="secondary"
      onClick={handleSignIn}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : text}
    </Button>
  );
}
