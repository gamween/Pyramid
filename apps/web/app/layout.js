import { Cormorant_Garamond, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google"

import "./globals.css"

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant-garamond",
})

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
  weight: ["400", "500", "600", "700"],
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600", "700"],
})

export const metadata = {
  title: "Pyramid",
  description: "XRPL-native lending, trading, and private execution.",
  icons: {
    icon: "/samothrace-mark.svg",
    shortcut: "/samothrace-mark.svg",
    apple: "/samothrace-mark.svg",
  },
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${cormorantGaramond.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
