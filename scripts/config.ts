import * as web3 from "@solana/web3.js";
import { Connection, Keypair, clusterApiUrl, PublicKey } from "@solana/web3.js";
import {
  Liquidity,
  Token,
  TOKEN_PROGRAM_ID,
  TokenAmount,
  Fraction,
  Currency,
  CurrencyAmount,
  Price,
  Percent,
  LIQUIDITY_STATE_LAYOUT_V4,
  MARKET_STATE_LAYOUT_V3,
  SPL_MINT_LAYOUT,
  SPL_ACCOUNT_LAYOUT,
  Market,
} from "@raydium-io/raydium-sdk";
import {
  Raydium,
  TxVersion,
  parseTokenAccountResp,
} from "@raydium-io/raydium-sdk-v2";
import * as fs from "fs";
import { BN } from "bn.js";
import { ethers } from "ethers";

interface Config {
  SOLANA_NODE: string;
  SOLANA_NODE_MAINNET: string;
  CALL_SOLANA_SAMPLE_CONTRACT: string;
  CALL_SOLANA_SAMPLE_CONTRACT_MAINNET: string;
  ICS_FLOW_MAINNET: string;
  VAULTCRAFT_FLOW_MAINNET: string;
  DATA: {
    SVM: {
      ADDRESSES: {
        [key: string]: string;
        WSOL: string;
        USDC: string;
        USDT: string;
        WBTC: string;
        RAY: string;
        TNEON12: string;
        NEON_PROGRAM: string;
        NEON_PROGRAM_DEVNET: string;
        ORCA_PROGRAM: string;
        ORCA_WSOL_USDC_POOL: string;
        ORCA_WBTC_USDC_POOL: string;
        WHIRLPOOLS_CONFIG: string;
        RAYDIUM_OPENBOOK_AMM_PROGRAM: string;
        RAYDIUM_OPENBOOK_AMM_PROGRAM_DEVNET: string;
        RAYDIUM_CPMM_PROGRAM_DEVNET: string;
        RAYDIUM_RAY_USDC_POOL: string;
        RAYDIUM_RAY_SOL_POOL: string;
        RAYDIUM_SOL_USDC_POOL: string;
        RAYDIUM_SOL_WBTC_POOL: string;
        RAYDIUM_SOL_USDT_POOL: string;
        JUPITER_PROGRAM: string;
        OPENBOOK_MARKET_ID_DEVNET: string;
      };
    };
    EVM: {
      ADDRESSES: {
        [key: string]: string;
        WSOL: string;
        WSOL_DEVNET: string;
        USDC: string;
        USDT: string;
        WBTC: string;
      };
      ABIs: {
        ERC20ForSPL: Array<{
          inputs?: Array<{ internalType: string; name: string; type: string }>;
          stateMutability?: string;
          type: string;
          anonymous?: boolean;
          name?: string;
          outputs?: Array<{ internalType: string; name: string; type: string }>;
        }>;
      };
    };
  };
  initialize: {
    initRaydiumSDK: (params: { loadToken?: boolean }, payer: string) => Promise<{ raydium: Raydium; txVersion: TxVersion }>;
  };
  utils: {
    prepareInstructionAccounts: (instruction: web3.TransactionInstruction, overwriteAccounts?: Array<{ key: string; isSigner: boolean; isWritable: boolean }>) => string;
    prepareInstructionData: (instruction: web3.TransactionInstruction) => string;
    prepareInstruction: (instruction: web3.TransactionInstruction) => string;
    execute: (
      instruction: web3.TransactionInstruction,
      lamports: number,
      contractInstance: ethers.Contract,
      salt: string | undefined,
      msgSender: ethers.Signer
    ) => Promise<[ethers.ContractTransaction, ethers.ContractReceipt]>;
    batchExecute: (
      instructions: web3.TransactionInstruction[],
      lamports: number,
      contractInstance: ethers.Contract,
      salts: string[] | undefined,
      msgSender: ethers.Signer
    ) => Promise<[ethers.ContractTransaction, ethers.ContractReceipt]>;
    publicKeyToBytes32: (pubkey: string) => string;
    addressToBytes32: (address: string) => string;
    calculateTokenAccount: (
      tokenEvmAddress: string,
      userEvmAddress: string,
      neonEvmProgram: PublicKey
    ) => [PublicKey, number];
    isValidHex: (hex: string) => boolean;
    toFixed: (num: number | string, fixed?: number) => string;
  };
  orcaHelper: {
    getParamsFromPools: (
      pools: Array<{
        address: PublicKey;
        tokenVaultAInfo: { address: PublicKey };
        tokenVaultBInfo: { address: PublicKey };
        tokenMintA: PublicKey;
        tokenMintB: PublicKey;
      }>,
      PDAUtil: { getOracle: (programId: PublicKey, whirlpool: PublicKey) => { publicKey: PublicKey } },
      programId: PublicKey,
      ataContractTokenA: PublicKey,
      ataContractTokenB: PublicKey,
      ataContractTokenC: PublicKey
    ) => {
      whirlpoolOne: PublicKey;
      whirlpoolTwo: PublicKey;
      tokenOwnerAccountOneA: PublicKey;
      tokenVaultOneA: PublicKey;
      tokenOwnerAccountOneB: PublicKey;
      tokenVaultOneB: PublicKey;
      tokenOwnerAccountTwoA: PublicKey;
      tokenVaultTwoA: PublicKey;
      tokenOwnerAccountTwoB: PublicKey;
      tokenVaultTwoB: PublicKey;
      oracleOne: PublicKey;
      oracleTwo: PublicKey;
    };
    getTokenAccsForPools: (
      pools: Array<{ tokenMintA: PublicKey; tokenMintB: PublicKey }>,
      tokenAccounts: Array<{ mint: PublicKey; account: PublicKey }>
    ) => PublicKey[];
  };
  raydiumHelper: {
    calcAmountOut: (
      connection: Connection,
      poolKeys: any,
      rawAmountIn: number,
      swapInDirection: boolean,
      slippage: number
    ) => Promise<any[]>;
    calcAmountIn: (
      connection: Connection,
      poolKeys: any,
      rawAmountOut: number,
      swapInDirection: boolean,
      slippage: number
    ) => Promise<any[]>;
    findPoolInfoForTokens: (
      liquidityFile: string,
      mintA: string,
      mintB: string
    ) => Promise<any>;
    jsonInfo2PoolKeys: (jsonInfo: any) => any;
    validateAndParsePublicKey: (publicKey: string | PublicKey) => PublicKey;
    notInnerObject: (v: any) => boolean;
    formatAmmKeysById: (connection: Connection, id: string) => Promise<any>;
    getWalletTokenAccount: (
      connection: Connection,
      wallet: PublicKey
    ) => Promise<Array<{ pubkey: PublicKey; programId: PublicKey; accountInfo: any }>>;
  };
}

