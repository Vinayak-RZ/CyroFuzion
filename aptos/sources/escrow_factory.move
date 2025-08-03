module escrow::escrow_factory {
    use escrow::escrow::{create_escrow};
    use aptos_framework::coin;
    use std::signer;

    public entry fun create_escrow_instance<T>(
        maker: &signer,
        amount: u64,
        hashlock: vector<u8>,
        timelock: u64
    ) {
        create_escrow<T>(maker, amount, hashlock, timelock)
    }
}
