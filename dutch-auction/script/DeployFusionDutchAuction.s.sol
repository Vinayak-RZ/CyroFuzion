// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/FusionDutchAuction.sol";

contract DeployFusionDutchAuction is Script {
    function run() external {
        // Get the private key from environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the FusionDutchAuction contract
        FusionDutchAuction auction = new FusionDutchAuction();
        
        // Stop broadcasting
        vm.stopBroadcast();
        
        // Log deployment information
        console.log("FusionDutchAuction deployed to:", address(auction));
        console.log("Deployer address:", vm.addr(deployerPrivateKey));
        console.log("Network: Base Sepolia Testnet");
        console.log("Block number:", block.number);
        console.log("Gas used for deployment:", gasleft());
        
        // Verify the deployment was successful
        require(address(auction) != address(0), "Deployment failed");
        console.log("Deployment successful!");
        
        // Optional: Log some contract information
        console.log("\n Contract Information:");
        console.log("Contract Address:", address(auction));
        console.log("Contract Code Size:", address(auction).code.length, "bytes");

        console.log("Deployment info saved to deployment-info.txt");
    }
}