import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClerkClientProvider from "@/components/providers/ClerkClientProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MikMok – Short Videos. Big Impact.",
  description:
    "MikMok is a next-generation short-video social platform. Create, share, and discover vertical video content with a fast, personalized experience.",
  keywords: ["short videos", "social media", "video sharing", "creators", "MikMok"],
  openGraph: {
    title: "MikMok – Short Videos. Big Impact.",
    description: "Create, share, and discover short-form video content.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkClientProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_missing_key_please_add_to_vercel"}
      appearance={{
        variables: {
          colorPrimary: "#06b6d4",
          colorBackground: "#f8fafc",
          colorText: "#0f172a",
          colorInputBackground: "#f1f5f9",
          colorInputText: "#0f172a",
          borderRadius: "1rem",
        },
      }}
    >
      <html
        lang="en"
        className={`${inter.variable} font-sans h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <QueryProvider>{children}</QueryProvider>
        </body>
      </html>
    </ClerkClientProvider>
  );
}
