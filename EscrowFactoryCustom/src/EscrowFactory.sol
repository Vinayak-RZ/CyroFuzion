pragma solidity ^0.8.0;

import "./Escrow.sol";

contract EscrowFactorySrc {
    event EscrowCreated(
        address indexed escrowAddress,
        address maker,
        address asset,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock
    );

    function createEscrow(
        address maker,
        IERC20 asset,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock
    ) external {
        EscrowSrc newEscrow = new EscrowSrc(maker, asset, amount, hashlock, timelock);
        emit EscrowCreated(address(newEscrow), maker, address(asset), amount, hashlock, timelock);
    }
}