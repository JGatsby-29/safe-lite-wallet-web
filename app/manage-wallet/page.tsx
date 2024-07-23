'use client';

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
import { Input, Button, User } from "@nextui-org/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@nextui-org/react";
import { Card, CardHeader, CardBody, CardFooter, Divider, Link, Image } from "@nextui-org/react";
import { useWallet } from "@/app/walletContext";

import TrashIcon from "@/public/icon_trash.svg";
import { constrainedMemory } from "process";

export default function ManageWallet() {
    const { address } = useAccount();
    const { data: walletClient} = useWalletClient()
    const [safeLiteDeployTxHash, setSafeLiteDeployTxHash] = useState('')
    const [txHash, setTxHash] = useState<`0x${string}`>();
    const { data, isError, isLoading, isSuccess } = useWaitForTransactionReceipt({
        hash: txHash as `0x${string}`,
    });

    const [owners, setOwners] = useState<`0x${string}`[]>([])
    const safeLiteWallet = useSafeLite()
    const [multiSigInput, setMultiSigInput] = useState('');

    const [balance, setBalance] = useState(0)
    const [requireSignatures, setRequiredSignatures] = useState(0);
    const { isOpen: addSignerModalOpen, onOpen: onOpenAddSignerModal, onClose: onCloseAddSignerModal } = useDisclosure();
    const { isOpen: removeSignerModalOpen, onOpen: onOpenRemoveSignerModal, onClose: onCloseRemoveSignerModal } = useDisclosure();

    const [newSigner, setNewSigner] = useState('');
    const [newThreshold, setNewThreshold] = useState('');
    const [existingSigner, setExistingSigner] = useState('');
    const [removeThreshold, setRemoveThreshold] = useState('');
    const [transactions, setTransactions] = useState<never[]>([]);
    const addressBook = '0x28A56395523AA1feEf1CAc427FbfA5E8b4767F91';
    const { selectedWallet, setSelectedWallet } = useWallet();
    const [currentTransaction, setCurrentTransaction] = useState<[string, ethers.BigNumber, string, boolean, ethers.BigNumber, ethers.BigNumber] | null>(null);
    const [hasSignedCheck, setHasSignedCheck] = useState<boolean>(false);
    const [latestNonce, setLatestNonce] = useState(0);

    useEffect(() => {
        setMultiSigInput(selectedWallet);
    }, [selectedWallet]);

    useEffect(() => {
        if (address && isAddress(multiSigInput)) {
            inquiryHandler();
        }
    }, [address, multiSigInput]);

    useEffect(() => {
        if (isLoading) {
            console.log('Processing transaction...');
        }

        if (isError) {
            alert('Transaction failed');
        }

        if (isSuccess) {
            console.log('Transaction processed successfully');
            inquiryHandler();
        }
    }, [isLoading, isError, isSuccess]);

    const inquiryHandler = async () => {
        const owners = await readContract(config, {
            abi: safeLiteAbi.abi,
            address: multiSigInput as `0x${string}`,
            functionName: 'getOwners',
            args: [],
        }) as `0x${string}`[];

        if (!owners.includes(address as `0x${string}`)) {
            alert("You are not an owner of this multi-signature wallet.");
            return;
        }
        
        setOwners(owners);
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

        const requireSignatures = await readContract(config, {
            abi: safeLiteAbi.abi,
            address: multiSigInput as `0x${string}`,
            functionName: 'getRequiredSignatures',
            args: [],
        });
        setRequiredSignatures(Number(requireSignatures));

        const nonce = Number(await readContract(config, {
            abi: safeLiteAbi.abi,
            address: multiSigInput as `0x${string}`,
            functionName: 'nonce',
            args: [],
        }));
        console.log("nonce is", nonce)

        const txs: never[] = [];
        for (let i = 0; i <= nonce; i++) {
            const transaction = await readContract(config, {
                abi: safeLiteAbi.abi,
                address: multiSigInput as `0x${string}`,
                functionName: 'getTransaction',
                args: [i],
            }) as [string, ethers.BigNumber, string, boolean, ethers.BigNumber, ethers.BigNumber, boolean];
            if (transaction[0] !== '0x0000000000000000000000000000000000000000') {
                txs.push(transaction as never);
            }
        }

        console.log("Transaction info: ", txs);
        setTransactions(txs);
        setLatestNonce(nonce);
        UserhasSigned();
    };

    console.log('transactions :', transactions);

    const ownersInputs = owners.map((owner, index) => (
        <div key={index} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 422 }}>
                <Input readOnly size="lg" variant="bordered" color="primary" type="text" label={`Signer ${index + 1}`} value={owner} />
            </div>
            <Button isIconOnly onPress={() => {
                setExistingSigner(owner);
                onOpenRemoveSignerModal();
            }} color="danger" variant="shadow" className="text-white">
                <Image src="./icon_trash.svg" radius="none" alt="logo" width={20} height={2} />
            </Button>
        </div>
    ));

    const addSignerExeTx = async () => {
        if (!owners.includes(address as `0x${string}`)) {
            alert("You are not an owner of this multi-signature wallet.");
            return;
        }

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

        const signature = await walletClient?.signMessage({
            message: { raw: hash },
        });

        await walletClient?.writeContract({
            abi: safeLiteAbi.abi,
            address: multiSigInput as `0x${string}`,
            functionName: 'signTransaction',
            args: [
                Number(nonce),
                multiSigInput,
                0,
                data,
                signature,
                true
            ],
        });

    };

    const removeSignerExeTx = async () => {
        if (!owners.includes(address as `0x${string}`)) {
            alert("You are not an owner of this multi-signature wallet.");
            return;
        }

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

        const signature = await walletClient?.signMessage({
            message: { raw: hash },
        });

        await walletClient?.writeContract({
            abi: safeLiteAbi.abi,
            address: multiSigInput as `0x${string}`,
            functionName: 'signTransaction',
            args: [
                Number(nonce),
                multiSigInput,
                0,
                data,
                signature,
                true
            ],
        });
    };

    const getTransactionType = (data: string): string => {
        if (data === "0x") {
            return "Send Token";
        } else if (data.startsWith("0x65af1bed")) {
            return "Add Signer";
        } else if (data.startsWith("0x3bad5426")) {
            return "Remove Signer";
        } else {
            return "Unknown";
        }
    };

    const getCardBodyContent = (transaction: [string, ethers.BigNumber, string, boolean, ethers.BigNumber, ethers.BigNumber]): JSX.Element => {
        const data = transaction[2];
        const approvalCount = transaction[4];
        const rejectionCount = transaction[5];

        if (typeof data === "string" && data === "0x") {
            return (
                <p>
                    To : {transaction[0]}
                    <br />
                    Value : {ethers.utils.formatEther(transaction[1])} KLAY
                    <br />
                    Approvals: {approvalCount.toString()}
                    <br />
                    Rejections: {rejectionCount.toString()}
                </p>
            );
        } else if (typeof data === "string" && data.startsWith("0x65af1bed")) {
            const signerAddress = `0x${data.slice(34, 74)}`;
            return (
                <p>
                    To : {signerAddress}
                    <br />
                    New Required Signature Count : {transaction[2].slice(-1)}
                    <br />
                    Approvals: {approvalCount.toString()}
                    <br />
                    Rejections: {rejectionCount.toString()}
                </p>
            );
        } else if (typeof data === "string" && data.startsWith("0x3bad5426")) {
            const signerAddress = `0x${data.slice(34, 74)}`;
            return (
                <p>
                    To : {signerAddress}
                    <br />
                    New Required Signature Counts : {transaction[2].slice(-1)}
                    <br />
                    Approvals: {approvalCount.toString()}
                    <br />
                    Rejections: {rejectionCount.toString()}
                </p>
            );
        } else {
            return (
                <p>
                    Data: {data}
                    <br />
                    Approvals: {approvalCount.toString()}
                    <br />
                    Rejections: {rejectionCount.toString()}
                </p>
            );
        }
    };

    const router = useRouter();

    const handleSignTransaction = async (transaction: [string, ethers.BigNumber, string, boolean, ethers.BigNumber, ethers.BigNumber], isApproved: boolean) => {
        if (!owners.includes(address as `0x${string}`)) {
            alert("You are not an owner of this multi-signature wallet.");
            return;
        }
        
        const [to, value, data] = transaction;

        const nonce = await readContract(config, {
            abi: safeLiteAbi.abi,
            address: multiSigInput as `0x${string}`,
            functionName: 'nonce',
            args: [],
        });

        const hash = await readContract(config, {
            abi: safeLiteAbi.abi,
            address: multiSigInput as `0x${string}`,
            functionName: 'getTransactionHash',
            args: [Number(nonce), to, value, data],
        }) as `0x${string}`;

        const signaturePromise = walletClient?.signMessage({
            message: { raw: hash },
        });
        const signature = await signaturePromise;

        const txResponse = await walletClient?.writeContract({
            abi: safeLiteAbi.abi,
            address: multiSigInput as `0x${string}`,
            functionName: 'signTransaction',
            args: [
                Number(nonce),
                to,
                value,
                data,
                signature,
                isApproved
            ],
        });

        console.log("txResponse : ", txResponse);
        setTxHash(txResponse);
    };

    const UserhasSigned = async () => {
        const nonce = Number(await readContract(config, {
            abi: safeLiteAbi.abi,
            address: multiSigInput as `0x${string}`,
            functionName: 'nonce',
            args: [],
        }));

        const hasSigned = await readContract(config, {
            abi: safeLiteAbi.abi,
            address: multiSigInput as `0x${string}`,
            functionName: 'hasSigned',
            args: [nonce, address],
        }) as boolean;

        console.log("hasSignedCheck : ", hasSignedCheck);
        setHasSignedCheck(hasSigned);
    }

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
                                        <Input size="lg" variant="bordered" color="primary" type="text" value={multiSigInput} onChange={(e) => setMultiSigInput(e.target.value)} />
                                    </div>
                                    <Button color="primary" variant="shadow" className="text-black" size="lg" onClick={inquiryHandler}>Inquiry</Button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 20, display: 'flex' }}>
                                    <h3>Balance</h3>
                                    <div style={{ width: 211 }}>
                                        <Input size="lg" variant="bordered" color="primary" isReadOnly type="text" value={balance.toString()} endContent={
                                            <div className="pointer-events-none flex items-center">
                                                <span className="text-default-400 text-small">KLAY</span>
                                            </div>
                                        } />
                                    </div>
                                </div>
                                <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 20, display: 'flex' }}>
                                    <h3>Required Signatures</h3>
                                    <div style={{ width: 211 }}>
                                        <Input size="lg" variant="bordered" color="primary" isReadOnly type="text" value={requireSignatures.toString()} />
                                    </div>
                                </div>
                            </div>
                            <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 20, display: 'flex' }}>
                                <h3>Owners</h3>
                                <div id="owners-container" style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 10, display: 'inline-flex' }}>
                                    {ownersInputs}
                                    {owners.length > 0 && (
                                        <Button onPress={onOpenAddSignerModal} color="primary" variant="shadow" className="text-black" >
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
                                                        <Button color="primary" variant="shadow" className="text-black" onPress={() => {
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
                            <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 40, display: 'flex', marginBottom: "200px" }}>
                                <h3>Transaction Info</h3>
                                <div className="cards-container">
                                    {transactions.map((transaction, index) => (
                                        <Card key={index} className="max-w-[400px]">
                                            <CardHeader className="flex gap-3">
                                                <Image
                                                    alt="kaia logo"
                                                    height={40}
                                                    src="./favicon.png"
                                                    width={40}
                                                />
                                                <div className="flex flex-col">
                                                    <p className="text-md">{getTransactionType(transaction[2])}</p>
                                                    <p className="text-small text-default-500">Transaction #{index + 1}</p>
                                                </div>
                                            </CardHeader>
                                            <Divider />
                                            <CardBody style={{ fontSize: '14px' }}>
                                                {getCardBodyContent(transaction)}
                                            </CardBody>
                                            <Divider />
                                            <CardFooter>
                                                {transaction[3] ? (
                                                    <Link
                                                        isBlock
                                                        isExternal
                                                        showAnchorIcon
                                                        color="primary"
                                                        href={`https://baobab.klaytnscope.com/account/${multiSigInput}?tabId=internalTx`}>
                                                        Transaction Executed
                                                    </Link>
                                                ) : (
                                                    <>
                                                        {transaction[6] ? (
                                                            <Link
                                                                isBlock
                                                                color="danger">
                                                                Transaction Rejected
                                                            </Link>
                                                        ) : (
                                                            <>
                                                                {hasSignedCheck ? (
                                                                    <Link isBlock color="primary">
                                                                        You have already signed this transaction
                                                                    </Link>
                                                                ) : (
                                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                                        <Button color="primary" variant="shadow" className="text-black" onPress={() => handleSignTransaction(transaction, true)}>
                                                                            Approve
                                                                        </Button>
                                                                        <Button color="danger" variant="shadow" className="text-white" onPress={() => handleSignTransaction(transaction, false)}>
                                                                            Reject
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
}