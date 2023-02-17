import {
    Wallet,
    LocalProvider,
    PrivateKey,
    PublicKey,
    Hbar,
    AccountId,
    AccountBalanceQuery,
    AccountInfoQuery,
    TransferTransaction,
} from "@hashgraph/sdk";

import dotenv from "dotenv";

dotenv.config({ path: '../.env' });

async function main() {
    if (process.env.OPERATOR_ID == null || process.env.OPERATOR_KEY == null) {
        throw new Error(
            "Environment variables OPERATOR_ID, and OPERATOR_KEY are required."
        );
    }

    const wallet = new Wallet(
        process.env.OPERATOR_ID,
        process.env.OPERATOR_KEY,
        new LocalProvider()
    );
    
    for (let index = 0; index < 5; index++) {
        console.log(`"Ceating" new account #${index+1}`);
        const privateKey = PrivateKey.generateED25519();
        const publicKey = privateKey.publicKey;

        // Assuming that the target shard and realm are known.
        // For now they are virtually always 0 and 0.
        const aliasAccountId = publicKey.toAccountId(0, 0);

        console.log(`New account ID: ${aliasAccountId.toString()}`);
        console.log(`Corresponding aliasKey: ${aliasAccountId.aliasKey.toString()}`);
        console.log(`Corresponding privateKey: ${privateKey}`);

        console.log("Funding the new account");
        let transaction = await new TransferTransaction()
            .addHbarTransfer(wallet.getAccountId(), new Hbar(500).negated())
            .addHbarTransfer(aliasAccountId, new Hbar(500))
            .freezeWithSigner(wallet);
        transaction = await transaction.signWithSigner(wallet);

        const response = await transaction.executeWithSigner(wallet);
        await response.getReceiptWithSigner(wallet);
    
        const balance = await new AccountBalanceQuery()
            .setNodeAccountIds([response.nodeId])
            .setAccountId(aliasAccountId)
            .executeWithSigner(wallet);
    
        console.log(`Balances of the new account: ${balance.toString()}`);

        const info = await new AccountInfoQuery()
            .setNodeAccountIds([response.nodeId])
            .setAccountId(aliasAccountId)
            .executeWithSigner(wallet);

        console.log(`Info about the new account: ${info.toString()}`);
        console.log(`The normal account ID: ${info.accountId.toString()}`);
        console.log(`The alias key: ${info.aliasKey.toString()}`);
        console.log("--------------------------------------------------------");    
    }
}

void main();
