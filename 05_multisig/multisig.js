import {
    Wallet,
    LocalProvider,
    PrivateKey,
    AccountCreateTransaction,
    Hbar,
    AccountId,
    KeyList,
    TransferTransaction,
    AccountBalanceQuery
} from "@hashgraph/sdk";

import dotenv from "dotenv";

dotenv.config({ path: '../.env' });

let user1Key;
let user2Key;

async function main() {

    const account1Id = AccountId.fromString(process.env.ACCOUNT1_ID);
    const account1Key = PrivateKey.fromString(process.env.ACCOUNT1_KEY);
    const account2Id = AccountId.fromString(process.env.ACCOUNT2_ID);
    const account2Key = PrivateKey.fromString(process.env.ACCOUNT2_KEY);
    const account3Id = AccountId.fromString(process.env.ACCOUNT3_ID);
    const account3Key = PrivateKey.fromString(process.env.ACCOUNT3_KEY);
    const account4Id = AccountId.fromString(process.env.ACCOUNT4_ID);

    const wallet = new Wallet(
        process.env.OPERATOR_ID,
        process.env.OPERATOR_KEY,
        new LocalProvider()
    );

    /**
     * Create multi-sig wallet
     */
    const keyList = new KeyList([account1Key, account2Key, account3Key]);

    let transaction = await new AccountCreateTransaction()
        .setInitialBalance(new Hbar(20)) // 5 h
        .setKey(keyList)
        .freezeWithSigner(wallet);
    transaction = await transaction.signWithSigner(wallet);
    const response = await transaction.executeWithSigner(wallet);

    let receipt = await response.getReceiptWithSigner(wallet);
    let multisigAccId = receipt.accountId;

    console.log(`account id = ${multisigAccId.toString()}`);
    console.log('-----------------------------------');

    /**
     * Create tx with missing signatures
     */
    let result;
    try {
        transaction = await new TransferTransaction()
            .setNodeAccountIds([new AccountId(3)])
            .addHbarTransfer(multisigAccId, -10)
            .addHbarTransfer(account4Id, 10)
            .freezeWithSigner(wallet);
        transaction = await transaction.signWithSigner(wallet);

        account1Key.signTransaction(transaction);

        result = await transaction.executeWithSigner(wallet);
        receipt = await result.getReceiptWithSigner(wallet);

        console.log(receipt.status.toString());
    } catch (err) {
        console.error(`Transcation failed due to missing signature set`);
    }

    console.log('-----------------------------------');

    /**
     * Create tx with missing signatures
     */
    transaction = await new TransferTransaction()
        .setNodeAccountIds([new AccountId(3)])
        .addHbarTransfer(receipt.accountId, -10)
        .addHbarTransfer(account4Id, 10)
        .freezeWithSigner(wallet);
    transaction = await transaction.signWithSigner(wallet);

    account1Key.signTransaction(transaction);
    account2Key.signTransaction(transaction);
    account3Key.signTransaction(transaction);

    result = await transaction.executeWithSigner(wallet);
    receipt = await result.getReceiptWithSigner(wallet);
    console.log(receipt.status.toString());

    const balance = await new AccountBalanceQuery()
        .setAccountId(multisigAccId)
        .executeWithSigner(wallet);

    console.log(`Balance of the multisig account: ${balance.toString()}`);
    console.log('-----------------------------------');

    process.exit();
}

void main();
