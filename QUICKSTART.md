# Quick Start Guide

Get started with Tellement-French in 5 minutes.

## Prerequisites

- Node.js 18 or higher
- pnpm 8 or higher

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tellement-french.git
cd tellement-french

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## First Steps

### 1. Connect Your Wallet

Click the "Connect Wallet" button in the header and choose:
- **Xaman** — Xaman wallet extension
- **Crossmark** — Crossmark wallet extension
- **GemWallet** — GemWallet extension
- **Otsu** — Otsu wallet
- **WalletConnect** — Any WalletConnect-compatible wallet

### 2. Get Test XRP

1. Make sure you're on **Devnet** (check the network indicator in the header)
2. Scroll to the "Faucet" section
3. Click "Request Test XRP"
4. Wait a few seconds for your balance to update

### 3. Deposit into a Vault

1. Go to the **Lending** tab
2. Enter an amount of XRP to deposit
3. Click "Deposit" → confirms a `VaultDeposit` transaction
4. You'll receive share MPTokens representing your stake

### 4. Take a Loan

1. In the **Lending** tab, find the loan section
2. Enter your desired principal amount
3. Review the interest rate and payment schedule
4. Click "Request Loan" → cosigned `LoanSet` transaction
5. Funds are transferred to your account

### 5. Create a Trading Order

1. Go to the **Trading** tab
2. Choose an order type:
   - **Stop-Loss / Take-Profit** — Set a trigger price, funds locked in escrow
   - **Trailing Stop** — Set a trailing percentage
   - **OCO** — Set both TP and SL prices (two escrows)
   - **DCA** — Set amount per buy, number of buys, interval
3. Submit → creates on-chain escrow or ticket transactions
4. The watcher bot monitors prices and executes when conditions are met

### 6. Explore the Dashboard

The dashboard shows:
- **Vault TVL** — Total assets in the lending vault
- **Active Loans** — Current loan count
- **Active Orders** — Your pending trading orders
- **XRP Price** — Live from the native DEX

## How It Works

All operations use native XRPL transaction types — no smart contracts, no Hooks:

| Action | XRPL Transaction |
|--------|-----------------|
| Deposit into vault | `VaultDeposit` |
| Take a loan | `LoanSet` (cosigned) |
| Repay a loan | `LoanPay` |
| Create stop-loss | `EscrowCreate` (locks funds) |
| Execute order | `EscrowFinish` + `OfferCreate` |
| DCA setup | `TicketCreate` + pre-signed `OfferCreate` |

## What's Next?

- Read the [full README](README.md) for detailed documentation
- Check the [design spec](docs/specs/2026-04-11-tellement-french-design.md) for architecture details
- Review [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines

## Common Issues

### Wallet Not Detected
Make sure you have the wallet extension installed and unlocked.

### Transaction Failed
- Check you have sufficient XRP balance
- Verify you're on **Devnet** (not Testnet or AlphaNet)
- Try refreshing your balance

### Build Errors
```bash
# Clean and reinstall
pnpm clean
rm -rf node_modules
pnpm install
```
