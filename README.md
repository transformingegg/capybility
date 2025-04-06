# CAPYBILITY

A Web3 quiz platform enabling creators to mint quizzes as NFTs and users to earn verifiable credentials.

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in your values
3. Install dependencies:
```bash
npm install
```
4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a `.env.local` file with the following variables:

- `HYPERBOLIC_API_KEY` - Your Hyperbolic API key
- `POSTGRES_URL` - Your PostgreSQL database URL
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` - Your WalletConnect Project ID
- `SIGNER_PRIVATE_KEY` - Your private key for signing transactions
- `NEXT_PUBLIC_APP_URL` - Your app URL (use http://localhost:3000 for development)

## Features

- Create and mint quizzes as NFTs
- Take quizzes and earn verifiable credentials
- Track quiz participation and results
- Web3 wallet integration
