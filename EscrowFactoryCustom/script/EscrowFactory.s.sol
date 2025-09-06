// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EscrowFactory.sol";

contract DeployEscrowFactorySrc is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        EscrowFactorySrc factory = new EscrowFactorySrc();
        console.log("EscrowFactorySrc deployed at:", address(factory));

        vm.stopBroadcast();
    }
}
