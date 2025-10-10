// entry point for our backend relayer service
// its job is to listen for the new fusion+ orders on the ethereum side (via event logs or polling)
// verify and track them (check hashlock, timelock, etc)
// trigger actions on cardano side (submit the matching txn to a plutus script)
