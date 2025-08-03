module escrow::escrow {
    use std::signer;
    use std::vector;
    use aptos_framework::event;
    use aptos_framework::coin::{Self, Coin, withdraw, deposit, value};
    use aptos_framework::timestamp;
    use aptos_std::table::{Self, Table};

    const E_ALREADY_CLAIMED: u64 = 1;
    const E_ALREADY_REFUNDED: u64 = 2;
    const E_INVALID_SECRET: u64 = 3;
    const E_TIMELOCK_NOT_EXPIRED: u64 = 4;
    const E_NOT_MAKER: u64 = 5;

    struct EscrowData<phantom T> has store {
        maker: address,
        asset: Coin<T>,
        hashlock: vector<u8>,
        timelock: u64,
        claimed: bool,
        refunded: bool,
    }

    struct EscrowStore<phantom T> has key {
        escrows: Table<u64, EscrowData<T>>,
        next_id: u64,
    }

    #[event]
    struct EscrowCreated has drop, store {
        escrow_id: u64,
        maker: address,
        amount: u64,
        hashlock: vector<u8>,
        timelock: u64,
    }

    #[event]
    struct EscrowClaimed has drop, store {
        escrow_id: u64,
        claimer: address,
    }

    #[event]
    struct EscrowRefunded has drop, store {
        escrow_id: u64,
        maker: address,
    }

    public entry fun init_store<T>(account: &signer) {
        if (!exists<EscrowStore<T>>(signer::address_of(account))) {
            move_to(account, EscrowStore<T> {
                escrows: Table::new(),
                next_id: 0,
            });
        }
    }

    public entry fun create_escrow<T>(
    maker: &signer,
    amount: u64,
    hashlock: vector<u8>,
    timelock_seconds: u64,
) acquires EscrowStore {
    let maker_addr = signer::address_of(maker);

    if (!exists<EscrowStore<T>>(maker_addr)) {
        init_store<T>(maker);
    }; // ✅ don't forget this semicolon here

    let store = borrow_global_mut<EscrowStore<T>>(maker_addr); // ✅ now valid

    let escrow_id = store.next_id;
    store.next_id = escrow_id + 1;

    let asset = withdraw<T>(maker, amount);
    let timelock = timestamp::now_seconds() + timelock_seconds;

    let escrow = EscrowData {
        maker: maker_addr,
        asset,
        hashlock,
        timelock,
        claimed: false,
        refunded: false,
    };

    Table::add(&mut store.escrows, escrow_id, escrow);

    event::emit(EscrowCreated {
        escrow_id,
        maker: maker_addr,
        amount,
        hashlock,
        timelock,
    });
}


    public entry fun claim<T>(
        claimer: &signer,
        maker_addr: address,
        escrow_id: u64,
        secret: vector<u8>
    ) acquires EscrowStore {
        let store = borrow_global_mut<EscrowStore<T>>(maker_addr);
        let escrow = Table::remove(&mut store.escrows, escrow_id);

        assert!(!escrow.claimed, E_ALREADY_CLAIMED);
        assert!(!escrow.refunded, E_ALREADY_REFUNDED);
        assert!(escrow.hashlock == secret, E_INVALID_SECRET);

        let claimer_addr = signer::address_of(claimer);
        deposit<T>(claimer_addr, escrow.asset);

        event::emit(EscrowClaimed {
            escrow_id,
            claimer: claimer_addr,
        });
    }

    public entry fun refund<T>(
        maker: &signer,
        escrow_id: u64
    ) acquires EscrowStore {
        let maker_addr = signer::address_of(maker);
        let store = borrow_global_mut<EscrowStore<T>>(maker_addr);
        let escrow = Table::remove(&mut store.escrows, escrow_id);

        assert!(!escrow.claimed && !escrow.refunded, E_ALREADY_REFUNDED);
        assert!(timestamp::now_seconds() >= escrow.timelock, E_TIMELOCK_NOT_EXPIRED);
        assert!(escrow.maker == maker_addr, E_NOT_MAKER);

        deposit<T>(maker_addr, escrow.asset);

        event::emit(EscrowRefunded {
            escrow_id,
            maker: maker_addr,
        });
    }
}
