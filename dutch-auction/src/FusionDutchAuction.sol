// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract FusionDutchAuction {
    struct Order {
        address user;
        address srcToken;
        uint256 amount;
        uint256 auctionStart;
        uint256 startrate; // Initial rate at auction start
        uint256 minReturnAmount;
        uint256[] decrease_rates; // Each rate is for 1s interval (updated)
        bool filled;
    }

    mapping(bytes32 => Order) public orders;

    event OrderCreated(
        bytes32 indexed orderId,
        address indexed user,
        address indexed srcToken,
        uint256 amount,
        uint256 auctionStart,
        uint256 startrate,
        uint256 minReturnAmount,
        uint256[] 
    );

    event OrderFilled(
        bytes32 indexed orderId,
        address indexed resolver,
        uint256 fillAmount,
        uint256 rateUsed
    );

    /// @notice Create a Dutch auction order with discrete rate steps every 1 second
    function createOrder(
        address srcToken,
        uint256 amount,
        uint256 auctionStart,
        uint256 startrate,
        uint256 minReturnAmount,
        uint256[] calldata decrease_rates
    ) external returns (bytes32 orderId) {
        require(amount > 0, "Amount must be > 0");
        require(decrease_rates.length > 0, "Must have at least one rate");

        orderId = keccak256(
            abi.encodePacked(
                msg.sender,
                srcToken,
                amount,
                block.timestamp,
                auctionStart,
                minReturnAmount
            )
        );

        require(orders[orderId].user == address(0), "Order already exists");

        orders[orderId] = Order({
            user: msg.sender,
            srcToken: srcToken,
            amount: amount,
            auctionStart: auctionStart,
            startrate: startrate,
            minReturnAmount: minReturnAmount,
            decrease_rates: decrease_rates,
            filled: false
        });

        emit OrderCreated(
            orderId,
            msg.sender,
            srcToken,
            amount,
            auctionStart,
            startrate,
            minReturnAmount,
            decrease_rates
        );
    }

    /// @notice Computes the current rate based on 1s step intervals
    function getCurrentRate(bytes32 orderId) public view returns (uint256) {
        Order storage order = orders[orderId];
        require(order.user != address(0), "Order not found");

        if (block.timestamp < order.auctionStart) {
            return order.startrate; // Auction hasn't started
        }

        uint256 elapsed = block.timestamp - order.auctionStart;
        uint256 steps = elapsed; // Convert to 1s steps
        uint256 maxSteps = order.decrease_rates.length;
        
        // Calculate total decrease for completed full seconds
        uint256 totalDecrease;
        uint256 stepsToCalculate = steps > maxSteps ? maxSteps : steps;
        
        for (uint256 i = 0; i < stepsToCalculate; i++) {
            totalDecrease += order.decrease_rates[i];
        }

        // Calculate current rate with safety checks
        uint256 currentRate;
        if (order.startrate > totalDecrease) {
            currentRate = order.startrate - totalDecrease;
        } else {
            currentRate = 0; // Prevent underflow
        }
        
        // Enforce minimum return amount
        return currentRate > order.minReturnAmount 
            ? currentRate 
            : order.minReturnAmount;
    }

    /// @notice Mark an order as filled by a resolver
    function fillOrder(bytes32 orderId) external {
        Order storage order = orders[orderId];
        require(order.user != address(0), "Order does not exist");
        require(!order.filled, "Order already filled");

        uint256 rate = getCurrentRate(orderId);
        uint256 fillAmount = (order.amount * rate) / 1e18;

        order.filled = true;

        emit OrderFilled(orderId, msg.sender, fillAmount, rate);
    }
}