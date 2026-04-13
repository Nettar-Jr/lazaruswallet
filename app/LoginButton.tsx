'use client';

import { useEffect } from 'react';
import { supabase } from './supabaseClient';
import { usePrivy } from '@privy-io/react-auth';

export default function LoginButton() {
  const { login, authenticated, logout, user } = usePrivy();

  useEffect(() => {
    async function updateHeartbeat() {
      // Only proceed if user is logged in
      if (authenticated && user) {
        // Find the embedded wallet address (works for EVM or Solana since we enabled both)
        const wallet = user.linkedAccounts.find((account) => account.type === 'wallet');
        const address = (wallet as any)?.address;

        if (address) {
          console.log('Sending heartbeat for:', address);
          
          const { error } = await supabase
            .from('user_activity')
            .upsert(
              { 
                wallet_address: address, 
                email: user.email?.address || 'no-email',
                last_seen: new Date().toISOString(),
                status: 'active'
              }, 
              { onConflict: 'wallet_address' }
            );

          if (error) {
            console.error('Supabase Heartbeat Error:', error.message);
          } else {
            console.log('✅ Heartbeat updated in Supabase');
          }
        }
      }
    }

    updateHeartbeat();
  }, [authenticated, user]); // Runs whenever the user logs in or their data changes

  if (authenticated) {
    const wallet = user?.linkedAccounts.find((account) => account.type === 'wallet');

    return (
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '10px', marginTop: '10px' }}>
        <p>✅ <strong>Authenticated!</strong></p>
        <p>Email: {user?.email?.address}</p>
        <p style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
          <strong>Your Wallet Address:</strong> <br />
          {wallet ? (wallet as any).address : 'Creating wallet...'}
        </p>
        <button 
          onClick={logout}
          style={{ marginTop: '10px', padding: '8px', cursor: 'pointer', backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={login}
      style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px' }}
    >
      Log In to Lazarus Wallet
    </button>
  );
}