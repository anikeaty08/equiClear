# EquiClear - Decentralized Dutch Auction Protocol

A privacy-preserving Dutch auction protocol built on Aleo testnet with uniform clearing price mechanism.

## 🎯 Key Features

- **Dutch Auction**: Prices start high and decrease over time
- **Uniform Clearing Price**: All winners pay the same final price
- **Privacy-Preserving**: Bid amounts hidden via zero-knowledge proofs
- **Cross-Chain Ready**: Architecture supports future cross-chain bidding

## 🏗️ Project Structure

```
equiclear/
├── contracts/          # Aleo Leo smart contracts
│   ├── auction/        # Auction creation & settlement
│   ├── balance/        # Token deposit/withdraw
│   ├── bid/            # Private bid submission
│   └── claim/          # Winner claims & refunds
├── shared/             # Shared types & constants
├── indexer/            # Rust off-chain indexer
└── frontend/           # React + Next.js frontend
```

## 🚀 Quick Start

### Prerequisites
- Aleo CLI & Leo compiler
- Node.js 18+
- Rust 1.70+
- Puzzle Wallet browser extension

### Smart Contracts
```bash
cd contracts/balance && leo build
cd contracts/auction && leo build
cd contracts/bid && leo build
cd contracts/claim && leo build
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Indexer
```bash
cd indexer
cargo run
```

## 📄 License

MIT License
