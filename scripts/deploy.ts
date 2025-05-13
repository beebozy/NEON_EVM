import { ethers } from "hardhat";
import * as web3 from "@solana/web3.js";
import bs58 from "bs58";
import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
//import config from "./config";
import { config } from "./config";
import dotenv from "dotenv";
dotenv.config();

async function main() {
    const SOLANA_NODE: string = config.SOLANA_NODE;
    const DEVNET_ERC20ForSPL_FACTORY: string = "0xF6b17787154C418d5773Ea22Afc87A95CAA3e957";

    const connection = new web3.Connection(SOLANA_NODE, "processed");

    const keypair = web3.Keypair.fromSecretKey(
        bs58.decode(process.env.PRIVATE_KEY_SOLANA || "")
    );

    const [user1] = await ethers.getSigners();

    const ERC20ForSplFactoryContract = await ethers.getContractFactory("ERC20ForSplFactory");
    const ERC20ForSplMintableContract = await ethers.getContractFactory("ERC20ForSplMintable");
    const ERC20ForSplFactory = ERC20ForSplFactoryContract.attach(DEVNET_ERC20ForSPL_FACTORY);

    const tx1 = await ERC20ForSplFactory.createErc20ForSplMintable(
        "myBOOTCAMP TOKEN " + Date.now().toString(),
        "mBT",
        9,
        user1.address
    );
    await tx1.wait(1);

    const lastIndex = parseInt((await ERC20ForSplFactory.allErc20ForSplLength()).toString()) - 1;
    const ERC20ForSPLMintableAddress = await ERC20ForSplFactory.allErc20ForSpl(lastIndex);

    const ERC20ForSplMintable = ERC20ForSplMintableContract.attach(ERC20ForSPLMintableAddress);
    console.log(ERC20ForSplMintable.target, "ERC20ForSPLMintableAddress");

    const tokenMint: string = await ERC20ForSplMintable.tokenMint();
    console.log(tokenMint, "tokenMint");

    const tx2 = await ERC20ForSplMintable.mint(user1.address, 1000 * 10 ** 9);
    await tx2.wait(1);

    // Deploy the Composability contract
    const TestDevBootcamp = await ethers.deployContract("TestDevBootcamp", [ERC20ForSplMintable.target]);
    await TestDevBootcamp.waitForDeployment();
    console.log(`TestDevBootcamp deployed to ${TestDevBootcamp.target}`);

    const contractPublicKey = ethers.encodeBase58(await TestDevBootcamp.getNeonAddress(TestDevBootcamp.target));
    console.log(contractPublicKey, "contractPublicKey");

    const randomSolanaAccount = web3.Keypair.generate();

    const senderATA = await getAssociatedTokenAddress(
        new web3.PublicKey(ethers.encodeBase58(tokenMint)),
        new web3.PublicKey(contractPublicKey),
        true
    );
    console.log(senderATA.toBase58(), "senderATA");

    const recipientATA = await getAssociatedTokenAddress(
        new web3.PublicKey(ethers.encodeBase58(tokenMint)),
        randomSolanaAccount.publicKey,
        true
    );
    console.log(recipientATA.toBase58(), "recipientATA");

    const solanaTx = new web3.Transaction().add(
        createAssociatedTokenAccountInstruction(
            keypair.publicKey,
            senderATA,
            new web3.PublicKey(contractPublicKey),
            new web3.PublicKey(ethers.encodeBase58(tokenMint))
        ),
        createAssociatedTokenAccountInstruction(
            keypair.publicKey,
            recipientATA,
            randomSolanaAccount.publicKey,
            new web3.PublicKey(ethers.encodeBase58(tokenMint))
        )
    );

    const signature = await web3.sendAndConfirmTransaction(
        connection,
        solanaTx,
        [keypair]
    );
    console.log(signature, "transaction sender & recipient ATA's creation");

    const amount = 10 * 10 ** 9;
    const tx3 = await ERC20ForSplMintable.approve(TestDevBootcamp.target, amount);
    await tx3.wait(1);
    console.log(tx3.hash, "erc20forspl approve");

    const new_amount = 2 * 10 ** 9
    const tx4 = await TestDevBootcamp.transfer(
        amount,
       // config.utils.publicKeyToBytes32(randomSolanaAccount.publicKey.toBase58()),
        // FbcyK62bgPP78nLfeVkjVN12hZrYMgk6duwCgPWjMcD6
        "0x" + Buffer.from(bs58.decode(randomSolanaAccount.publicKey.toBase58())).toString("hex")
);
        //    config.utils.publicKeyToBytes32(randomSolanaAccount.publicKey.toBase58())
        

    await tx4.wait(1);
    console.log(tx4.hash, "TestDevBootcamp transfer");

    
    // const signature2 = await web3.sendAndConfirmTransaction(
    //     connection,
    //     solanaTx,
    //     [keypair]
    // );
    // console.log(signature2, "another transaction");


    // const tx5 = await TestDevBootcamp.transferFromSolana(
    //    // config.utils.publicKeyToBytes32(randomSolanaAccount.publicKey.toBase58()),
    // //    FbcyK62bgPP78nLfeVkjVN12hZrYMgk6duwCgPWjMcD6,
    // "0x" + Buffer.from(bs58.decode(randomSolanaAccount.publicKey.toBase58())).toString("hex"),
    //     user1.address,
    //     new_amount
    // );

    // await tx5.wait(1);

    // console.log(tx5.hash,"Transfer from solana account to eV")


    const ata = await TestDevBootcamp.getUserATA(user1.address);
    console.log("ATA from contract:", ata);
    

    

    
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

