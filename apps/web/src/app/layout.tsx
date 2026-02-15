import type { Metadata } from "next";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

import "../index.css";
import { spaceMono, newsreader, dmSans } from "@/lib/fonts";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: "DUST — Digital Archaeologist",
  description:
    "The internet is dying. You're the last archivist. Save what matters before it decays forever.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${spaceMono.variable} ${newsreader.variable} ${dmSans.variable} antialiased`}
      >
        <ClerkProvider appearance={{ baseTheme: dark }}>
          <Providers>
            {children}
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
