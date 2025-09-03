pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract EscrowSrc {
    address public maker;
    IERC20 public asset;
    uint256 public amount;
    bytes32 public hashlock;
    uint256 public timelock;
    bool public claimed;
    bool public refunded;

    constructor(
        address _maker,
        IERC20 _asset,
        uint256 _amount,
        bytes32 _hashlock,
        uint256 _timelock
    ) {
        maker = _maker;
        asset = _asset;
        amount = _amount;
        hashlock = _hashlock;
        timelock = _timelock;
        claimed = false;
        refunded = false;
        require(_asset.transferFrom(_maker, address(this), _amount), "Transfer failed");
    }

    function claim(bytes32 secret) external {
        require(!claimed && !refunded, "Already claimed or refunded");
        require(keccak256(abi.encodePacked(secret)) == hashlock, "Invalid secret");
        require(block.timestamp < timelock, "Timelock expired");
        claimed = true;
        require(asset.transfer(msg.sender, amount), "Transfer failed");
    }

    function refund() external {
        require(!claimed && !refunded, "Already claimed or refunded");
        require(block.timestamp >= timelock, "Timelock not expired");
        require(msg.sender == maker, "Only maker can refund");
        refunded = true;
        require(asset.transfer(maker, amount), "Transfer failed");
    }
}