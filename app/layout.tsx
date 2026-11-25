import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import NovoProvider from "./novo-provider";

export const metadata: Metadata = {
  title: "Peroba — Boletos",
  description: "Cadastro de boletos com lembrete por WhatsApp",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Peroba", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#071d63",
  width: "device-width",
  initialScale: 1,
};

// Fonte hospedada pelo próprio app (baixada no build), sem depender de CDN em produção.
const fonte = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--fonte", display: "swap" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={fonte.variable}>
      <body>
        <NovoProvider>{children}</NovoProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: "if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}",
          }}
        />
      </body>
    </html>
  );
}
