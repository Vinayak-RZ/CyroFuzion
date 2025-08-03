use starknet::ContractAddress;
use starknet::ClassHash;

#[starknet::interface]
trait IEscrowFactory<TContractState> {
    fn set_escrow_class_hash(ref self: TContractState, class_hash: ClassHash);
    fn deploy_escrow(
        ref self: TContractState,
        maker: felt252,
        resolver: felt252,
        token: felt252,
        amount: u256,
        hashlock: felt252,
        timelock_a: felt252,
        timelock_b: felt252,
    ) -> ContractAddress;
    fn get_escrow_by_index(self: @TContractState, index: felt252) -> ContractAddress;
    fn get_escrow_count(self: @TContractState) -> felt252;
}

#[starknet::contract]
mod EscrowFactory {
    use starknet::ContractAddress;
    use starknet::ClassHash;
    use starknet::syscalls::deploy_syscall;
    use starknet::SyscallResultTrait;
    use starknet::storage::{
        Map, StoragePointerReadAccess, StoragePointerWriteAccess, StorageMapReadAccess,
        StorageMapWriteAccess
    };

    #[storage]
    struct Storage {
        escrow_count: felt252,
        escrows: Map<felt252, ContractAddress>,
        escrow_class_hash: ClassHash,
    }

    #[abi(embed_v0)]
    impl EscrowFactoryImpl of super::IEscrowFactory<ContractState> {
        fn set_escrow_class_hash(ref self: ContractState, class_hash: ClassHash) {
            self.escrow_class_hash.write(class_hash);
        }

        fn deploy_escrow(
            ref self: ContractState,
            maker: felt252,
            resolver: felt252,
            token: felt252,
            amount: u256,
            hashlock: felt252,
            timelock_a: felt252,
            timelock_b: felt252,
        ) -> ContractAddress {
            let mut calldata: Array<felt252> = array![];

            calldata.append(maker);
            calldata.append(resolver);
            calldata.append(token);
            calldata.append(amount.low.into());
            calldata.append(amount.high.into());
            calldata.append(hashlock);
            calldata.append(timelock_a);
            calldata.append(timelock_b);

            let class_hash = self.escrow_class_hash.read();
            let (address, _) = deploy_syscall(
                class_hash,
                0, // salt
                calldata.span(),
                false // deploy_from_zero
            ).unwrap_syscall();

            let count = self.escrow_count.read();
            self.escrows.write(count, address);
            self.escrow_count.write(count + 1);

            address
        }

        fn get_escrow_by_index(self: @ContractState, index: felt252) -> ContractAddress {
            self.escrows.read(index)
        }

        fn get_escrow_count(self: @ContractState) -> felt252 {
            self.escrow_count.read()
        }
    }
}