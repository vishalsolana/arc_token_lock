import type { Metadata } from "next";
import { Providers } from "./providers";
import { Header } from "./components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arc Token Lock",
  description: "Lock any ERC-20 supply on Arc chain and share a public, on-chain proof.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
