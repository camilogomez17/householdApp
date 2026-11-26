import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Household · The shared board",
  description: "A private space for household groceries, chores and schedules.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
