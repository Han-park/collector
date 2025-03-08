import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import AuthNav from "@/components/auth/AuthNav";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Collector",
  description: "Collect and organize your bookmarks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-900 text-white min-h-screen flex flex-col`}>
        <AuthProvider>
          <header className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
              <AuthNav />
            </div>
          </header>
          <main className="container max-w-4xl mx-auto px-4 py-6 flex-grow">{children}</main>
          <footer className="mt-auto py-8 border-t border-gray-800">
            <div className="container max-w-4xl mx-auto px-4 flex justify-center">
              <Image 
                src="/img/cfp-logo-grayscale.png" 
                alt="CFP Logo" 
                width={120} 
                height={40} 
                className="opacity-50 hover:opacity-80 transition-opacity"
              />
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
