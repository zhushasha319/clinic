import them
import { Header } from "@/components/organisms/header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
         <Header></Header>
        <main>{children}</main>
    </div>
  
  );
}
