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

    console.log("Funding the acc1");
    let transaction = await new TransferTransaction()
        .addHbarTransfer(wallet.getAccountId(), new Hbar(1000).negated())
        .addHbarTransfer(process.env.ACCOUNT1_ID, new Hbar(1000))
        .freezeWithSigner(wallet);
    transaction = await transaction.signWithSigner(wallet);

    const response = await transaction.executeWithSigner(wallet);
    await response.getReceiptWithSigner(wallet);
    
    const balance = await new AccountBalanceQuery()
        .setNodeAccountIds([response.nodeId])
        .setAccountId(process.env.ACCOUNT1_ID)
        .executeWithSigner(wallet);

    console.log(`Balances of the acc1: ${balance.toString()}`);
}

void main();
