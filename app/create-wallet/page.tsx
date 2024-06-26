'use client';

import { useWalletClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import * as safeLiteAbi from '@/abi/safeLite.json';
import * as safeLiteAddressBookAbi from '@/abi/SafeLiteAddressBook.json';
import { useEffect, useState } from "react";
import { isAddress } from "web3-validator";
import { useSafeLite } from "@/hooks/useSafeLite";
import { Input, Button } from "@nextui-org/react";

export default function CreateWallet() {
    const { data: walletClient, isError, isLoading } = useWalletClient()
    const [safeLiteDeployTxHash, setSafeLiteDeployTxHash] = useState('')
    const result = useWaitForTransactionReceipt({
        hash: safeLiteDeployTxHash as `0x${string}`,
    })
    const [threshold, setThreshold] = useState(0)
    const [owners, setOwners] = useState<`0x${string}`[]>(['0x',])
    const safeLite = useSafeLite(result?.data?.contractAddress ? result?.data?.contractAddress : undefined)
    const safeLiteWallet = useSafeLite()
    const { writeContract } = useWriteContract();

    const createHandler = async () => {
        let invalidAddr = ''
        owners.map((owner) => {
            if (!isAddress(owner)) {
                invalidAddr = owner
            }
        })
        if (invalidAddr) {
            alert('Invalid address: ' + invalidAddr)
            return
        }
        if (threshold <= 0 || threshold > owners.length) {
            alert('Invalid threshold: ' + threshold)
            return
        }
        try {
            const contract = await walletClient?.deployContract({
                abi: safeLiteAbi.abi,
                bytecode: safeLiteAbi.bytecode as `0x${string}`,
                args: [1001, owners, threshold],
            })
            setSafeLiteDeployTxHash(contract ? contract : '')

            if (result.isFetched && result?.status !== 'success') {
                alert('Wallet Creation failed' + result?.error)
            }
            if (result.isFetched && result?.status == 'success') {
                alert('Wallet Creation succeed' + result?.error)
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Wallet creation or recording failed')
        }
    }

    useEffect(() => {
        const newOwners = owners.slice()
        if (walletClient?.account.address) {
            newOwners[0] = walletClient?.account.address
            setOwners(newOwners)
        }
    }, [walletClient?.account.address])

    const ownerList = []
    for (let i = 0; i < owners.length; i++) {
        ownerList.push(
            <li key={i}>
                <Input style={{ width: 400 }} variant="bordered" color="success" label={`Signer ${i + 1}`} size="lg" id="multiSig" placeholder="Signer Address"
                    {...i === 0 ? { readOnly: true } : {}}
                    type="text"
                    value={owners[i]}
                    onChange={(e) => {
                        const newOwners = owners.slice()
                        newOwners[i] = e.target.value as `0x${string}`
                        setOwners(newOwners)
                    }}
                />
            </li>
        )
    }

    return (
        <div style={{ backgroundColor: '#121312', minHeight: '100vh' }}>
            <br></br>
            <br></br>
            <div style={{ width: '100%', height: '100%', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', gap: 10, display: 'inline-flex' }}>
                <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 44, display: 'flex' }}>
                    <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 46, display: 'flex' }}>
                        <div style={{ width: 400, color: 'white', fontSize: 38, fontFamily: 'Outfit', fontWeight: '700', wordWrap: 'break-word' }}>Create Wallet</div>
                        <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 80, display: 'inline-flex' }}>
                            <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 40, display: 'flex' }}>
                                <ul style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 16, display: 'flex' }}>
                                    <h3>Owners</h3>
                                    <div style={{ justifyContent: 'flex-start', alignItems: 'flex-end', gap: 22, display: 'inline-flex' }}>
                                        <Button color="success" variant="shadow" className="text-white" onClick={() => {
                                            setOwners(owners.concat('' as `0x${string}`))
                                        }}>
                                            + Add new Signer
                                        </Button>
                                        <Button onClick={() => {
                                            if (owners.length === 1) {
                                                alert('Cannot delete the first owner')
                                                return
                                            }
                                            setOwners(owners.slice(0, owners.length - 1))
                                        }}>
                                            Delete
                                        </Button>
                                    </div>
                                    {ownerList}
                                    <h3>Threshold</h3>
                                    <Input
                                        type="text"
                                        size="lg"
                                        value={threshold.toString()}
                                        onChange={(e) => {
                                            setThreshold(parseInt(e.target.value))
                                        }}
                                    />
                                </ul>
                                <Button onClick={createHandler} size="lg" color="success" variant="shadow" className="text-white">Create</Button>
                            </div>
                            <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 20, display: 'flex' }}>
                                <h3>Multisig wallet address</h3>
                                <div style={{ justifyContent: 'flex-start', alignItems: 'flex-end', gap: 22, display: 'inline-flex' }}>
                                    <div style={{ width: 422 }}>
                                        <Input size="lg" variant="bordered" color="success" isReadOnly type="text" value={safeLite} />
                                    </div>
                                    <Button size="lg" onClick={() => {
                                        if (safeLite) {
                                            navigator.clipboard.writeText(safeLite);
                                        } else {
                                            alert('Multisig wallet address is not available');
                                        }
                                    }}>Copy</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
}