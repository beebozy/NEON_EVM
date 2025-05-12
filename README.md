#

0xB706F42E171E8d676A2516b6B22e17303a2F16fB   ERC20ForSPLMintableAddress
0xf89ad11569fe765aba28dc89f3dd1321fd76eb77228f5b572d732e1d49c5362c tokenMint

The Composability in your context (the TestDevBootcamp contract in the deployment script) serves as a bridge mechanism between Ethereum and Solana via a wrapped SPL token standard (ERC20ForSpl). This contract enables a user to:

Approve tokens on the Ethereum side.

Trigger token transfer operations that ultimately reflect actions on Solana (e.g., transferring to a Solana-associated token account).

Manage associated token accounts (ATAs) on Solana.

✅ TestDevBootcamp Composability Contract — README
🧩 Overview
TestDevBootcamp is a composability smart contract designed to demonstrate cross-chain interactions between Ethereum and Solana using a wrapped SPL token (via the ERC20ForSplMintable interface). This contract shows how Ethereum-native operations can interoperate with Solana-native token accounts using Neon EVM and Solana token program APIs.

🔗 Features
Connects to a pre-minted ERC20ForSplMintable token.

Accepts ERC-20 approvals for token usage.

Transfers SPL-wrapped tokens to associated Solana token accounts.

Uses Neon EVM to represent Solana addresses and token accounts within the Ethereum smart contract.

⚙️ How It Works
Initialization

Deployed with the address of an ERC20ForSplMintable token, which internally maps to a Solana SPL token mint.

Approve Tokens

The user calls .approve() on the ERC20ForSPL token to allow the composability contract to transfer tokens on their behalf.

Transfer Tokens to Solana ATA

The transfer() function of TestDevBootcamp takes:

The amount of tokens.

A Solana public key (encoded as bytes32).

This function calls the wrapped SPL token contract to handle the transfer to a Solana destination.

🔐 Prerequisites
A deployed instance of ERC20ForSplFactory and ERC20ForSplMintable.

Neon EVM environment configured.

Solana wallet and RPC endpoint set up.

bs58-encoded Solana private key for signing Solana transactions.

.env configured with:

dotenv
Copy
Edit
PRIVATE_KEY_SOLANA=your_base58_encoded_solana_key
🛠️ Deployment Steps
The deployment.ts script:

Connects to Solana and Ethereum.

Creates an ERC20ForSPL-mintable token.

Deploys the TestDevBootcamp contract.

Derives associated token accounts (ATA) on Solana.

Approves token spending and invokes the transfer from Ethereum to Solana.

📦 Example Usage
solidity
Copy
Edit
// Inside TestDevBootcamp
function transfer(uint256 amount, bytes32 solanaPubkey) external {
    erc20Token.transferFrom(msg.sender, address(this), amount);
    erc20Token.transferSolana(solanaPubkey, uint64(amount));
}
🧪 Why Composability Matters
This demo showcases cross-chain composability—how tokens and logic on one chain (Ethereum) can safely and efficiently interact with assets and identity on another chain (Solana). It's a practical foundation for building:

Cross-chain DeFi apps.

Bridging tools for tokens or NFTs.

Interoperable dApps with shared logic.