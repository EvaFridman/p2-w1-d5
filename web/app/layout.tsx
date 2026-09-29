import { ReactNode, Suspense } from "react";
import type { Metadata } from "next";

import "./globals.scss";

import { QueryProvider } from "@/_app/providers/query-provider"; 
import { AppStoreProvider } from "@/shared/providers/app-store-provider";
import { Header, Footer } from "@/widgets";
import { ThemeInit } from "@/features/theme/ThemeInit";
import { Loader } from "@/shared/ui";
import { inter } from "./fonts";

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001"),
    title: {
        template: "%s — Витрина недвижимости",
        default: "Витрина недвижимости",
    },
    description: "Витрина объявлений об аренде и продаже недвижимости",
    openGraph: {
        type: "website",
        locale: "ru_RU",
        siteName: "Витрина недвижимости",
    },
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="ru" suppressHydrationWarning>
            <head>
                <ThemeInit />
            </head>
            <body className={inter.variable}>
                <QueryProvider>
                    <AppStoreProvider>
                        <Suspense fallback={<Loader />}>
                            <Header />
                        </Suspense>
                        <main>{children}</main>
                        <Footer />
                    </AppStoreProvider>
                </QueryProvider>
            </body>
        </html>
    );
}