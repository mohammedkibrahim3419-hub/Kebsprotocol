// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract KebsRegistry {

    struct Agent {
        string  agentId;
        address wallet;
        address contractAddress;
        string  capabilities;
        bool    active;
        uint256 registeredAt;
    }

    address public owner;
    uint256 public agentCount;
    string[] public agentIds;

    mapping(string => Agent) public agents;
    mapping(address => string) public walletToId;
    mapping(string => bool) public registered;

    event AgentRegistered(string indexed agentId, address wallet, uint256 timestamp);
    event AgentDeactivated(string indexed agentId);

    constructor() { owner = msg.sender; }

    function registerAgent(
        string calldata agentId,
        address wallet,
        address contractAddress,
        string calldata capabilities
    ) external {
        require(!registered[agentId], "Already registered");
        agents[agentId] = Agent(agentId, wallet, contractAddress, capabilities, true, block.timestamp);
        walletToId[wallet] = agentId;
        agentIds.push(agentId);
        registered[agentId] = true;
        agentCount++;
        emit AgentRegistered(agentId, wallet, block.timestamp);
    }

    function deactivate(string calldata agentId) external {
        require(agents[agentId].wallet == msg.sender || msg.sender == owner, "Not authorized");
        agents[agentId].active = false;
        emit AgentDeactivated(agentId);
    }

    function getAgent(string calldata agentId) external view returns (Agent memory) {
        return agents[agentId];
    }

    function getAllAgentIds() external view returns (string[] memory) {
        return agentIds;
    }

    function getStats() external view returns (uint256 total, uint256 active) {
        uint256 a = 0;
        for (uint256 i = 0; i < agentIds.length; i++) {
            if (agents[agentIds[i]].active) a++;
        }
        return (agentCount, a);
    }
}
