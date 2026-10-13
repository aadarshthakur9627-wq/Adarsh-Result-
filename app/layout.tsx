import type { Metadata, Viewport } from "next";
import "./globals.css";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://adarshresult.com";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Adarsh Result – Latest Jobs, Results, Admit Cards & Answer Keys", template: "%s | Adarsh Result" },
  description: "Latest government job notifications, exam results, admit cards, answer keys and syllabus updates. Check official links and important dates.",
  applicationName: "Adarsh Result",
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "Adarsh Result", title: "Adarsh Result – Jobs, Results & Exam Updates", description: "Government job, result, admit card and answer key updates with official links.", url: siteUrl },
  robots: { index: true, follow: true }
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#a51d3d" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}