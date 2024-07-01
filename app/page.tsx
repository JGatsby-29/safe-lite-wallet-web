'use client';

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWalletClient, useWaitForTransactionReceipt } from "wagmi";
import { readContract } from "@wagmi/core"
import { config } from "@/app/config/config"
import * as safeLiteAbi from '@/abi/safeLite.json';
import * as safeLiteAddressBookAbi from '@/abi/SafeLiteAddressBook.json';
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { ethers } from "ethers";
import { isAddress } from "web3-validator";
import { useSafeLite } from "@/hooks/useSafeLite";
import { Input, Button } from "@nextui-org/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/react";
import Image from "next/image";
import Logo from "@/public/kaia_safe_lite_main3.png";
import { useWallet } from "@/app/walletContext";

export default function Home() {
  const { address } = useAccount();
  const [multiSigInput, setMultiSigInput] = useState('');
  const [multiSigInputs, setMultiSigInputs] = useState<`0x${string}`[]>([]);
  const router = useRouter();
  const { setSelectedWallet } = useWallet();

  const addressBook = '0x2CDDB72c47596e320d84b653B2d6aE3279a68AAf';

  useEffect(() => {
    if (address) {
      const fetchMultiSigWallets = async () => {
        try {
          const multiSigWallets = await readContract(config, {
            abi: safeLiteAddressBookAbi.abi,
            address: addressBook,
            functionName: 'getWalletsByOwner',
            args: [address],
          }) as `0x${string}`[];

          if (multiSigWallets.length === 0) {
            router.push('/create-wallet');
          } else {
            setMultiSigInputs(multiSigWallets);
          }

        } catch (error) {
          console.error('Error fetching multisig wallets:', error);
        }
      };

      fetchMultiSigWallets();
    }
  }, [address, router]);

  const handleWalletClick = (walletAddress: `0x${string}`) => {
    setSelectedWallet(walletAddress);
    router.push('/manage-wallet');
  };

  const multiSigInputsList = multiSigInputs.map((walletAddress, index) => (
    <div key={index} style={{ marginBottom: '10px', cursor: 'pointer' }} onClick={() => handleWalletClick(walletAddress)}>
        <Input
          readOnly
          size="lg"
          variant="bordered"
          color="success"
          type="text"
          value={walletAddress}
          label={`MultiSig Wallet ${index + 1}`}
          style={{ cursor: 'pointer' }}
        />
      </div>
  ));

  return (
    <div style={{ width: '100%', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#121312', minHeight: '100vh' }}>
      <div title="logo_box" style={{ width: '50%', height: '100%', marginRight: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Image src={Logo} alt="logo" width={460} height={420} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
      </div>
      <div style={{ width: '50%', height: '85%', backgroundColor: '#1c1c1c', borderRadius: '16px', marginRight: '70px' }}>
        <div title="wallet_box" style={{ width: '100%', height: '100%', paddingLeft: 60, paddingRight: 60, paddingTop: 40, paddingBottom: 40, background: '#1C1C1C', borderRadius: 10, overflow: 'hidden', border: '1px #303033 solid', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 20, display: 'flex' }}>
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20, alignItems: 'center' }}>
            {!address ? (
              <>
                <div style={{ fontSize: '32px', fontWeight: '500', textAlign: 'center' }}> Get Started </div>
                <div style={{ fontSize: '24px', fontWeight: '200', textAlign: 'center' }}>
                  Connect your wallet to create a new Safe lite<br /> Account or open an existing one
                </div>
                <ConnectButton label="Connect Your Wallet"/>
              </>
            ) : (
              <>
                <div style={{ fontSize: '28px', fontWeight: '500', textAlign: 'center' }}> My Safe Accounts </div>
                <div style={{ fontSize: '20px', fontWeight: '200', textAlign: 'center' }}> Choose your wallet </div>
                <div style={{ width: 422 }}>
                  {multiSigInputsList}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      </div>
  ); 
}