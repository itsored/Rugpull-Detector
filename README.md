# ERC-20 Token Risk Analyzer

A Next.js application that analyzes Ethereum ERC-20 tokens for common red flags and scam indicators using the Tatum API.

## Features

- **Token Metadata Analysis**: Retrieves token name, symbol, decimals, and total supply
- **Red Flag Detection**: Identifies common scam indicators like missing metadata, huge supply, low activity
- **Risk Scoring**: Calculates a risk score from 0-100 based on detected red flags
- **Real-time Analysis**: Uses Tatum's blockchain API for up-to-date information

## Setup

### 1. Get Tatum API Key

1. Sign up at [tatum.io](https://tatum.io/)
2. Go to your dashboard
3. Create a new API key (free tier available)
4. Copy your API key

### 2. Environment Configuration

Create a `.env.local` file in your project root:

\`\`\`env
TATUM_API_KEY=your_tatum_api_key_here
\`\`\`

### 3. Install and Run

\`\`\`bash
npm install
npm run dev
\`\`\`

## How It Works

The analyzer uses Tatum's smart contract invocation API to call standard ERC-20 methods:

- `name()` - Token name
- `symbol()` - Token symbol  
- `decimals()` - Token decimals
- `totalSupply()` - Total token supply

It then analyzes this data for red flags commonly associated with scam tokens:

- Missing or empty name/symbol
- Excessive total supply (>1 trillion tokens)
- Low transaction activity
- Centralized token holdings
- Recently created contracts

## Example Tokens

Try these verified tokens to test the analyzer:

- **USDT**: `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- **USDC**: `0xA0b86a33E6441b8C4505B8C4505B8C4505B8C4505`
- **WETH**: `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`
- **LINK**: `0x514910771AF9Ca656af840dff83E8264EcF986CA`

## API Endpoints

The app uses these Tatum API endpoints:

- `POST /v3/ethereum/smartcontract` - Smart contract method invocation
- `GET /v3/ethereum/transaction/address/{address}` - Transaction history
- `GET /v3/ethereum/account/balance/{address}` - Account balance

## Limitations

- Only analyzes ERC-20 tokens on Ethereum mainnet
- Requires valid Tatum API key
- Some analysis features are simplified for demonstration
- Rate limits apply based on your Tatum plan

## Disclaimer

This tool is for educational and research purposes only. Always do your own research before investing in any cryptocurrency or token.
