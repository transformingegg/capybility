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

## Barabots WL Processing

### Automated Processing Setup

The Barabots WL distribution runs automatically via Vercel Cron Jobs at 2 AM UTC daily.

### Security

- **API Key Required**: Set `BARABOTS_PROCESS_API_KEY` environment variable
- **Production**: Only POST requests with Bearer token authentication
- **Development**: GET requests allowed with `?key=` parameter (disabled in production)

### Manual Testing

```bash
# Development only
curl "https://your-domain.com/api/barabots-process-wl?key=YOUR_API_KEY"

# Production
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  https://your-domain.com/api/barabots-process-wl
```

### Environment Variables

Add to Vercel environment variables:
```
BARABOTS_PROCESS_API_KEY=your-secure-random-api-key-here
```

### Monitoring

Check Vercel function logs for processing results:
- Number of quizzes processed
- WL spots distributed
- Processing duration
- Any errors encountered
