import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finanças da Casa",
  description: "Controle das despesas pessoais, da casa e da esposa",
};

// Os dados vêm do banco local e mudam com o dia ("hoje", contas vencidas):
// nada é pré-renderizado na compilação.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col md:flex-row text-texto-principal font-sans">
        <Sidebar />
        <main className="flex-1 min-w-0 px-4 pt-5 pb-28 md:px-8 md:py-7">{children}</main>
      </body>
    </html>
  );
}
