'use client';

import { useWalletClient, useWaitForTransactionReceipt } from "wagmi";
import { readContract } from "@wagmi/core"
import { config } from "@/app/config/config"
import * as safeLiteAbi from '@/abi/safeLite.json';
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { isAddress } from "web3-validator";
import { useSafeLite } from "@/hooks/useSafeLite";
import { Input, Button } from "@nextui-org/react";

export default function ManageWallet() {
    const { data: walletClient, isError, isLoading } = useWalletClient()
    const [safeLiteDeployTxHash, setSafeLiteDeployTxHash] = useState('')
    const result = useWaitForTransactionReceipt({
        hash: safeLiteDeployTxHash as `0x${string}`,
    })
    const [threshold, setThreshold] = useState(0)
    const [owners, setOwners] = useState<`0x${string}`[]>([])
    const safeLite = useSafeLite(result?.data?.contractAddress ? result?.data?.contractAddress : undefined)
    const safeLiteWallet = useSafeLite()
    const [multiSigInput, setMultiSigInput] = useState('');
    const [balance, setBalance] = useState(0)

    const inquiryHandler = async () => {
        const balance = await readContract(config, {
            abi: safeLiteAbi.abi,
            address: multiSigInput as `0x${string}`,
            functionName: 'getBalance',
            args: [],
        });
        let balanceEther = ethers.utils.formatEther(String(balance));
        let balanceEtherNoDecimal = balanceEther.replace(/\.0$/, "");

        console.log(balanceEtherNoDecimal);
        setBalance(Number(balanceEtherNoDecimal));

        const owners = await readContract(config, {
            abi: safeLiteAbi.abi,
            address: multiSigInput as `0x${string}`,
            functionName: 'getOwners',
            args: [],
        }) as `0x${string}`[];
        
        console.log(owners);
        setOwners(owners);
    };

    const ownersInputs = owners.map((owner, index) => (
        <div key={index} style={{ width: 422 }}>
            <Input size="lg" variant="bordered" color="success" type="text" label={`new Signer ${index + 1}`} value={owner} />
        </div>
    ));

    return (
        <div style={{ backgroundColor: '#121312', minHeight: '100vh' }}>
            <br></br>
            <br></br>
            <div style={{ width: '100%', height: '100%', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', gap: 10, display: 'inline-flex' }}>
                <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 44, display: 'flex' }}>
                    <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 46, display: 'flex' }}>
                        <div style={{ width: 400, color: 'white', fontSize: 38, fontFamily: 'Outfit', fontWeight: '700', wordWrap: 'break-word' }}>Manage Wallet</div>
                        <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 80, display: 'inline-flex' }}>
                            <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 20, display: 'flex' }}>
                                <h3>Multisig wallet address</h3>
                                <div style={{ justifyContent: 'flex-start', alignItems: 'flex-end', gap: 22, display: 'inline-flex' }}>
                                    <div style={{ width: 422 }}>
                                        <Input size="lg" variant="bordered" color="success" type="text" value={multiSigInput} onChange={(e) => setMultiSigInput(e.target.value)} />
                                    </div>
                                    <Button size="lg" onClick={inquiryHandler}>Inquiry</Button>
                                </div>
                            </div>
                            <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 20, display: 'flex' }}>
                                <h3>Balance</h3>
                                <div style={{ width: 422 }}>
                                    <Input size="lg" variant="bordered" color="success" isReadOnly type="text" value={balance.toString()} endContent={
                                        <div className="pointer-events-none flex items-center">
                                            <span className="text-default-400 text-small">KLAY</span>
                                        </div>
                                    } />
                                </div>
                            </div>
                            <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 20, display: 'flex' }}>
                                <h3>Owners</h3>
                                <div id="owners-container" style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 10, display: 'inline-flex' }}>
                                    {ownersInputs}
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <Button color="success" variant="shadow" className="text-white" onClick={() => {
                                            setOwners(owners.concat('' as `0x${string}`))
                                        }}>
                                            + Add new Signer
                                        </Button>
                                        <Button color="danger" variant="shadow" className="text-white" onClick={() => {
                                            setOwners(owners.slice(0, -1))
                                        }}>
                                            - Delete Signer
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
}