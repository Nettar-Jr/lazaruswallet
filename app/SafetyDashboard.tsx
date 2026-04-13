'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { usePrivy } from '@privy-io/react-auth';

export default function SafetyDashboard() {
  const { user, authenticated } = usePrivy();
  const [recipient, setRecipient] = useState('');
  const [threshold, setThreshold] = useState(30);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 1. Fetch existing settings when the component loads
  useEffect(() => {
    async function fetchSettings() {
      if (authenticated && user) {
        const wallet = user.linkedAccounts.find((a) => a.type === 'wallet');
        const address = (wallet as any)?.address;

        if (address) {
          const { data, error } = await supabase
            .from('lazarus_settings')
            .select('*')
            .eq('wallet_address', address)
            .single();

          if (data) {
            setRecipient(data.recipient_address || '');
            setThreshold(data.threshold_days || 30);
          }
        }
      }
    }
    fetchSettings();
  }, [authenticated, user]);

  // 2. Save or Update settings
  const saveSettings = async () => {
    setLoading(true);
    setMessage('');
    
    const wallet = user?.linkedAccounts.find((a) => a.type === 'wallet');
    const address = (wallet as any)?.address;

    if (!address) {
      setMessage('Error: No wallet found.');
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('lazarus_settings')
      .upsert({
        wallet_address: address,
        recipient_address: recipient,
        threshold_days: threshold,
        is_enabled: true
      }, { onConflict: 'wallet_address' });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('✅ Safety settings saved successfully!');
    }
    setLoading(false);
  };

  if (!authenticated) return null;

  return (
    <div style={{ 
      maxWidth: '500px', 
      margin: '40px auto', 
      padding: '20px', 
      border: '1px solid #333', 
      borderRadius: '12px',
      backgroundColor: '#1a1a1a',
      color: 'white',
      textAlign: 'left'
    }}>
      <h2 style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>Dead Man's Switch Settings</h2>
      
      <div style={{ marginTop: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>Beneficiary Wallet Address (EVM/Solana)</label>
        <input 
          type="text" 
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x... or Solana Address"
          style={{ 
            width: '100%', 
            padding: '10px', 
            borderRadius: '6px', 
            border: '1px solid #444', 
            backgroundColor: '#000', 
            color: '#fff' 
          }}
        />
      </div>

      <div style={{ marginTop: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>Inactivity Threshold (Days)</label>
        <input 
          type="number" 
          value={threshold}
          onChange={(e) => setThreshold(parseInt(e.target.value))}
          style={{ 
            width: '100%', 
            padding: '10px', 
            borderRadius: '6px', 
            border: '1px solid #444', 
            backgroundColor: '#000', 
            color: '#fff' 
          }}
        />
        <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>
          If you don't log in for {threshold} days, your assets will be eligible for transfer.
        </p>
      </div>

      <button 
        onClick={saveSettings}
        disabled={loading}
        style={{ 
          marginTop: '20px', 
          width: '100%', 
          padding: '12px', 
          backgroundColor: '#0070f3', 
          color: 'white', 
          border: 'none', 
          borderRadius: '6px', 
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        {loading ? 'Saving...' : 'Update Lazarus Protocol'}
      </button>

      {message && <p style={{ marginTop: '15px', textAlign: 'center', color: message.includes('✅') ? '#4caf50' : '#ff4444' }}>{message}</p>}
    </div>
  );
}