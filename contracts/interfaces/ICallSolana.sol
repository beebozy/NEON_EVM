// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface ICallSolana {
    struct Instruction {
        bytes32 program_id;
        AccountMeta[] accounts;
        bytes instruction_data;
    }

    struct AccountMeta {
        bytes32 account;
        bool is_signer;
        bool is_writable;
    }

    // Returns Solana address for Neon address.
    // Calculates as PDA([ACCOUNT_SEED_VERSION, Neon-address], evm_loader_id)
    function getNeonAddress(address) external view returns (bytes32);
    
    
    // Returns Solana address of resource for contracts.
    // Calculates as PDA([ACCONT_SEED_VERSION, "ContractData", msg.sender, salt], evm_loader_id)
    function getResourceAddress(bytes32 salt) external view returns (bytes32);
    
    
    // Creates resource with specified salt.
    // Return the Solana address of the created resource (see `getResourceAddress`)
    function createResource(bytes32 salt, uint64 space, uint64 lamports, bytes32 owner) external returns (bytes32);
    
    
    // Returns Solana PDA generated from specified program_id and seeds
    function getSolanaPDA(bytes32 program_id, bytes memory seeds) external view returns (bytes32);
    
    
    // Returns Solana address of the external authority.
    // Calculates as PDA([ACCOUNT_SEED_VERSION, "AUTH", msg.sender, salt], evm_loader_id)
    function getExtAuthority(bytes32 salt) external view returns (bytes32); // delegatePDA
    
    
    // Return Solana address for payer account (if instruction required some account to funding new created accounts)
    // Calculates as PDA([ACCOUNT_SEED_VERSION, "PAYER", msg.sender], evm_loader_id)
    function getPayer() external view returns (bytes32);


    // Execute the instruction with a call to the Solana program.
    // Guarantees successful execution of call after a success return.
    // Note: If the call was unsuccessful, the transaction fails (due to Solana's behaviour).
    // The `lamports` parameter specifies the amount of lamports that can be required to create new accounts during execution.
    //   This lamports transferred to `payer`-account (see `getPayer()` function) before the call.
    // - `instruction` - instruction which should be executed
    // This method uses PDA for sender to authorize the operation (`getNeonAddress(msg.sender)`)
    // Returns the returned data of the executed instruction (if program returned the data is equal to the program_id of the instruction)
    function execute(uint64 lamports, Instruction memory instruction) external returns (bytes memory);


    // Execute the instruction with call to the Solana program.
    // Guarantees successful execution of call after a success return.
    // Note: If the call was unsuccessful, the transaction fails (due to Solana's behaviour).
    // The `lamports` parameter specifies the amount of lamports that can be required to create new accounts during execution.
    //   This lamports transferred to `payer`-account (see `getPayer()` function) before the call.
    // - `salt` - the salt to generate an address of external authority (see `getExtAuthority()` function)
    // - `instruction` - instruction which should be executed
    // This method uses external authority to authorize the operation (`getExtAuthority(salt)`)
    // Returns the returned data of the executed instruction (if program returned the data is equal to the program_id of the instruction)
    function executeWithSeed(uint64 lamports, bytes32 salt, Instruction memory instruction) external returns (bytes memory);
    
    
    // Execute the instruction with a call to the Solana program.
    // Guarantees successful execution of call after a success return.
    // Note: If the call was unsuccessful, the transaction fails (due to Solana's behaviour).
    // The `lamports` parameter specifies the amount of lamports that can be required to create new accounts during execution.
    //   This lamports transferred to `payer`-account (see `getPayer()` function) before the call.
    // - `instruction` - bincode serialized instruction which should be executed
    // This method uses PDA for sender to authorize the operation (`getNeonAddress(msg.sender)`)
    // Returns the returned data of the executed instruction (if program returned the data is equal to the program_id of the instruction)
    function execute(uint64 lamports, bytes memory instruction) external returns (bytes memory);
    
    
    // Execute the instruction with call to the Solana program.
    // Guarantees successful execution of call after a success return.
    // Note: If the call was unsuccessful, the transaction fails (due to Solana's behaviour).
    // The `lamports` parameter specifies the amount of lamports that can be required to create new accounts during execution.
    //   This lamports transferred to `payer`-account (see `getPayer()` function) before the call.
    // - `salt` - the salt to generate an address of external authority (see `getExtAuthority()` function)
    // - `instruction` - bincode serialized instruction which should be executed
    // This method uses external authority to authorize the operation (`getExtAuthority(salt)`)
    // Returns the returned data of the executed instruction (if program returned the data is equal to the program_id of the instruction)
    function executeWithSeed(uint64 lamports, bytes32 salt, bytes memory instruction) external returns (bytes memory);


    // Returns the program_id and returned data of the last executed instruction (if no return data was set returns zeroed bytes)
    // For more information see: https://docs.rs/solana-program/latest/solana_program/program/fn.get_return_data.html
    // Note: This method should be called after a call to `execute`/`executeWithSeed` methods
    function getReturnData() external view returns (bytes32, bytes memory);
}
    
    