const config: Config = {
  SOLANA_NODE: "https://api.devnet.solana.com",
  SOLANA_NODE_MAINNET: "https://api.mainnet-beta.solana.com/",
  CALL_SOLANA_SAMPLE_CONTRACT: "0x776E4abe7d73Fed007099518F3aA02C8dDa9baA0",
  CALL_SOLANA_SAMPLE_CONTRACT_MAINNET: "0x5BAB7cAb78D378bBf325705C51ec4649200A311b",
  ICS_FLOW_MAINNET: "0x16906ADb704590F94F8a32ff0a690306A34A0bfC",
  VAULTCRAFT_FLOW_MAINNET: "0xBD8bAFA0b09920b2933dd0eD044f27B10B20F265",
  DATA: {
    // ... rest of the DATA object remains the same
    // (would continue with the same structure but with proper typing)
  },
  initialize: {
    initRaydiumSDK: async function (params: { loadToken?: boolean }, payer: string) {
      const owner = new web3.PublicKey(payer);
      const connection = new Connection(clusterApiUrl("devnet"));
      const txVersion = TxVersion.LEGACY;
      let raydium: Raydium;

      raydium = await Raydium.load({
        owner,
        connection,
        cluster: "devnet",
        disableFeatureCheck: true,
        disableLoadToken: !(params && params.loadToken),
        blockhashCommitment: "finalized",
      });
      return { raydium, txVersion };
    }
  },
  utils: {
    // ... continue with typed implementations
  },
  orcaHelper: {
    // ... continue with typed implementations
  },
  raydiumHelper: {
    // ... continue with typed implementations
  }
};

export { config };