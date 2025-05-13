// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import { IERC20ForSPL } from './interfaces/IERC20ForSPL.sol';
import { ICallSolana } from './interfaces/ICallSolana.sol';
import { CallSolanaHelperLib } from './CallSolanaHelperLib.sol';
import { SolanaDataConverterLib } from "./SolanaDataConverterLib.sol";

contract TestDevBootcamp {
    ICallSolana public constant CALL_SOLANA = ICallSolana(0xFF00000000000000000000000000000000000006);
    bytes32 public constant TOKEN_PROGRAM = 0x06ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9;
    bytes32 public constant ASSOCIATED_TOKEN_PROGRAM = 0x8c97258f4e2489f1bb3d1029148e0d830b5a1399daff1084048e7bd8dbe9f859;
    address public immutable token;

    constructor(address _token) {
        token = _token;
    }

    function getNeonAddress(address evm_address) public view returns(bytes32) {
        return CALL_SOLANA.getNeonAddress(evm_address);
    }


    /**
     * @notice Transfers tokens from the contract’s EVM balance to a Solana recipient
     * @dev Moves tokens from sender to contract, then to its ATA, and finally to a Solana account via a CPI call
     * @param amount The number of tokens to transfer
     * @param receiver The recipient's Solana address in bytes32 format
     */

    function transfer(uint64 amount, bytes32 receiver) external {
        require(amount > 0, 'ERROR: INVALID AMOUNT');

        bytes32 tokenMint = IERC20ForSPL(token).tokenMint();
        bytes32 senderATA = getAssociateTokenAccount(
            CALL_SOLANA.getNeonAddress(address(this)), 
            TOKEN_PROGRAM,
            tokenMint
        );

        bytes32 recipientATA = getAssociateTokenAccount(
            receiver,
            TOKEN_PROGRAM,
            tokenMint
        );

        // transfer the tokens from the user to the contract's arbitrary Token account = owner = Neon EVM Program
        IERC20ForSPL(token).transferFrom(msg.sender, address(this), amount);

        // transfer the tokens from the contract's arbitrary Token account to contract's ATA account
        IERC20ForSPL(token).transferSolana(
            senderATA,
            amount
        );

        // Build the Solana transfer instruction data
        (
            bytes32[] memory accounts,
            bool[] memory isSigner,
            bool[] memory isWritable,
            bytes memory data
        ) = _formatTransferInstruction(
            senderATA, 
            recipientATA, 
            CALL_SOLANA.getNeonAddress(address(this)), 
            amount
        );

        // Format the Solana transfer instruction data
        bytes memory transferInstruction = CallSolanaHelperLib.prepareSolanaInstruction(
            TOKEN_PROGRAM,
            accounts,
            isSigner,
            isWritable,
            data
        );

        // Execute the transfer instruction
        CALL_SOLANA.execute(0, transferInstruction);
    }


// Creating the new composability request aside from the one from the Tutorial 

// This request allows one to transfer from a solana account to 

    /**
     * @notice Transfers tokens from a Solana account to an EVM address via the contract
     * @dev Executes a Solana instruction to transfer tokens from a Solana account to the contract's ATA,
     *      then reflects the transfer on the EVM side to the given recipient.
     * @param solanaSender The Solana address (in bytes32) sending the tokens
     * @param evmRecipient The EVM address receiving the tokens
     * @param amount The amount of tokens to transfer
     */


function transferFromSolana(
    bytes32 solanaSender,
    address evmRecipient,
    uint64 amount
) external {
    require(amount > 0, "ERROR: INVALID AMOUNT");

    bytes32 tokenMint = IERC20ForSPL(token).tokenMint();
    // bytes32 evmRecipientATA = getAssociateTokenAccount(
    //     CALL_SOLANA.getNeonAddress(evmRecipient),
    //     TOKEN_PROGRAM,
    //     tokenMint
    // );

    bytes32 contractATA = getAssociateTokenAccount(
        CALL_SOLANA.getNeonAddress(address(this)),
        TOKEN_PROGRAM,
        tokenMint
    );

    (
        bytes32[] memory accounts,
        bool[] memory isSigner,
        bool[] memory isWritable,
        bytes memory data
    ) = _formatTransferInstruction(
        solanaSender,
        contractATA,
        solanaSender,
        amount
    );

    // Build and execute Solana instruction
    bytes memory instruction = CallSolanaHelperLib.prepareSolanaInstruction(
        TOKEN_PROGRAM,
        accounts,
        isSigner,
        isWritable,
        data
    );

    CALL_SOLANA.execute(0, instruction);

    // Now reflect this on the EVM side
    IERC20ForSPL(token).transfer(evmRecipient, amount);
}


/// @notice Returns the Solana Associated Token Account (ATA) for a given EVM address
/// @param user The EVM address of the user
/// @return The corresponding Solana ATA
function getUserATA(address user) external view returns (bytes32) {
    bytes32 neonAddress = CALL_SOLANA.getNeonAddress(user);
    bytes32 tokenMint = IERC20ForSPL(token).tokenMint();
    return getAssociateTokenAccount(neonAddress, TOKEN_PROGRAM, tokenMint);
}

    /**
     * @notice Computes the Solana PDA for an Associated Token Account (ATA)
     * @dev Uses CALL_SOLANA to compute a PDA for a token account owned by `owner`
     * @param owner The Solana address (bytes32) of the account owner
     * @param programId The Token Program ID (bytes32)
     * @param mint The token mint address (bytes32)
     * @return The computed PDA for the associated token account
     */


    function getAssociateTokenAccount(bytes32 owner, bytes32 programId, bytes32 mint) public view returns(bytes32) {
        return CALL_SOLANA.getSolanaPDA(
            ASSOCIATED_TOKEN_PROGRAM,
            abi.encodePacked(
                owner,
                programId,
                mint
            )
        );
    }

    function _formatTransferInstruction(
        bytes32 senderATA,
        bytes32 recipientATA,
        bytes32 sender,
        uint64 amount
    ) internal pure returns (
        bytes32[] memory accounts,
        bool[] memory isSigner,
        bool[] memory isWritable,
        bytes memory data
    ) {
        accounts = new bytes32[](3);
        accounts[0] = senderATA;
        accounts[1] = recipientATA;
        accounts[2] = sender;

        isSigner = new bool[](3);
        isSigner[0] = false;
        isSigner[1] = false;
        isSigner[2] = true;

        isWritable = new bool[](3);
        isWritable[0] = true;
        isWritable[1] = true;
        isWritable[2] = false;

        // Get amount in right-padded little-endian format
        bytes32 amountLE = bytes32(SolanaDataConverterLib.readLittleEndianUnsigned256(uint256(amount)));
        data = abi.encodePacked(
            bytes1(0x03), // Instruction variant (see: https://github.com/solana-program/token/blob/08aa3ccecb30692bca18d6f927804337de82d5ff/program/src/instruction.rs#L506)
            bytes8(amountLE) // Amount (right-padded little-endian)
        );
    }
}