// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/FusionDutchAuction.sol";

contract FusionDutchAuctionTest is Test {
    FusionDutchAuction public auction;
    
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public resolver = makeAddr("resolver");
    address public srcToken = makeAddr("srcToken");
    
    uint256 public constant AMOUNT = 1000e18;
    uint256 public constant START_RATE = 1.5e18; // 1.5 tokens per source token
    uint256 public constant MIN_RETURN = 1.0e18; // 1.0 tokens per source token
    
    uint256[] public decreaseRates;
    
    event OrderCreated(
        bytes32 indexed orderId,
        address indexed user,
        address indexed srcToken,
        uint256 amount,
        uint256 auctionStart,
        uint256 startrate,
        uint256 minReturnAmount,
        uint256[] decrease_rates
    );
    
    event OrderFilled(
        bytes32 indexed orderId,
        address indexed resolver,
        uint256 fillAmount,
        uint256 rateUsed
    );
    
    function setUp() public {
        auction = new FusionDutchAuction();
        
        // Set up decrease rates: 0.1 decrease per second for 5 seconds
        decreaseRates.push(0.1e18);
        decreaseRates.push(0.1e18);
        decreaseRates.push(0.1e18);
        decreaseRates.push(0.1e18);
        decreaseRates.push(0.1e18);
    }
    
    function testCreateOrder() public {
        vm.startPrank(user1);
        
        uint256 auctionStart = block.timestamp + 100;
        
        vm.expectEmit(true, true, true, true);
        emit OrderCreated(
            _getExpectedOrderId(user1, srcToken, AMOUNT, block.timestamp, auctionStart, MIN_RETURN),
            user1,
            srcToken,
            AMOUNT,
            auctionStart,
            START_RATE,
            MIN_RETURN,
            decreaseRates
        );
        
        bytes32 orderId = auction.createOrder(
            srcToken,
            AMOUNT,
            auctionStart,
            START_RATE,
            MIN_RETURN,
            decreaseRates
        );
        
        // Verify order was stored correctly
        (
            address storedUser,
            address storedSrcToken,
            uint256 storedAmount,
            uint256 storedAuctionStart,
            uint256 storedStartRate,
            uint256 storedMinReturn,
            bool filled
        ) = auction.orders(orderId);
        
        assertEq(storedUser, user1);
        assertEq(storedSrcToken, srcToken);
        assertEq(storedAmount, AMOUNT);
        assertEq(storedAuctionStart, auctionStart);
        assertEq(storedStartRate, START_RATE);
        assertEq(storedMinReturn, MIN_RETURN);
        assertFalse(filled);
        
        vm.stopPrank();
    }
    
    function testCreateOrderRevertsWithZeroAmount() public {
        vm.startPrank(user1);
        
        vm.expectRevert("Amount must be > 0");
        auction.createOrder(
            srcToken,
            0,
            block.timestamp + 100,
            START_RATE,
            MIN_RETURN,
            decreaseRates
        );
        
        vm.stopPrank();
    }
    
    function testCreateOrderRevertsWithEmptyDecreaseRates() public {
        vm.startPrank(user1);
        
        uint256[] memory emptyRates;
        
        vm.expectRevert("Must have at least one rate");
        auction.createOrder(
            srcToken,
            AMOUNT,
            block.timestamp + 100,
            START_RATE,
            MIN_RETURN,
            emptyRates
        );
        
        vm.stopPrank();
    }
    
    function testGetCurrentRateBeforeAuctionStart() public {
        vm.startPrank(user1);
        
        uint256 auctionStart = block.timestamp + 100;
        bytes32 orderId = auction.createOrder(
            srcToken,
            AMOUNT,
            auctionStart,
            START_RATE,
            MIN_RETURN,
            decreaseRates
        );
        
        // Rate should be start rate before auction begins
        uint256 currentRate = auction.getCurrentRate(orderId);
        assertEq(currentRate, START_RATE);
        
        vm.stopPrank();
    }
    
    function testGetCurrentRateAtAuctionStart() public {
        vm.startPrank(user1);
        
        uint256 auctionStart = block.timestamp;
        bytes32 orderId = auction.createOrder(
            srcToken,
            AMOUNT,
            auctionStart,
            START_RATE,
            MIN_RETURN,
            decreaseRates
        );
        
        uint256 currentRate = auction.getCurrentRate(orderId);
        assertEq(currentRate, START_RATE);
        
        vm.stopPrank();
    }
    
    function testGetCurrentRateAfterOneSecond() public {
        vm.startPrank(user1);
        
        uint256 auctionStart = block.timestamp;
        bytes32 orderId = auction.createOrder(
            srcToken,
            AMOUNT,
            auctionStart,
            START_RATE,
            MIN_RETURN,
            decreaseRates
        );
        
        // Advance time by 1 second
        vm.warp(block.timestamp + 1);
        
        uint256 currentRate = auction.getCurrentRate(orderId);
        // Should be START_RATE - first decrease rate (1.5 - 0.1 = 1.4)
        assertEq(currentRate, START_RATE - decreaseRates[0]);
        
        vm.stopPrank();
    }
    
    function testGetCurrentRateAfterMultipleSeconds() public {
        vm.startPrank(user1);
        
        uint256 auctionStart = block.timestamp;
        bytes32 orderId = auction.createOrder(
            srcToken,
            AMOUNT,
            auctionStart,
            START_RATE,
            MIN_RETURN,
            decreaseRates
        );
        
        // Advance time by 3 seconds
        vm.warp(block.timestamp + 3);
        
        uint256 currentRate = auction.getCurrentRate(orderId);
        // Should be START_RATE - sum of first 3 decrease rates (1.5 - 0.3 = 1.2)
        uint256 expectedRate = START_RATE - (decreaseRates[0] + decreaseRates[1] + decreaseRates[2]);
        assertEq(currentRate, expectedRate);
        
        vm.stopPrank();
    }
    
    function testGetCurrentRateAfterAllDecreaseSteps() public {
        vm.startPrank(user1);
        
        uint256 auctionStart = block.timestamp;
        bytes32 orderId = auction.createOrder(
            srcToken,
            AMOUNT,
            auctionStart,
            START_RATE,
            MIN_RETURN,
            decreaseRates
        );
        
        // Advance time beyond all decrease steps
        vm.warp(block.timestamp + decreaseRates.length + 10);
        
        uint256 currentRate = auction.getCurrentRate(orderId);
        // Should be START_RATE - sum of all decrease rates (1.5 - 0.5 = 1.0)
        uint256 totalDecrease = 0;
        for (uint256 i = 0; i < decreaseRates.length; i++) {
            totalDecrease += decreaseRates[i];
        }
        uint256 expectedRate = START_RATE - totalDecrease;
        assertEq(currentRate, expectedRate);
        
        vm.stopPrank();
    }
    
    function testGetCurrentRateEnforcesMinimum() public {
        vm.startPrank(user1);
        
        // Create order with decrease rates that would go below minimum
        uint256[] memory largeDecreaseRates = new uint256[](3);
        largeDecreaseRates[0] = 0.3e18;
        largeDecreaseRates[1] = 0.3e18;
        largeDecreaseRates[2] = 0.3e18; // Total decrease: 0.9, which would make rate 0.6 (below MIN_RETURN of 1.0)
        
        uint256 auctionStart = block.timestamp;
        bytes32 orderId = auction.createOrder(
            srcToken,
            AMOUNT,
            auctionStart,
            START_RATE,
            MIN_RETURN,
            largeDecreaseRates
        );
        
        // Advance time to apply all decreases
        vm.warp(block.timestamp + 3);
        
        uint256 currentRate = auction.getCurrentRate(orderId);
        // Should be clamped to minimum return amount
        assertEq(currentRate, MIN_RETURN);
        
        vm.stopPrank();
    }
    
    function testGetCurrentRateUnderflowProtection() public {
        vm.startPrank(user1);
        
        // Create order with massive decrease rates
        uint256[] memory massiveDecreaseRates = new uint256[](2);
        massiveDecreaseRates[0] = 2e18; // Larger than start rate
        massiveDecreaseRates[1] = 1e18;
        
        uint256 auctionStart = block.timestamp;
        bytes32 orderId = auction.createOrder(
            srcToken,
            AMOUNT,
            auctionStart,
            START_RATE,
            MIN_RETURN,
            massiveDecreaseRates
        );
        
        // Advance time to apply decreases
        vm.warp(block.timestamp + 2);
        
        uint256 currentRate = auction.getCurrentRate(orderId);
        // Should be minimum return amount since underflow protection kicks in
        assertEq(currentRate, MIN_RETURN);
        
        vm.stopPrank();
    }
    
    function testGetCurrentRateRevertsForNonexistentOrder() public {
        bytes32 fakeOrderId = keccak256("fake");
        
        vm.expectRevert("Order not found");
        auction.getCurrentRate(fakeOrderId);
    }
    
    function testFillOrderSuccess() public {
        vm.startPrank(user1);
        
        uint256 auctionStart = block.timestamp;
        bytes32 orderId = auction.createOrder(
            srcToken,
            AMOUNT,
            auctionStart,
            START_RATE,
            MIN_RETURN,
            decreaseRates
        );
        
        vm.stopPrank();
        
        // Advance time by 2 seconds
        vm.warp(block.timestamp + 2);
        
        vm.startPrank(resolver);
        
        uint256 expectedRate = START_RATE - (decreaseRates[0] + decreaseRates[1]); // 1.3e18
        uint256 expectedFillAmount = (AMOUNT * expectedRate) / 1e18;
        
        vm.expectEmit(true, true, false, true);
        emit OrderFilled(orderId, resolver, expectedFillAmount, expectedRate);
        
        auction.fillOrder(orderId);
        
        // Verify order is marked as filled
        (,,,,,, bool filled) = auction.orders(orderId);
        assertTrue(filled);
        
        vm.stopPrank();
    }
    
    function testFillOrderRevertsForNonexistentOrder() public {
        bytes32 fakeOrderId = keccak256("fake");
        
        vm.startPrank(resolver);
        
        vm.expectRevert("Order does not exist");
        auction.fillOrder(fakeOrderId);
        
        vm.stopPrank();
    }
    
    function testFillOrderRevertsForAlreadyFilledOrder() public {
        vm.startPrank(user1);
        
        uint256 auctionStart = block.timestamp;
        bytes32 orderId = auction.createOrder(
            srcToken,
            AMOUNT,
            auctionStart,
            START_RATE,
            MIN_RETURN,
            decreaseRates
        );
        
        vm.stopPrank();
        
        vm.startPrank(resolver);
        
        // Fill the order first time
        auction.fillOrder(orderId);
        
        // Try to fill again
        vm.expectRevert("Order already filled");
        auction.fillOrder(orderId);
        
        vm.stopPrank();
    }
    
    function testMultipleOrdersWithDifferentRates() public {
        uint256[] memory fastDecreaseRates = new uint256[](2);
        fastDecreaseRates[0] = 0.2e18;
        fastDecreaseRates[1] = 0.2e18;
        
        uint256[] memory slowDecreaseRates = new uint256[](4);
        slowDecreaseRates[0] = 0.05e18;
        slowDecreaseRates[1] = 0.05e18;
        slowDecreaseRates[2] = 0.05e18;
        slowDecreaseRates[3] = 0.05e18;
        
        vm.startPrank(user1);
        
        bytes32 fastOrderId = auction.createOrder(
            srcToken,
            AMOUNT,
            block.timestamp,
            START_RATE,
            MIN_RETURN,
            fastDecreaseRates
        );
        
        vm.stopPrank();
        
        vm.startPrank(user2);
        
        bytes32 slowOrderId = auction.createOrder(
            srcToken,
            AMOUNT,
            block.timestamp,
            START_RATE,
            MIN_RETURN,
            slowDecreaseRates
        );
        
        vm.stopPrank();
        
        // Advance time by 2 seconds
        vm.warp(block.timestamp + 2);
        
        uint256 fastRate = auction.getCurrentRate(fastOrderId);
        uint256 slowRate = auction.getCurrentRate(slowOrderId);
        
        // Fast order should have decreased more
        uint256 expectedFastRate = START_RATE - (fastDecreaseRates[0] + fastDecreaseRates[1]); // 1.1e18
        uint256 expectedSlowRate = START_RATE - (slowDecreaseRates[0] + slowDecreaseRates[1]); // 1.4e18
        
        assertEq(fastRate, expectedFastRate);
        assertEq(slowRate, expectedSlowRate);
        assertTrue(slowRate > fastRate);
    }
    
    function testFuzzCreateOrder(
        uint256 amount,
        uint256 startRate,
        uint256 minReturn,
        uint8 decreaseRatesLength
    ) public {
        // Bound inputs to reasonable ranges
        amount = bound(amount, 1, type(uint128).max);
        startRate = bound(startRate, 1e15, 100e18); // 0.001 to 100 tokens
        minReturn = bound(minReturn, 1e15, startRate); // Min return <= start rate
        decreaseRatesLength = uint8(bound(decreaseRatesLength, 1, 10));
        
        uint256[] memory fuzzDecreaseRates = new uint256[](decreaseRatesLength);
        for (uint256 i = 0; i < decreaseRatesLength; i++) {
            fuzzDecreaseRates[i] = 0.01e18; // Small decrease to avoid underflow
        }
        
        vm.startPrank(user1);
        
        bytes32 orderId = auction.createOrder(
            srcToken,
            amount,
            block.timestamp + 100,
            startRate,
            minReturn,
            fuzzDecreaseRates
        );
        
        // Verify order exists and has correct values
        (
            address storedUser,
            address storedSrcToken,
            uint256 storedAmount,
            ,
            uint256 storedStartRate,
            uint256 storedMinReturn,
            
            bool filled
        ) = auction.orders(orderId);
        
        assertEq(storedUser, user1);
        assertEq(storedSrcToken, srcToken);
        assertEq(storedAmount, amount);
        assertEq(storedStartRate, startRate);
        assertEq(storedMinReturn, minReturn);
        assertFalse(filled);
        
        vm.stopPrank();
    }
    
    // Helper function to compute expected order ID
    function _getExpectedOrderId(
        address user,
        address token,
        uint256 amount,
        uint256 timestamp,
        uint256 auctionStart,
        uint256 minReturn
    ) internal pure returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                user,
                token,
                amount,
                timestamp,
                auctionStart,
                minReturn
            )
        );
    }
}