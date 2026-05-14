// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract KebsRegistry {
    address public owner;
    uint256 public count;
    mapping(uint256 => address) public agents;
    mapping(address => bool) public registered;
    event Registered(address agent, uint256 id);
    constructor() { owner = msg.sender; }
    function register() external {
        require(!registered[msg.sender], "Already registered");
        agents[count] = msg.sender;
        registered[msg.sender] = true;
        count++;
        emit Registered(msg.sender, count - 1);
    }
    function isRegistered(address agent) external view returns (bool) {
        return registered[agent];
    }
    function getAgent(uint256 id) external view returns (address) {
        return agents[id];
    }
}
