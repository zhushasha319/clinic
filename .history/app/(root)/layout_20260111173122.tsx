
import "./globals.css";
import { Header } from "@/components/organisms/header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
        <main></main>
    </div>
   <Header></Header>
  );
}
