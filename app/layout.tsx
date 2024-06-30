import { Providers } from "../components/providers/providers"
import { Outfit } from "next/font/google";
import '@rainbow-me/rainbowkit/styles.css';
import "./global.css";
import Navigation from "../components/header/navigation";

const outfit = Outfit({
  weight: 'variable',
  subsets: ["latin"]
});

export const metadata = {
  title: 'Kaia SafeLite',
  description: 'Kaia Multisig wallet dapp',
  icons: {
		icon: "/favicon.png",
	},
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={outfit.className} style={{ color: 'white', backgroundColor: '#121312' }}>
        <Providers>
          <Navigation />
            {children}
        </Providers>
      </body>
    </html>
  )
}
