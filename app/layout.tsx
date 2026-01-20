import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "@/components/providers/session-provider";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Clinic App",
  description: "A modern clinic management application",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SessionProvider session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster position="top-right" reverseOrder={false} />
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
