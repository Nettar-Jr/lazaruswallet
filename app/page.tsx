'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { 
  Settings, ChevronDown, ArrowUpRight, ArrowDownLeft, 
  Repeat, Wallet, ShieldCheck, History, Loader2, CheckCircle2 
} from 'lucide-react';
import DepositModal from './DepositModal';

// CONTRACT ABI (Essential functions)
const VAULT_ABI = [
  "function createSwitch(address _beneficiary, address _token, uint256 _amount, bytes32 _hashCommitment) external",
  "function poke(bytes32 _preImage, bytes32 _nextHashCommitment) external",
  "function switches(address) view returns (address beneficiary, uint256 amount, address token, bool active, uint256 lastHeartbeat, bytes32 currentHashCommitment)"
];

export default function HomePage() {
  const [showNetworks, setShowNetworks] = useState(false);
  const { user, authenticated, logout } = usePrivy();
  const { wallets } = useWallets();
  const [activeTab, setActiveTab] = useState('assets');
  const [showSettings, setShowSettings] = useState(false);
  const [isPoking, setIsPoking] = useState(false);
  const [hasSecret, setHasSecret] = useState(false);
  const [modalType, setModalType] = useState<'send' | 'receive' | 'swap' | 'vault' | null>(null);

  const currentWallet = wallets[0];
  const truncatedAddress = currentWallet 
    ? `${currentWallet.address.slice(0, 6)}...${currentWallet.address.slice(-4)}` 
    : 'Connect Wallet';

  // --- CRYPTOGRAPHIC HEARTBEAT LOGIC ---
  useEffect(() => {
    const checkHeartbeat = async () => {
      const secret = localStorage.getItem('lazarus_secret');
      if (secret) setHasSecret(true);

      if (authenticated && secret && currentWallet) {
        try {
          setIsPoking(true);
          console.log("Lazarus Protocol: Verifying Hash Chain link...");
          
          // In a live hackathon demo, you'd trigger contract.poke() here
          // For now, we simulate the 'Proof of Life' verification
          setTimeout(() => setIsPoking(false), 3000);
        } catch (err) {
          console.error("Heartbeat failed", err);
          setIsPoking(false);
        }
      }
    };
    checkHeartbeat();
  }, [authenticated, currentWallet]);

  return (
    <main className="min-h-screen bg-[#F9FAFB] text-[#1F2937] font-sans pb-24">
      {/* Header */}

      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 flex justify-between items-center">
        <div className="w-10 flex items-center">
          <div className={`w-2 h-2 rounded-full ${isPoking ? 'bg-amber-400 animate-pulse' : 'bg-[#00A36C]'}`}></div>
        </div>

        {/* NETWORK SELECTOR (Clickable) */}
        <button 
          onClick={() => setShowNetworks(true)}
          className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-100 hover:border-[#00A36C]/30 hover:bg-white transition-all active:scale-95"
        >
          <div className="w-4 h-4 bg-[#00A36C] rounded-full flex items-center justify-center text-[8px] text-white font-bold uppercase">
            H
          </div>
          <span className="text-xs font-black tracking-tight text-gray-700">HashKey Testnet</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>

        <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-gray-100 rounded-full">
          <Settings className="w-5 h-5 text-gray-500" />
        </button>
      </header>

      {/* 3. The Network Selection Modal (Paste this at the bottom of your return) */}
      {showNetworks && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl animate-in fade-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-lg tracking-tight">Switch Network</h3>
              <button onClick={() => setShowNetworks(false)} className="text-gray-400">✕</button>
            </div>
            
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-4 bg-green-50 border border-[#00A36C]/20 rounded-2xl group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#00A36C] rounded-lg flex items-center justify-center text-white font-bold text-xs">H</div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900">HashKey Testnet</p>
                    <p className="text-[10px] text-[#00A36C] font-bold">Connected</p>
                  </div>
                </div>
                <div className="w-2 h-2 bg-[#00A36C] rounded-full"></div>
              </button>

              {/* Coming Soon / Secondary Networks */}
              {['Ethereum', 'Solana', 'Bitcoin'].map((net) => (
                <button key={net} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 rounded-2xl grayscale opacity-50 cursor-not-allowed transition-all">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 font-bold text-xs">
                    {net[0]}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-400">{net}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Coming Soon</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto p-6">
        {/* Portfolio Balance Card */}
        <section className="text-center py-8">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Total Assets</p>
          <h1 className="text-5xl font-black tracking-tight text-gray-900">$0.00</h1>
          <div className="flex justify-center gap-2 mt-4">
            <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-mono font-bold text-gray-500">
              {truncatedAddress}
            </span>
          </div>
        </section>

        {/* Action Grid (Standard Wallet Layout) */}
        <nav className="grid grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Send', icon: ArrowUpRight, action: () => setModalType('send') },
            { label: 'Receive', icon: ArrowDownLeft, action: () => setModalType('receive') },
            { label: 'Swap', icon: Repeat, action: () => setModalType('swap') },
            { label: 'Vault', icon: ShieldCheck, highlight: true, action: () => setModalType('vault') },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <button 
                onClick={item.action}
                className={`w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center transition-all active:scale-90 ${
                  item.highlight ? 'bg-[#00A36C] text-white' : 'bg-white border border-gray-100 text-[#00A36C] hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-6 h-6" />
              </button>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{item.label}</span>
            </div>
          ))}
        </nav>

        {/* Active Protection Status Card */}
        {hasSecret && (
          <div className="mb-8 p-4 bg-[#E6F6F0] border border-[#00A36C]/20 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#00A36C] p-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#00A36C]">Lazarus Protocol Active</p>
                <p className="text-[10px] text-[#00A36C]/70">Cryptographic Pulse Verified</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-[#00A36C] bg-white px-2 py-1 rounded-lg">LIVE</span>
          </div>
        )}

        {/* Asset Tabs */}
        <section className="bg-white rounded-[32px] p-2 border border-gray-100 shadow-sm">
          <div className="flex p-1 gap-1">
            <button 
              onClick={() => setActiveTab('assets')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-2xl transition-all ${activeTab === 'assets' ? 'bg-[#F9FAFB] text-[#00A36C]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Tokens
            </button>
            <button 
              onClick={() => setActiveTab('nfts')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-2xl transition-all ${activeTab === 'nfts' ? 'bg-[#F9FAFB] text-[#00A36C]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              NFTs
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* HSK Token (Native) */}
            <div className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-2xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#00A36C] rounded-full flex items-center justify-center font-bold text-xs text-white">
                  HSK
                </div>
                <div>
                  <p className="font-bold text-sm">HashKey Token</p>
                  <p className="text-[10px] text-[#00A36C] font-bold uppercase">Mainnet Early Access</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">0.00</p>
                <p className="text-[10px] text-gray-400">$0.00</p>
              </div>
            </div>

            {/* Mock USDC or Protected Asset */}
            <div className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-2xl transition-colors opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold text-xs text-white">
                  $
                </div>
                <div>
                  <p className="font-bold text-sm">USDC</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Bridged Asset</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-gray-300">0.00</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Settings Drawer */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-sm bg-white h-full p-8 shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-2xl font-black tracking-tight">Wallet Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 p-2">✕</button>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Connected Identity</p>
                <p className="text-sm font-bold truncate">{user?.email?.address}</p>
                <p className="text-[10px] font-mono text-gray-400 mt-1 break-all">{currentWallet?.address}</p>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Network & Security</p>
                <button className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold">
                  <span>View Lazarus Hash Chain</span>
                  <ChevronDown className="-rotate-90 w-4 h-4 text-gray-300" />
                </button>
                <button onClick={() => logout()} className="w-full py-4 text-red-500 font-bold text-sm bg-red-50 rounded-2xl hover:bg-red-100 transition-colors">
                  Disconnect Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* RECEIVE MODAL */}
      {modalType === 'receive' && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 text-center animate-in zoom-in duration-200">
            <h2 className="text-xl font-black mb-4">Receive Assets</h2>
            <div className="bg-gray-100 p-6 rounded-2xl mb-4 inline-block">
              {/* You can add a QR code library later, for now a placeholder */}
              <div className="w-32 h-32 bg-gray-300 rounded-lg mx-auto flex items-center justify-center text-[10px] text-gray-500">QR CODE</div>
            </div>
            <p className="text-xs font-mono bg-gray-50 p-3 rounded-xl break-all mb-6">{currentWallet?.address}</p>
            <button 
              onClick={() => setModalType(null)}
              className="w-full py-3 bg-gray-900 text-white rounded-2xl font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* VAULT MODAL (Triggers your existing DepositModal) */}
      {modalType === 'vault' && (
        <DepositModal 
          isOpen={true} 
          onClose={() => setModalType(null)} 
          recipientAddress="0xYourBeneficiaryAddressHere" 
        />
      )}
    </main>
  );
}