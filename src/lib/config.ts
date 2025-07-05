import { defineChain, createPublicClient, http, type Chain } from "viem";
import { createConfig } from "wagmi";

// Define EDU Chain Mainnet
const eduChainMainnet = defineChain({
  id: 41923, // Official EDU Chain Mainnet chain ID
  name: "EDU Chain",
  network: "edu-chain",
  nativeCurrency: {
    name: "EDU",
    symbol: "EDU",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.edu-chain.raas.gelato.cloud/"],
    },
    public: {
      http: ["https://rpc.edu-chain.raas.gelato.cloud/"],
    },
  },
  blockExplorers: {
    default: { name: "EDUScan", url: "https://eduscan.blockscout.com" },
  },
  testnet: false,
});

// Define the chains as a tuple
const chains = [eduChainMainnet] as const;

// Define the client as a function
const client = ({ chain }: { chain?: Chain }) =>
  createPublicClient({
    chain: chain || eduChainMainnet,
    transport: http("https://rpc.edu-chain.raas.gelato.cloud/"),
  });

// Create a base Wagmi configuration (without connectors, which will be added on the client)
const wagmiConfig = createConfig({
  chains,
  client,
});

export { chains, eduChainMainnet, wagmiConfig, client };