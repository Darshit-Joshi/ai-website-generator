import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import Provider from "./provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Website Generator Workspace",
  description:
    "Compile single-file production HTML/Tailwind templates with AI streaming engines.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased min-h-screen bg-background text-foreground selection:bg-primary/10">
          <Provider>{children}</Provider>
          <Toaster position="top-right" closeButton richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
