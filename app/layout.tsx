import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { dadosDoMenu } from "@/lib/menu";

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

/**
 * Aplica as preferências do menu (recolhido, tema) antes da primeira pintura,
 * para não piscar o menu aberto e depois fechar. Os valores ficam no
 * navegador (localStorage) e são só de aparência.
 */
const preferenciasDoMenu = `try{var d=document.documentElement,t=localStorage.getItem("menu-tema");d.dataset.menuTema=t==="azul"||t==="escuro"?t:"vidro";if(localStorage.getItem("menu-recolhido")==="1")d.dataset.menuRecolhido="1"}catch(e){}`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dados = await dadosDoMenu();
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`} data-menu-tema="vidro" suppressHydrationWarning>
      <body className="min-h-full flex flex-col md:flex-row text-texto-principal font-sans">
        <Script id="preferencias-menu" strategy="beforeInteractive">
          {preferenciasDoMenu}
        </Script>
        <Sidebar dados={dados} />
        <main className="flex-1 min-w-0 px-4 pt-5 pb-28 md:px-8 md:py-7">{children}</main>
      </body>
    </html>
  );
}
