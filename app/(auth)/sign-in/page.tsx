// app/(auth)/sign-in/page.tsx
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { signInWithCredentialsFormAction } from "@/lib/actions/auth/sign-in-form.action";
import { signInDefaultValues } from "@/lib/constants";
import { App_NAME } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const t = await getTranslations();
  const resolvedSearchParams = await searchParams;
  const callbackUrlRaw = resolvedSearchParams?.callbackUrl;
  const callbackUrlCandidate =
    typeof callbackUrlRaw === "string" && callbackUrlRaw.length > 0
      ? callbackUrlRaw
      : "/";
  // Only allow in-app relative redirects
  const callbackUrl = callbackUrlCandidate.startsWith("/")
    ? callbackUrlCandidate
    : "/";
  //告诉系统：登录成功以后，回到哪里去。
  return (
    <div className="min-h-[calc(100vh-0px)] w-full bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">
        <Card className="w-full max-w-md rounded-2xl shadow-sm">
          <CardHeader className="items-center text-center">
            <div>
              <Image
                priority={true}
                src="/images/Logo.svg"
                width={32}
                height={32}
                alt={`${App_NAME}logo`}
              />
            </div>
            <CardTitle className="text-2xl">{t("Sign In")}</CardTitle>
            <CardDescription>{t("sign in to your account")}</CardDescription>
          </CardHeader>

          <CardContent>
            <form
              action={signInWithCredentialsFormAction}
              className="space-y-4"
            >
              {/* Keep callbackUrl so the server action can redirect correctly */}
              <input type="hidden" name="callbackUrl" value={callbackUrl} />

              <div className="space-y-2">
                <Label htmlFor="email">{t("Email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("Enter your email")}
                  defaultValue={signInDefaultValues.email}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("Password")}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t("Enter your password")}
                  defaultValue={signInDefaultValues.password}
                  autoComplete="current-password"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {t("Sign In with credentials")}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center text-sm text-muted-foreground">
            <span className="mr-2">{t("Don't have an account?")}</span>
            <Link
              href={
                callbackUrl
                  ? `/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`
                  : "/sign-up"
              }
              className="font-medium text-blue-600 hover:underline"
            >
              {t("Sign Up")}
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
