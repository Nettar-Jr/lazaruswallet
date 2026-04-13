'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useWallets } from '@privy-io/react-auth';
import { X, ShieldCheck, Loader2 } from 'lucide-react';

// Updated ABI to include the 4th parameter: bytes32 _hashCommitment
const ERC20_ABI = ["function approve(address spender, uint256 amount) public returns (bool)"];
const VAULT_ABI = ["function createSwitch(address _beneficiary, address _token, uint256 _amount, bytes32 _hashCommitment) external"];

export default function DepositModal({ isOpen, onClose, recipientAddress }: { 
  isOpen: boolean; 
  onClose: () => void;
  recipientAddress: string;
}) {
  const { wallets } = useWallets();
  const [amount, setAmount] = useState('');
  const [tokenAddress, setTokenAddress] = useState(''); 
  const [status, setStatus] = useState<'idle' | 'approving' | 'depositing' | 'success'>('idle');

  if (!isOpen) return null;

  // Helper to create the Hash Chain link
  const generateHashChain = () => {
    const secret = ethers.hexlify(ethers.randomBytes(32));
    const commitment = ethers.keccak256(secret);
    return { secret, commitment };
  };

    const handleDeposit = async () => {
        // Validate inputs before doing anything
        if (!amount || parseFloat(amount) <= 0) {
            return alert("Please enter a valid amount.");
        }
        if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
            return alert("Please enter a valid Token Address.");
        }

        try {
        const wallet = wallets[0];
        if (!wallet) return alert("No wallet connected");

        // Get the EIP-1193 provider from Privy
        const baseProvider = await wallet.getEthereumProvider();
        
        // Wrap it in an ethers BrowserProvider (v6 syntax)
        const provider = new ethers.BrowserProvider(baseProvider);
        const signer = await provider.getSigner();

        const vaultAddress = process.env.NEXT_PUBLIC_LAZARUS_CONTRACT_ADDRESS!;
        const parsedAmount = ethers.parseUnits(amount, 18);

        // APPROVE
        setStatus('approving');
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
        const approveTx = await tokenContract.approve(vaultAddress, parsedAmount);
        await approveTx.wait();

        // GENERATE HASH CHAIN LINK
        setStatus('depositing');
        const { secret, commitment } = generateHashChain();

        //DEPOSIT & COMMIT HASH
        const vaultContract = new ethers.Contract(vaultAddress, VAULT_ABI, signer);
        const depositTx = await vaultContract.createSwitch(
            recipientAddress, 
            tokenAddress, 
            parsedAmount,
            commitment 
        );
        await depositTx.wait();

        localStorage.setItem('lazarus_secret', secret);
        
        setStatus('success');
        setTimeout(() => {
            onClose();
            setStatus('idle');
        }, 2000);
        
        } catch (err: any) {
            console.error("Transaction Error:", err);
            setStatus('idle');

            const isUserRejected = 
                err.code === 'ACTION_REJECTED' || 
                err.message?.toLowerCase().includes('user rejected');

            if (isUserRejected) {
                // We do nothing! No alert, no crash. 
                // The modal just stays open so they can try again or change the amount.
                console.log("User cancelled the request.");
                return; 
            }

            if (err.message?.includes('insufficient funds')) {
                alert("You don't have enough HSK for gas fees on HashKey Chain.");
                return;
            }

            alert("Something went wrong. Please check the token address and try again.");
        }
    };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[300] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Secure Assets</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Token Address</label>
            <input 
              type="text" 
              placeholder="0x... (Token to protect)"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="w-full mt-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00A36C]/20 text-sm font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Amount</label>
            <input 
              type="number" 
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full mt-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-2xl font-bold focus:outline-none"
            />
          </div>

          <div className="p-4 bg-green-50 rounded-2xl flex gap-3 items-start border border-[#00A36C]/10">
            <ShieldCheck className="text-[#00A36C] shrink-0 w-5 h-5 mt-0.5" />
            <p className="text-[11px] text-[#00A36C] font-semibold leading-relaxed">
              Assets will be cryptographically locked on HashKey Chain and transferred to 
              <span className="font-bold underline ml-1">
                {recipientAddress.slice(0,6)}...{recipientAddress.slice(-4)}
              </span> if you remain inactive.
            </p>
          </div>

          <button 
            onClick={handleDeposit}
            disabled={status !== 'idle'}
            className="w-full py-4 bg-[#00A36C] text-white rounded-2xl font-bold text-lg hover:bg-[#008f5d] shadow-lg shadow-[#00A36C]/20 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {status === 'approving' && <><Loader2 className="animate-spin" /> Approving HSK...</>}
            {status === 'depositing' && <><Loader2 className="animate-spin" /> Committing Hash...</>}
            {status === 'success' && "✅ Protocol Active"}
            {status === 'idle' && "Initialize Lazarus"}
          </button>
        </div>
      </div>
    </div>
  );
}