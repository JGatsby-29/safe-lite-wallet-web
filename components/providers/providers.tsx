'use client';

import * as React from 'react';
import {
  RainbowKitProvider,
  getDefaultWallets,
  getDefaultConfig,
  darkTheme
} from '@rainbow-me/rainbowkit';
import {
  trustWallet,
  ledgerWallet,
} from '@rainbow-me/rainbowkit/wallets';
import {
  klaytn, // import klaytn mainnet
  klaytnBaobab, // import klaytn testnet
} from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, http } from 'wagmi';
// import according to docs
import { NextUIProvider } from '@nextui-org/react'
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { WalletProvider } from '@/app/walletContext';
import { Wallet } from 'ethers';

const { wallets } = getDefaultWallets();
// initialize and destructure wallets object

const config = getDefaultConfig({
  appName: 'SafeLite', // Name your app
  projectId: "f09a4288c4d06944b3c00f94a9bfe190", // Enter your WalletConnect Project ID here
  wallets: [
    ...wallets,
    {
      groupName: 'Other',
      wallets: [trustWallet, ledgerWallet],
    },
  ],
  chains: [
    klaytn,
    klaytnBaobab
  ],
  transports: {
    [klaytn.id]: http('https://rpc.ankr.com/klaytn'), // Select RPC provider Ankr instead of the default
    [klaytnBaobab.id]: http('https://rpc.ankr.com/klaytn_testnet'), // Select RPC provider Ankr instead of the default
  },
  ssr: true, // Because it is Nextjs's App router, you need to declare ssr as true
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="dark">
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider theme={ darkTheme({ accentColor: '#CCEE50', accentColorForeground: 'black'})}>
              <WalletProvider>
                {children}
              </WalletProvider>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </NextThemesProvider>
    </NextUIProvider>
  );
}