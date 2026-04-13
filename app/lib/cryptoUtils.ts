import { ethers } from 'ethers';

export const generateHashChain = () => {
  // 1. Generate a random secret (The "Pre-image")
  const secret = ethers.hexlify(ethers.randomBytes(32));
  
  // 2. Hash it to create the commitment
  // This is what we send to the contract
  const commitment = ethers.keccak256(ethers.toUtf8Bytes(secret));
  
  return { secret, commitment };
};