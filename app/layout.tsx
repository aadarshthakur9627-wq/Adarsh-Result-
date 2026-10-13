import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./subpage.css";
import "./admin.css";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://adarshresult.com";
export const metadata: Metadata = {
 metadataBase: new URL(siteUrl),
 title: { default: "Adarsh Result – Government Jobs, Results & Exam Updates", template: "%s | Adarsh Result" },
 description: "Explore government job notifications, exam results, admit cards, answer keys and syllabus updates with official source links on Adarsh Result.",
 applicationName: "Adarsh Result",
 alternates: { canonical: "/" },
 openGraph: { type: "website", siteName: "Adarsh Result", title: "Adarsh Result – Jobs, Results & Exam Updates", description: "Government job, result, admit card and answer key updates with official links.", url: siteUrl },
 robots: { index: true, follow: true }
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#a51d3d" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="en"><body>{children}</body></html>;
}
