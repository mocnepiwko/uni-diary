import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider"; 
import { Toaster } from "react-hot-toast"; 
import { LanguageProvider } from '@/lib/i18n'; // Импорт у тебя уже был

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Uni Diary",
  description: "University Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <LanguageProvider>
            <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}