# EquiClear

![Aleo](https://img.shields.io/badge/Aleo-Testnet-blue?style=for-the-badge&logo=aleo)
![Language](https://img.shields.io/badge/Language-Leo_&_Rust-orange?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active_Development-yellow?style=for-the-badge)

**EquiClear** is a privacy-preserving Dutch auction protocol built on the Aleo testnet. It features a uniform clearing price mechanism, ensuring transparency and fairness while maintaining bidder privacy through zero-knowledge proofs.

---

## 🎯 Key Features

*   🔽 **Dutch Auction**: Prices start high and decrease over time until a buyer accepts.
*   🤝 **Uniform Clearing Price**: All winners pay the same final clearing price.
*   🔒 **Privacy-Preserving**: Bid amounts are hidden using Aleo's zero-knowledge proofs.
*   🌐 **Cross-Chain Architecture**: Designed for future cross-chain interoperability.

## 🏗️ Project Structure

```bash
equiclear/
├── 📜 contracts/          # Aleo Leo smart contracts (balance, auction, bid, claim)
├── 📦 shared/             # Shared types & constants
├── ⚙️ indexer/            # Rust off-chain indexer for on-chain state tracking
└── 💻 frontend/           # React + Next.js frontend interface
```

## 🚀 Quick Start

### Prerequisites
*   [Aleo CLI & Leo Compiler](https://developer.aleo.org/getting_started/)
*   [Node.js 18+](https://nodejs.org/)
*   [Rust 1.70+](https://www.rust-lang.org/)
*   [Puzzle Wallet](https://puzzle.online/)

---

### 📝 Smart Contract Deployment

You can deploy the contracts using our automated script or manually via the Leo CLI.

#### Option 1: Automated Script (Recommended)

```bash
cd contracts

# 1. Setup Environment
cp .env.example .env
# Edit .env and allow insertion of your ALEO_PRIVATE_KEY

# 2. Build All Contracts
./build.sh --build

# 3. Deploy to Testnet
./build.sh --deploy
```

#### Option 2: Manual Deployment (Standard Aleo)

If you prefer deploying contracts individually using the standard Leo CLI:

```bash
# Export your private key
export PRIVATE_KEY="APrivateKey1..."

# 1. Deploy Balance Contract
cd contracts/balance
leo deploy -n testnet --private-key $PRIVATE_KEY

# 2. Deploy Auction Contract
cd ../auction
leo deploy -n testnet --private-key $PRIVATE_KEY

# 3. Deploy Bid Contract
cd ../bid
leo deploy -n testnet --private-key $PRIVATE_KEY

# 4. Deploy Claim Contract
cd ../claim
leo deploy -n testnet --private-key $PRIVATE_KEY
```

> **Note**: Ensure your account has sufficient credits for deployment fees.

---

### 💻 Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to interact with the protocol.

### ⚙️ Indexer Setup

The indexer tracks on-chain events for the frontend.

```bash
cd indexer
cargo run
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
