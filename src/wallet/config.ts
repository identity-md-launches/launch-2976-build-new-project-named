import { createConfig, createStorage, http } from 'wagmi';
import { coinbaseWallet, injected } from 'wagmi/connectors';
import { sepolia } from 'wagmi/chains';

export const CHAIN_ID = 11155111;
export const PUBLIC_RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com';
export const chain = {
  ...sepolia,
  rpcUrls: { default: { http: [PUBLIC_RPC_URL] } },
};

// Privacy settings can make even reading window.localStorage throw. Wallet
// sessions fall back to memory so optional wallet infrastructure never blocks play.
const memory = new Map<string, string>();
const walletStorage = {
  getItem(key: string) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memory.get(key) ?? null;
    }
  },
  setItem(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      memory.set(key, value);
    }
  },
  removeItem(key: string) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      memory.delete(key);
    }
  },
};

export const config = createConfig({
  chains: [chain],
  multiInjectedProviderDiscovery: true,
  storage: createStorage({ key: 'squeek-wallet', storage: walletStorage }),
  connectors: [injected(), coinbaseWallet({ appName: 'Squeek Runner' })],
  transports: { [chain.id]: http(PUBLIC_RPC_URL) },
});

// Deliberately absent. Set a real deployment only when a reviewed contract exists.
export const leaderboardDeployment = null;
