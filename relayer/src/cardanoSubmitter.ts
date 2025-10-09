// submit a cardano txn to lock tokens in a plutus script, using the order details provided by ethereum
// connect to cardano using lucid or cardano-cli
// prepare a txn that sends token to a plutus contract and embeds the hashlock, timelock and ethereum order metadata in the datum
// submit the txn on chain, this acts as the cardano side escrow

// parse order details
// construct the cardano txn -- sdk based using plutus
// configure deadlines -- convert ethereum side timelock into cardano compatible posixtime and include in the datum
// handle errors and confirmations


import type { FusionOrder } from './utils/config.js';
import { Lucid, Blockfrost, Data, TxHash, Constr } from 'lucid-cardano';

export async function submitOrderToCardano(order: FusionOrder): Promise<TxHash> {
    console.log('Received order in Cardano submitter:', order);

    const lucid = await Lucid.new(
        new Blockfrost(process.env.BLOCKFROST_URL!, process.env.BLOCKFROST_API_KEY!),
        'Preview' // or 'Mainnet'
    );

    lucid.selectWalletFromSeed(process.env.CARDANO_SEED!); // or use wallet extension/API

    // Construct datum (e.g., hashlock, timelock)
    const datum = Data.to(
        new Constr(0, [
            order.secretHash,              // string, hex like '0xabc123...'
            BigInt(order.auctionStart),    // Integer
            BigInt(order.amount),          // Integer
        ])
    );

    const tx = await lucid
        .newTx()
        .payToContract(
            process.env.PLUTUS_SCRIPT_ADDRESS!,
            { inline: datum },
            { lovelace: BigInt(order.amount) }
        )
        .complete();

    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();

    console.log('Submitted Cardano escrow tx:', txHash);
    return txHash;
}

// can use queue like bullmq to enqueue orders and process them with retry logic
// deduplicate orders using orderId