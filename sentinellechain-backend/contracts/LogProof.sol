// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LogProof {
    mapping(bytes32 => bool) public proofExists; // Stores hashes
    address public owner;

    event LogHashStored(bytes32 indexed logHash, uint256 timestamp);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    function storeHash(bytes32 logHash) public { // For now, public for easier testing on testnet
        require(!proofExists[logHash], "Hash already stored.");
        proofExists[logHash] = true;
        emit LogHashStored(logHash, block.timestamp);
    }

    function verifyHash(bytes32 logHash) public view returns (bool) {
        return proofExists[logHash];
    }
}
