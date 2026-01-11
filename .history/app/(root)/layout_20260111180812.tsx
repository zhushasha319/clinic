import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/organisms/header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <ThemeProvider></ThemeProvider>
         <Header></Header>
        <main>{children}</main>
    </div>
  
  );
}
