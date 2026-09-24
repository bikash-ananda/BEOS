import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BEOS — Bikash Engineering Operating System",
  description:
    "Digital operating system for Bikash Engineering Pvt. Ltd., Pokhara, Nepal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <template
          aria-hidden="true"
          dangerouslySetInnerHTML={{
            __html:
              "<!-- THESIS: Files are a focused operational ledger; notifications stay global context instead of consuming permanent workspace width. OWN-WORLD: Engineering Paper, Operations Navy, Signal Orange, square document-grade controls, mono coordinates, one-pixel rules, and flat depth. STORY: Employees find scoped files, upload within their assignment, download authorized records, and review persistent updates without leaving their task. FIRST VIEWPORT: Fixed rail and coordinate header frame a full-width searchable file register; Upload File leads the actions, and the header bell opens a right-edge notification drawer. FORM: Focused Register with Notification Drawer, approved option 2, seed iteration-4-option-2. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance -->",
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
