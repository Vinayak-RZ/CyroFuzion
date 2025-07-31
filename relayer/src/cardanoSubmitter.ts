// submit a cardano txn to lock tokens in a plutus script, using the order details provided by ethereum
// connect to cardano using lucid or cardano-cli
// prepare a txn that sends token to a plutus contract and embeds the hashlock, timelock and ethereum order metadata in the datum
// submit the txn on chain, this acts as the cardano side escrow

// parse order details
// construct the cardano txn -- sdk based using plutus
// configure deadlines -- convert ethereum side timelock into cardano compatible posixtime and include in the datum
// handle errors and confirmations

import { Blockfrost, Lucid } from "lucid-cardano";

const lucid = await Lucid.new(
    new Blockfrost("https://cardano-preview.blockfrost.io/api/v0", "<projectId>"),
    "Preview",
);

const api = await window.cardano.nami.enable