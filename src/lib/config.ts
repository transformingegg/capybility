import { defineChain, createPublicClient, http, type Chain } from "viem";
import { createConfig } from "wagmi";

// Define EDU Chain Testnet (Open Campus Codex)
const eduChainTestnet = defineChain({
  id: 656476, // Official EDU Chain Testnet chain ID
  name: "Open Campus Codex",
  network: "open-campus-codex",
  nativeCurrency: {
    name: "EDU",
    symbol: "EDU",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.open-campus-codex.gelato.digital"],
    },
    public: {
      http: ["https://rpc.open-campus-codex.gelato.digital"],
    },
  },
  blockExplorers: {
    default: { name: "EDUScan", url: "https://opencampus-codex.blockscout.com" },
  },
  testnet: true,
});

// Define the chains as a tuple
const chains = [eduChainTestnet] as const;

// Define the client as a function
const client = ({ chain }: { chain?: Chain }) =>
  createPublicClient({
    chain: chain || eduChainTestnet,
    transport: http("https://rpc.open-campus-codex.gelato.digital"),
  });

// Create a base Wagmi configuration (without connectors, which will be added on the client)
const wagmiConfig = createConfig({
  chains,
  client,
});

export { chains, eduChainTestnet, wagmiConfig, client };