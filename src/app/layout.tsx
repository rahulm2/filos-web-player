import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "600"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Cook Tomato Risotto with Clare",
  description:
    "A 50-minute guided cookalong. Tap to start, cook hands-free with Clare's voice guiding you through every step.",
  openGraph: {
    title: "Cook Tomato Risotto with Clare",
    description:
      "A 50-minute guided cookalong. Tap to start, cook hands-free.",
    images: [{ url: "/images/tomato-risotto.jpg", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jakarta.variable}`}>
      <body className="font-[family-name:var(--font-jakarta)] antialiased">
        {children}
      </body>
    </html>
  );
}
