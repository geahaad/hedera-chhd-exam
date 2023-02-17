import {
    TransferTransaction,
    ScheduleInfoQuery,
    Client,
    ScheduleSignTransaction,
    Timestamp,
    Wallet,
    LocalProvider,
    PrivateKey,
    AccountId,
    ScheduleDeleteTransaction,
    ScheduleCreateTransaction,
    ScheduleId,
} from "@hashgraph/sdk";

import dotenv from "dotenv";

dotenv.config({ path: '../.env' });

async function main() {
    if (process.env.ACCOUNT1_ID == null || process.env.ACCOUNT1_KEY == null) {
        throw new Error(
            "Environment variables ACCOUNT1_ID, and ACCOUNT1_KEY are required."
        );
    }

    const wallet = new Wallet(
        process.env.ACCOUNT1_ID,
        process.env.ACCOUNT1_KEY,
        new LocalProvider()
    );
    
    const account1Id = AccountId.fromString(process.env.ACCOUNT1_ID);
    const account1Key = PrivateKey.fromString(process.env.ACCOUNT1_KEY);
    const account2Id = AccountId.fromString(process.env.ACCOUNT2_ID);
    const account2Key = PrivateKey.fromString(process.env.ACCOUNT2_KEY);

    const client = Client.forTestnet();
    client.setOperator(account1Id, account1Key);

    /**
     * Create Scheduled TX
     */

    let transaction = await new TransferTransaction()
        .addHbarTransfer(account2Id, 2)
        .addHbarTransfer(wallet.getAccountId(), -2);

    const scheduleTransaction = await new ScheduleCreateTransaction()
        .setScheduledTransaction(transaction)
        .setAdminKey(account1Key)
        .setScheduleMemo(`run#${Timestamp.generate().seconds}`)
        // Set expiration time to be now + 24 hours
        .setExpirationTime(
            Timestamp.generate().plusNanos(24 * 60 * 60 * 1000000000)
        )
        .execute(client);
    
    //Get the receipt of the transaction
    let scheduleReceipt = await scheduleTransaction.getReceipt(client);

    //Get the schedule ID
    const scheduleId = scheduleReceipt.scheduleId;
    console.log("The schedule ID is " + scheduleId);

    //Get the scheduled transaction ID
    const scheduledTxId = scheduleReceipt.scheduledTransactionId;
    console.log("The scheduled transaction ID is " +scheduledTxId);

    /**
     * Query Info
     */

    //Create the query
    const query = new ScheduleInfoQuery().setScheduleId(scheduleId);

    // Sign with the client operator private key and submit the query request to a node in a Hedera network
    const info = await query.execute(client);
    console.log("The scheduledId you queried for is: ", new ScheduleId(info.scheduleId).toString());
    console.log("The memo for it is: ", info.scheduleMemo);
    console.log("It got created by: ", new AccountId(info.creatorAccountId).toString());
    console.log("It got payed by: ", new AccountId(info.payerAccountId).toString());
    console.log("The expiration time of the scheduled tx is: ", new Timestamp(info.expirationTime).toDate());

    /**
     * Delete scheduled TX
     */
    //Create the transaction and sign with the admin key
    const cancelTransaction = await new ScheduleDeleteTransaction()
        .setScheduleId(scheduleId)
        .freezeWith(client)
        .sign(account1Key);

    //Sign with the operator key and submit to a Hedera network
    const cancelTxResponse = await cancelTransaction.execute(client);

    //Get the transaction receipt
    const cancelReceipt = await cancelTxResponse.getReceipt(client);

    //Get the transaction status
    const cancelTxStatus = cancelReceipt.status;
    console.log("The transaction consensus status is " + cancelTxStatus);


    process.exit();
}

void main();
