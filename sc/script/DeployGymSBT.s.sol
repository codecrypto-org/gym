// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {GymSBT} from "../src/GymSBT.sol";

contract DeployGymSBT is Script {
    function run() external returns (GymSBT) {
        // Private key de la cuenta 0 de Anvil (por defecto)
        // Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

        vm.startBroadcast(deployerPrivateKey);

        // Deploy del contrato GymSBT
        GymSBT gymSBT = new GymSBT("Gym Access Token", "GYM");

        vm.stopBroadcast();

        // Log de la dirección del contrato
        console.log("GymSBT deployed at:", address(gymSBT));
        console.log("Deployer address:", vm.addr(deployerPrivateKey));
        console.log("Chain ID:", block.chainid);
        
        // La dirección se guardará automáticamente por el script post-deploy
        // Ejecuta: node scripts/update-addresses.js <contract-address>

        return gymSBT;
    }
}

