use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
use core::poseidon::poseidon_hash_span;

#[starknet::interface]
trait IERC20<TContractState> {
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
}

#[starknet::interface]
trait IEscrowInstance<TContractState> {
    fn lock_funds(ref self: TContractState);
    fn redeem(ref self: TContractState, secret: felt252);
    fn cancel(ref self: TContractState);
    fn is_completed_read(self: @TContractState) -> bool;
    fn funds_locked_read(self: @TContractState) -> bool;
    fn get_maker(self: @TContractState) -> ContractAddress;
    fn get_resolver(self: @TContractState) -> ContractAddress;
    fn get_amount(self: @TContractState) -> u256;
}

#[starknet::contract]
mod EscrowInstance {
    use super::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp, get_contract_address};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use core::poseidon::poseidon_hash_span;

    #[storage]
    struct Storage {
        maker: ContractAddress,
        resolver: ContractAddress,
        token_address: ContractAddress,
        amount: u256,
        hashlock: felt252,
        timelock_a: u64,
        timelock_b: u64,
        funds_locked: bool,
        is_completed: bool,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        maker_: ContractAddress,
        resolver_: ContractAddress,
        token_address_: ContractAddress,
        amount_: u256,
        hashlock_: felt252,
        timelock_a_: u64,
        timelock_b_: u64,
    ) {
        self.maker.write(maker_);
        self.resolver.write(resolver_);
        self.token_address.write(token_address_);
        self.amount.write(amount_);
        self.hashlock.write(hashlock_);
        self.timelock_a.write(timelock_a_);
        self.timelock_b.write(timelock_b_);
        self.funds_locked.write(false);
        self.is_completed.write(false);
    }

    #[abi(embed_v0)]
    impl EscrowInstanceImpl of super::IEscrowInstance<ContractState> {
        fn lock_funds(ref self: ContractState) {
            let caller = get_caller_address();
            assert(caller == self.maker.read(), 'Only maker can lock funds');
            assert(!self.funds_locked.read(), 'Funds already locked');
            assert(!self.is_completed.read(), 'Escrow completed');

            let token_dispatcher = IERC20Dispatcher { contract_address: self.token_address.read() };
            let contract_address = get_contract_address();
            let amount = self.amount.read();
            
            let success = token_dispatcher.transfer(contract_address, amount);
            assert(success, 'Transfer failed');

            self.funds_locked.write(true);
        }

        fn redeem(ref self: ContractState, secret: felt252) {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();

            assert(!self.is_completed.read(), 'Already completed');
            assert(self.funds_locked.read(), 'Funds not locked');
            //assert(self.maker.read(), 'Only maker can redeem.');
            assert(caller == self.resolver.read(), 'Only resolver can redeem');
            assert(current_time >= self.timelock_b.read(), 'Timelock B not reached');

            // Hash the secret using Poseidon
            let mut hash_data = ArrayTrait::new();
            hash_data.append(secret);
            let computed_hash = poseidon_hash_span(hash_data.span());
            assert(computed_hash == self.hashlock.read(), 'Invalid secret');

            let token_dispatcher = IERC20Dispatcher { contract_address: self.token_address.read() };
            let amount = self.amount.read();
            let maker = self.maker.read();
            let success = token_dispatcher.transfer(maker, amount);
            assert(success, 'Transfer failed');

            self.is_completed.write(true);
        }

        fn cancel(ref self: ContractState) {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();

            assert(!self.is_completed.read(), 'Already completed');
            assert(self.funds_locked.read(), 'Funds not locked');
            assert(caller == self.maker.read(), 'Only maker can cancel');
            assert(current_time >= self.timelock_a.read(), 'Timelock A not reached');

            let token_dispatcher = IERC20Dispatcher { contract_address: self.token_address.read() };
            let amount = self.amount.read();
            
            let success = token_dispatcher.transfer(caller, amount);
            assert(success, 'Refund failed');

            self.is_completed.write(true);
        }

        fn is_completed_read(self: @ContractState) -> bool {
            self.is_completed.read()
        }

        fn funds_locked_read(self: @ContractState) -> bool {
            self.funds_locked.read()
        }

        fn get_maker(self: @ContractState) -> ContractAddress {
            self.maker.read()
        }

        fn get_resolver(self: @ContractState) -> ContractAddress {
            self.resolver.read()
        }

        fn get_amount(self: @ContractState) -> u256 {
            self.amount.read()
        }
    }
}