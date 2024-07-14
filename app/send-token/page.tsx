'use client';

import { useWalletClient, useWaitForTransactionReceipt } from "wagmi";
import { signMessage, writeContract, readContract } from '@wagmi/core';
import { config } from '@/app/config/config';
import { parseGwei, parseEther } from 'viem'
import { ethers } from "ethers";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSafeLite } from "@/hooks/useSafeLite";
import * as safeLiteAbi from '@/abi/safeLite.json';
import { Input, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@nextui-org/react";
import { useWallet } from "@/app/walletContext";

export default function ExecuteTx() {
    const { data: walletClient, isError, isLoading } = useWalletClient();
    const [multiSigInput, setMultiSig] = useState('');
    const [toInput, setTo] = useState('');
    const [valueInput, setValue] = useState('');
    const [signature, setSignature] = useState('');
    const [transactions, setTransactions] = useState<never[]>([]);
    const [error, setError] = useState('');
    const { selectedWallet, setSelectedWallet } = useWallet();
    const router = useRouter();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const toParam = urlParams.get('to');
        const valueParam = urlParams.get('value');

        if (toParam) {
            setTo(toParam);
        }
        if (valueParam) {
            setValue(valueParam);
        }
    }, []);


    useEffect(() => {
        setMultiSig(selectedWallet);
    }, [selectedWallet]);

    const signTxHandler = async (isApproved: boolean) => {
        const nonce = await readContract(config, {
            abi: safeLiteAbi.abi,
            address: multiSigInput as `0x${string}`,
            functionName: 'nonce',
            args: [],
        });
        console.log("nonce is", nonce)

        const hash = await readContract(config, {
            abi: safeLiteAbi.abi,
            address: multiSigInput as `0x${string}`,
            functionName: 'getTransactionHash',
            args: [Number(nonce), toInput, ethers.utils.parseEther(valueInput), ""],
        }) as `0x${string}`

        const signature = await walletClient?.signMessage({
            message: { raw: hash },
        });

        await walletClient?.writeContract({
            abi: safeLiteAbi.abi,
            address: multiSigInput as `0x${string}`,
            functionName: 'signTransaction',
            args: [
                Number(nonce),
                toInput,
                ethers.utils.parseEther(valueInput),
                "",
                signature,
                isApproved
            ],
        });
    };

    const executeTxHandler = async () => {
        await signTxHandler(true);
    }

    return (
        <div style={{ backgroundColor: '#121312', minHeight: '100vh' }}>
            <br></br>
            <br></br>
            <div style={{ width: '100%', height: '100%', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', gap: 10, display: 'inline-flex' }}>
                <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 44, display: 'flex' }}>
                    <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 46, display: 'flex' }}>
                        <div style={{ color: 'white', fontSize: 38, fontFamily: 'Outfit', fontWeight: '700', wordWrap: 'break-word' }}>Send Token</div>
                        <div style={{ paddingLeft: 60, paddingRight: 60, paddingTop: 40, paddingBottom: 40, background: '#1C1C1C', borderRadius: 10, overflow: 'hidden', border: '1px #303033 solid', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 10, display: 'flex' }}>
                            <div style={{ justifyContent: 'flex-start', alignItems: 'flex-end', gap: 242, display: 'inline-flex' }}>
                                <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 40, display: 'inline-flex' }}>
                                    <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 20, display: 'flex' }}>
                                        <div style={{ width: 400, color: 'white', fontSize: 24, fontFamily: 'Outfit', fontWeight: '400', wordWrap: 'break-word' }}>MultiSig Wallet Address</div>
                                        <Input readOnly variant="bordered" color="primary" type="text" label="Multisig" size="lg" id="multiSig" value={multiSigInput} onChange={(e) => setMultiSig(e.target.value)} placeholder="your multisig wallet address" style={{ width: '100%' }} />
                                    </div>
                                    <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 60, display: 'flex' }}>
                                        <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 20, display: 'flex' }}>
                                            <div style={{ color: 'white', fontSize: 24, fontFamily: 'Outfit', fontWeight: '400', wordWrap: 'break-word' }}>Send Token</div>
                                            <div style={{ width: 400, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 16, display: 'flex' }}>
                                                <Input variant="bordered" color="primary" type="text" label="To" size="lg" id="to" value={toInput} onChange={(e) => setTo(e.target.value)} placeholder="recipient's wallet address" style={{ width: '100%' }} />
                                                <Input variant="bordered" color="primary" type="text" label="Value" size="lg" id="value" value={valueInput} onChange={(e) => setValue(e.target.value)} placeholder="the amount of tokens to send" endContent={
                                                    <div className="pointer-events-none flex items-center">
                                                        <span className="text-default-400 text-small">KLAY</span>
                                                    </div>
                                                } />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 140, display: 'inline-flex' }}>
                                    <Button onClick={executeTxHandler} size="lg" color="primary" variant="shadow" className="text-black">
                                        Send
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}