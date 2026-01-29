import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "@/components/providers/session-provider";
import { IntlProvider } from "@/components/providers/intl-provider";
import { auth } from "@/auth";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "莎莎医院",
  description: "现代医院管理系统",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "zh";
  const messages = (await import(`../messages/${locale}.json`)).default;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <SessionProvider session={session}>
          <IntlProvider messages={messages} locale={locale}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Toaster position="top-right" reverseOrder={false} />
              {children}
            </ThemeProvider>
          </IntlProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
