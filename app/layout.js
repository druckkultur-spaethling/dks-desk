import "./globals.css";

export const metadata = {
  title: "druckkultur desk – Ihre externe Druckabteilung",
  description: "Persönlicher Projektraum für Printprojekte, Freigaben, Dokumente und direkte Kommunikation.",
  manifest: "./manifest.webmanifest"
};

export const viewport = {
  themeColor: "#071311",
  colorScheme: "dark"
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
