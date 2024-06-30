import { createContext, useContext, useState, ReactNode } from 'react';

interface WalletContextProps {
  selectedWallet: string;
  setSelectedWallet: (wallet: string) => void;
}

const WalletContext = createContext<WalletContextProps | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [selectedWallet, setSelectedWallet] = useState<string>('');

  return (
    <WalletContext.Provider value={{ selectedWallet, setSelectedWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
