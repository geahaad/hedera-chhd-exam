import {
    Client,
    PrivateKey,
    AccountId,
    Timestamp,
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";

import dotenv from "dotenv";

dotenv.config({ path: '../.env' });

async function main() {
    const account1Id = AccountId.fromString(process.env.ACCOUNT1_ID);
    const account1Key = PrivateKey.fromString(process.env.ACCOUNT1_KEY);
    const account2Id = AccountId.fromString(process.env.ACCOUNT2_ID);
    const account2Key = PrivateKey.fromString(process.env.ACCOUNT2_KEY);
    const account3Id = AccountId.fromString(process.env.ACCOUNT3_ID);
    const account3Key = PrivateKey.fromString(process.env.ACCOUNT3_KEY);

    const client = Client.forTestnet();
    client.setOperator(account1Id, account1Key);

    const clientAcc2 = Client.forTestnet();
    clientAcc2.setOperator(account2Id, account2Key);

    const clientAcc3 = Client.forTestnet();
    clientAcc3.setOperator(account3Id, account3Key);

    /**
     * Create topic
     */
    const response = await new TopicCreateTransaction()
        .setTopicMemo(`gd-chhd-${Timestamp.generate().seconds}`)
        // .setAdminKey(account1Key)    // Do not set to make immutable
        .setSubmitKey(account2Key)      // Only Account 2 can submit messages
        .execute(client);

    const receipt = await response.getReceipt(client);
    const topicId = receipt.topicId;

    console.log(`topicId = ${topicId.toString()}`);

    // Wait 5 seconds between consensus topic creation and subscription
    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log('-----------------------------------');
    /**
     * Submit message
     */
    let messageTxFails = await new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(`Today is ${Date().toString()}`);

    try {
        // account1Key.signTransaction(messageTxFails);
        const failResp = await messageTxFails.execute(clientAcc3);
    } catch (err) {
        console.error(`Expected: TopicMessage submit failed; not authorized: ${err}`);
    }
    console.log('-----------------------------------');

    let messageTxSucceeds = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(`Today is ${Date().toString()}`);

    try {
        // account2Key.signTransaction(messageTxSucceeds);
        const msgResp = await messageTxSucceeds.execute(clientAcc2);
        //Get the receipt of the transaction
        const msgReceipt = await msgResp.getReceipt(clientAcc2);
        //Get the status of the transaction
        const transactionStatus = msgReceipt.status;
        console.log("The message transaction status: " + transactionStatus);
    } catch (err) {
        console.error(err);
    }

    process.exit();
}

void main();
