import {
    AccountId,
    PrivateKey,
    Client,
    Hbar,
    TokenCreateTransaction,
    TokenSupplyType,
    TokenType,
    TokenAssociateTransaction,
    TransferTransaction,
    AccountBalanceQuery,
} from "@hashgraph/sdk";

import dotenv from "dotenv";

dotenv.config({ path: '../.env' });

async function main() {
    if (process.env.OPERATOR_ID == null || process.env.OPERATOR_KEY == null) {
        throw new Error(
            "Environment variables OPERATOR_ID, and OPERATOR_KEY are required."
        );
    }
    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromString(process.env.OPERATOR_KEY);

    const account1Id = AccountId.fromString(process.env.ACCOUNT1_ID);
    const account1Key = PrivateKey.fromString(process.env.ACCOUNT1_KEY);

    const account2Id = AccountId.fromString(process.env.ACCOUNT2_ID);
    const account2Key = PrivateKey.fromString(process.env.ACCOUNT2_KEY);

    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);

    /**
     * Step 1
     *
     * Create a fungible HTS token using the Hedera Token Service
     */
    const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName("South African Rand Token")
        .setTokenSymbol("hZAR")
        .setTokenType(TokenType.FungibleCommon)
        .setTreasuryAccountId(account1Id)
        // .setAdminKey(operatorId)         // not set for fixed supply (immutable)
        // .setSupplyKey(operatorId)        // not set for fixed supply (immutable)
        .setInitialSupply(1000)
        .setMaxSupply(1000)
        .setSupplyType(TokenSupplyType.Finite)
        .setDecimals(2)
        .setAutoRenewAccountId(operatorId)
        .freezeWith(client);

    // Sign the transaction with the treasure key
    let tokenCreateTxSign = await tokenCreateTx.sign(account1Key);

    // Submit the transaction to the Hedera network
    let tokenCreateSubmit = await tokenCreateTxSign.execute(client);

    // Get transaction receipt information
    let tokenCreateRx = await tokenCreateSubmit.getReceipt(client);
    let tokenId = tokenCreateRx.tokenId;
    console.log(`Created token with token id: ${tokenId.toString()}`);

    /**
     * Associte token with ACCOUNT_2
     * 
     */
    //Associate a token to an account and freeze the unsigned transaction for signing
    const transaction = await new TokenAssociateTransaction()
        .setAccountId(account2Id)
        .setTokenIds([tokenId])
        .freezeWith(client);

    //Sign with the private key of the account that is being associated to a token 
    const signTx = await transaction.sign(account2Key);

    //Submit the transaction to a Hedera network    
    const txResponse = await signTx.execute(client);

    //Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    //Get the transaction consensus status
    const transactionStatus = receipt.status;

    console.log("The transaction consensus status " + transactionStatus.toString());

    /**
     * Step 3
     *
     *  send 150 tokens to Accounts2, making it an atomic swap against 10 HBar.
     */
    let atomicSwap = await new TransferTransaction()
        .addHbarTransfer(account1Id, new Hbar(10))
        .addHbarTransfer(account2Id, new Hbar(-10))
        .addTokenTransfer(tokenId, account1Id, -150)
        .addTokenTransfer(tokenId, account2Id, 150)
        .freezeWith(client);

    // Sign the transaction with the account1 AND account2 key
    let atomicSwapTxSign = await(await atomicSwap.sign(account1Key)).sign(account2Key);

    // Submit the transaction to the Hedera network
    let atomicSwapSubmit = await atomicSwapTxSign.execute(client);

    // Get transaction receipt information
    await atomicSwapSubmit.getReceipt(client);

    /**
     * Step 4
     *
     * Print balance
     */
    const accountBalanceAcc1 = await new AccountBalanceQuery()
        .setAccountId(account1Id)
        .execute(client);

    const accountBalanceAcc2 = await new AccountBalanceQuery()
        .setAccountId(account2Id)
        .execute(client);

    let tokenBalanceAccountId1 = accountBalanceAcc1.tokens._map
        .get(tokenId.toString())
        .toInt();

    let tokenBalanceAccountId2 = accountBalanceAcc2.tokens._map
        .get(tokenId.toString())
        .toInt();

    console.log(`Account 1 Balance: ${tokenBalanceAccountId1} hZAR / ${accountBalanceAcc1.hbars.toString()} ℏ`);
    console.log(`Account 2 Balance: ${tokenBalanceAccountId2} hZAR / ${accountBalanceAcc2.hbars.toString()} ℏ`);

    process.exit();
}

void main();
