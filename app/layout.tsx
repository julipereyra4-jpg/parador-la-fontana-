import './globals.css';
import React from 'react';

export const metadata = {
  metadataBase: new URL("https://parador-la-fontana.vercel.app"),
  title: "Parador La Fontana – Reservá tu asador en Los Reartes",
  description:
    "Río limpio, sombra abundante y asadores listos. Reservá tu asador en Parador La Fontana: $12.000 por vehículo (1–5 personas).",
  openGraph: {
    title: "Parador La Fontana – Reserva online",
    description:
      "Elegí fecha, sector (El río / La sombra) y pagá en efectivo/transferencia al ingresar o por Mercado Pago.",
    url: "https://parador-la-fontana.vercel.app",
    siteName: "Parador La Fontana",
    images: [
      {
        url: "/la-fontana/entrada-portal.jpg",
        width: 1200,
        height: 630,
        alt: "Entrada Parador La Fontana"
      }
    ],
    locale: "es_AR",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Parador La Fontana – Reserva online",
    description:
      "Reservá tu asador en Los Reartes. Precio por vehículo, sectores El río y La sombra.",
    images: ["/la-fontana/entrada-portal.jpg"]
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://parador-la-fontana.vercel.app" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gradient-to-b from-sky-50 to-white text-slate-800">
        {children}
      </body>
    </html>
  );
}
