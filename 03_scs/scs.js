import {
    AccountId,
    Wallet,
    LocalProvider,
    ContractCreateFlow,
    ContractDeleteTransaction,
    ContractFunctionParameters,
    ContractCallQuery,
    Hbar,
    PrivateKey,
} from "@hashgraph/sdk";

import dotenv from "dotenv";

dotenv.config({ path: '../.env' });

// Import the compiled contract
import cc1 from "./CertificationC1.json" assert { type: "json" };

async function main() {
    if (process.env.ACCOUNT1_ID == null || process.env.ACCOUNT1_KEY == null) {
        throw new Error(
            "Environment variables ACCOUNT1_ID, and ACCOUNT1_KEY are required."
        );
    }
    const walletAcc1 = new Wallet(
        process.env.ACCOUNT1_ID,
        process.env.ACCOUNT1_KEY,
        new LocalProvider()
    );

    const contractByteCode = cc1.bytecode;

    const contractTransactionResponse = await new ContractCreateFlow()
        .setBytecode(contractByteCode)
        .setMaxChunks(30)
        .setGas(8_000_000)
        .setAdminKey(walletAcc1.getAccountKey())
        .executeWithSigner(walletAcc1);

    // const contractTransactionResponse = await transaction.executeWithSigner(
    //     walletAcc1
    // );

    // Fetch the receipt for the transaction that created the contract
    const contractReceipt =
        await contractTransactionResponse.getReceiptWithSigner(walletAcc1);

    // The conract ID is located on the transaction receipt
    const contractId = contractReceipt.contractId;

    console.log(`new contract ID: ${contractId.toString()}`);

    try {

    // Call a method on a contract that exists on Hedera
    // Note: `ContractCallQuery` cannot mutate a contract, it will only return the last state
    // of the contract
    const contractCallResult = await new ContractCallQuery()
        // Set the gas to execute a contract call
        .setGas(75000)
        // Set which contract
        .setContractId(contractId)
        // Set the function to call on the contract
        .setFunction("function1", new ContractFunctionParameters().addInt32(5).addInt32(6))
        .setQueryPayment(new Hbar(1))
        .executeWithSigner(walletAcc1);

    if (
        contractCallResult.errorMessage != null &&
        contractCallResult.errorMessage != ""
    ) {
        console.log(
            `error calling contract: ${contractCallResult.errorMessage}`
        );
    }

    // Get the message from the result
    // The `0` is the index to fetch a particular type from
    //
    // e.g.
    // If the return type of `get_message` was `(string[], uint32, string)`
    // then you'd need to get each field separately using:
    //      const stringArray = contractCallResult.getStringArray(0);
    //      const uint32 = contractCallResult.getUint32(1);
    //      const string = contractCallResult.getString(2);
    const message = contractCallResult.getString(0);
    console.log(`contract message: ${message}`);

    } 
    catch(err) {
        console.error(err);
        
        let transaction = await new ContractDeleteTransaction()
            .setContractId(contractId)
            .setTransferAccountId(walletAcc1.accountId)
            .freezeWithSigner(walletAcc1);
        transaction = await transaction.signWithSigner(walletAcc1);
        const contractDeleteResult = await transaction.executeWithSigner(walletAcc1);

        // Delete the contract
        // Note: The admin key of the contract needs to sign the transaction
        // In this case the client operator is the same as the admin key so the
        // automatic signing takes care of this for you
        await contractDeleteResult.getReceiptWithSigner(walletAcc1);

        console.log("contract successfully deleted");

        process.exit();
    }
}

void main();
