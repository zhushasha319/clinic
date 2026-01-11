import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/organisms/header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <ThemeProvider
        attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          > <Header></Header>
        <main>{children}</main></ThemeProvider>
        
    </div>
  
  );
}
