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
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/react";
import Image from "next/image";
import TrashIcon from "@/public/icon_trash.svg";

export default function ManageWallet() {
    const { data: walletClient, isError, isLoading } = useWalletClient()
    const [safeLiteDeployTxHash, setSafeLiteDeployTxHash] = useState('')
    const result = useWaitForTransactionReceipt({
        hash: safeLiteDeployTxHash as `0x${string}`,
    })
    const [owners, setOwners] = useState<`0x${string}`[]>([])
    const safeLite = useSafeLite(result?.data?.contractAddress ? result?.data?.contractAddress : undefined)
    const safeLiteWallet = useSafeLite()
    const [multiSigInput, setMultiSigInput] = useState('');
    const [balance, setBalance] = useState(0)
    const { isOpen: addSignerModalOpen, onOpen: onOpenAddSignerModal, onClose: onCloseAddSignerModal } = useDisclosure();
    const { isOpen: removeSignerModalOpen, onOpen: onOpenRemoveSignerModal, onClose: onCloseRemoveSignerModal } = useDisclosure();

    const [newSigner, setNewSigner] = useState('');
    const [newThreshold, setNewThreshold] = useState('');
    const [existingSigner, setExistingSigner] = useState('');
    const [removeThreshold, setRemoveThreshold] = useState('');

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
        <div key={index} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 422 }}>
                <Input size="lg" variant="bordered" color="success" type="text" label={`Signer ${index + 1}`} value={owner} />
            </div>
            <Button isIconOnly onPress={() => {
                setExistingSigner(owner);
                onOpenRemoveSignerModal();
            }} color="danger" variant="shadow" className="text-white">
                <Image src={TrashIcon} alt="logo" width={20} height={20} />
            </Button>
        </div>
    ));

    const addSignerExeTx = async () => {
        const nonce = await readContract(config, {
            abi: safeLiteAbi.abi,
            address: multiSigInput as `0x${string}`,
            functionName: 'nonce',
            args: [],
        });
        console.log("nonce is", nonce)

        const safeLiteInterface = new ethers.utils.Interface(safeLiteAbi.abi);

        const data = safeLiteInterface.encodeFunctionData("addSigner", [newSigner, Number(newThreshold)]);
        console.log("Encoded data is: ", data);

        const hash = await readContract(config, {
            abi: safeLiteAbi.abi,
            address: multiSigInput as `0x${string}`,
            functionName: 'getTransactionHash',
            args: [Number(nonce), multiSigInput, 0, data],
        }) as `0x${string}`

        const signatureCount = await readContract(config, {
            abi: safeLiteAbi.abi,
            address: multiSigInput as `0x${string}`,
            functionName: 'getSignatureCount',
            args: [Number(nonce)],
        });
        console.log("signatureCount is: ", signatureCount);

        const signature = await walletClient?.signMessage({
            message: { raw: hash },
        });

        const executeTransaction = await walletClient?.writeContract({
            abi: safeLiteAbi.abi,
            address: multiSigInput as `0x${string}`,
            functionName: 'signTransaction',
            args: [
                Number(nonce),
                multiSigInput,
                0,
                data,
                signature,
            ],
        });
    };

    const removeSignerExeTx = async () => {
        const nonce = await readContract(config, {
            abi: safeLiteAbi.abi,
            address: multiSigInput as `0x${string}`,
            functionName: 'nonce',
            args: [],
        });
        console.log("nonce is", nonce)

        const safeLiteInterface = new ethers.utils.Interface(safeLiteAbi.abi);

        const data = safeLiteInterface.encodeFunctionData("removeSigner", [existingSigner, Number(removeThreshold)]);
        console.log("Encoded data is: ", data);

        const hash = await readContract(config, {
            abi: safeLiteAbi.abi,
            address: multiSigInput as `0x${string}`,
            functionName: 'getTransactionHash',
            args: [Number(nonce), multiSigInput, 0, data],
        }) as `0x${string}`

        const signatureCount = await readContract(config, {
            abi: safeLiteAbi.abi,
            address: multiSigInput as `0x${string}`,
            functionName: 'getSignatureCount',
            args: [Number(nonce)],
        });
        console.log("signatureCount is: ", signatureCount);

        const signature = await walletClient?.signMessage({
            message: { raw: hash },
        });

        const executeTransaction = await walletClient?.writeContract({
            abi: safeLiteAbi.abi,
            address: multiSigInput as `0x${string}`,
            functionName: 'signTransaction',
            args: [
                Number(nonce),
                multiSigInput,
                0,
                data,
                signature,
            ],
        });
    };

    const onCloseAddSignerModalHandler = () => {
        setNewSigner('');
        setNewThreshold('');
        onCloseAddSignerModal();
    }

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
                                    {owners.length > 0 && (
                                        <Button onPress={onOpenAddSignerModal} color="success" variant="shadow" className="text-white" >
                                            Add new Signer
                                        </Button>
                                    )}
                                    <Modal
                                        isOpen={addSignerModalOpen}
                                        onOpenChange={onCloseAddSignerModalHandler}
                                        placement="top-center"
                                    >
                                        <ModalContent>
                                            {(onClose) => (
                                                <>
                                                    <ModalHeader className="flex flex-col gap-1">Add new Signer</ModalHeader>
                                                    <ModalBody>
                                                        <Input
                                                            autoFocus
                                                            label="New Singer"
                                                            placeholder="Write new Singer address"
                                                            variant="bordered"
                                                            value={newSigner}
                                                            onChange={(e) => setNewSigner(e.target.value)}
                                                        />
                                                        <Input
                                                            label="Threshold"
                                                            placeholder="Write new Threshold"
                                                            variant="bordered"
                                                            value={newThreshold}
                                                            onChange={(e) => setNewThreshold(e.target.value)}
                                                        />
                                                        <div className="flex py-2 px-1 justify-between">
                                                        </div>
                                                    </ModalBody>
                                                    <ModalFooter>
                                                        <Button color="default" variant="flat" onPress={onClose}>
                                                            Close
                                                        </Button>
                                                        <Button color="success" variant="shadow" className="text-white" onPress={() => {
                                                            addSignerExeTx();
                                                            onClose();
                                                        }}>
                                                            Add
                                                        </Button>
                                                    </ModalFooter>
                                                </>
                                            )}
                                        </ModalContent>
                                    </Modal>
                                    <Modal
                                        isOpen={removeSignerModalOpen}
                                        onOpenChange={onCloseRemoveSignerModal}
                                        placement="top-center"
                                    >
                                        <ModalContent>
                                            {(onClose) => (
                                                <>
                                                    <ModalHeader className="flex flex-col gap-1">Remove existing Signer</ModalHeader>
                                                    <ModalBody>
                                                        <Input
                                                            readOnly
                                                            label="Existing Singer"
                                                            placeholder="Write existing Singer address"
                                                            variant="bordered"
                                                            value={existingSigner}
                                                            onChange={(e) => setExistingSigner(e.target.value)}
                                                        />
                                                        <Input
                                                            label="Threshold"
                                                            placeholder="Write new Threshold"
                                                            variant="bordered"
                                                            value={removeThreshold}
                                                            onChange={(e) => setRemoveThreshold(e.target.value)}
                                                        />
                                                        <div className="flex py-2 px-1 justify-between">
                                                        </div>
                                                    </ModalBody>
                                                    <ModalFooter>
                                                        <Button color="default" variant="flat" onPress={onClose}>
                                                            Close
                                                        </Button>
                                                        <Button color="danger" variant="shadow" className="text-white" onPress={() => {
                                                            removeSignerExeTx();
                                                            onClose();
                                                        }}>
                                                            Remove
                                                        </Button>
                                                    </ModalFooter>
                                                </>
                                            )}
                                        </ModalContent>
                                    </Modal>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
}