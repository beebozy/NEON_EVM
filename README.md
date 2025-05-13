# ✅ TestDevBootcamp Composability Contract — README

##  Overview

**TestDevBootcamp** is a composability smart contract demonstrating **cross-chain interactions** between Ethereum and Solana via Neon EVM using a wrapped SPL token (`ERC20ForSPLMintable`). It enables Ethereum-native token operations to reflect actions on Solana using Solana's token program and associated token accounts (ATAs).

---

## 🔗 Features

* Connects to a deployed `ERC20ForSPLMintable` token.
* Accepts standard ERC-20 approvals from users.
* Transfers tokens from Ethereum to Solana ATAs.
* Computes Solana PDAs (ATAs) using `CALL_SOLANA`.
* Includes a reverse function to send tokens from Solana to Ethereum.

---

## ⚙️ How It Works

### Initialization

The contract is deployed with the address of an `ERC20ForSPLMintable`, which maps to a Solana SPL token mint.

### Approve Tokens

Users approve token transfers using:

```solidity
erc20Token.approve(TestDevBootcamp, amount);
```

### Transfer Tokens to Solana ATA

Call `transfer(uint256 amount, bytes32 solanaPubkey)`:

```solidity
// Inside TestDevBootcamp
function transfer(uint256 amount, bytes32 solanaPubkey) external {
    erc20Token.transferFrom(msg.sender, address(this), amount);
    erc20Token.transferSolana(solanaPubkey, uint64(amount));
}
```

### Transfer from Solana to EVM

Allows reverse bridging by calling:

```solidity
function transferFromSolana(
    bytes32 solanaSender,
    address evmRecipient,
    uint64 amount
) external
```

This executes a Solana CPI transfer and then mints ERC-20 tokens on the EVM side.

---



```solidity
function getUserATA(address user) external
```

This returns the ATA given to an EVM address

## 🧪 Why Composability Matters

This contract is a **real-world demonstration** of cross-chain composability:

* Assets on Ethereum can directly interact with Solana token accounts.
* You can build cross-chain DeFi, NFT bridges, and interoperable dApps.
* Logic and identity from one chain (Ethereum) trigger effects on another (Solana).

---

## 💠 Deployment Summary

These are values from the actual deployment logs:

| Description                          | Value                                                                                     |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| **ERC20ForSPLMintable Address**      | `0x0184668c3d2bD700FDAdbD9eF7D18Eac328e53A3`                                              |
| **Token Mint (Solana)**              | `0x3bdee27b937e34b50f01ff8560748640478bf5112ef5e7a29791d12efa05b957`                      |
| **TestDevBootcamp Contract**         | `0xcc147306FBf2a736c1193d5311e28E88334F44Fd`                                              |
| **Contract Public Key (Solana)**     | `DC5Mn9bTd1GFhEMAh6hBK5F1KpZ1FcHuzXtqyHPeioQa`                                            |
| **Sender ATA (Solana)**              | `FRv1sTKC5XtHMvf4NbA35tc9krB8xDFBJkzdSW7dC6LX`                                            |
| **Recipient ATA (Solana)**           | `HjssF82qWrvkVmiVU66Q7osb22xhADdEQi6RYakZuqAQ`                                            |
| **ATA Creation Tx**                  | `G9W7jXGE1LR2MMaeR1N3okaVJi1CHuuooC676tAqAHQDMJcfJeYxvQZyZhD6AwebKZDok5eMnddU8NShYnriYwS` |
| **ERC20 Approval Tx**                | `0x0a03c72f0a0f6c1dac30e5a3bae7403dbdeb96ee7d3ac6f7d4376d767fe46c9f`                      |
| **Transfer Call Tx**                 | `0xabee1d7f0be2cb53fa7f63ca91342fa3398c52976826ebafe601893b8ef2aa19`                      |
| **Contract ATA (from `getUserATA`)** | `0x97a26e228efe2b07f0fe63b8f534a244e3cedf2cfa80659e5ab5bfb64cd5cdec`                      |

---

## 📦 Deployment Steps

The `deployment.ts` script handles:

1. Connecting to Solana and Neon EVM.
2. Creating an `ERC20ForSPLMintable` token.
3. Deploying the `TestDevBootcamp` contract.
4. Deriving ATAs via PDA computation.
5. Approving tokens and executing a transfer to a Solana address.

---

## 🔐 Prerequisites

* Neon EVM environment (Neon RPC, deployed `CALL_SOLANA` contract).
* Solana CLI and wallet configured.
* Deployed `ERC20ForSPLMintable` and `ERC20ForSPLFactory`.
* `.env` file setup:

```

```
