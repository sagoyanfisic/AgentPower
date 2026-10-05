import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentPower · GDG Open Certification Lab",
  description: "Simulacros de examen para certificaciones de Google Cloud.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
