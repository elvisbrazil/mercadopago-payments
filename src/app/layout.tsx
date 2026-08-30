import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mercado Pago Payments",
  description: "Pix and Checkout Pro with the Mercado Pago API",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
