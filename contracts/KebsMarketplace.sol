// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract KebsMarketplace {
    address public owner;

    enum TaskStatus { Open, Assigned, Completed, Disputed, Cancelled }

    struct MarketTask {
        uint256 id;
        address poster;
        string title;
        string description;
        uint256 reward;
        uint256 deadline;
        TaskStatus status;
        address assignedAgent;
        string completionProof;
        uint256 createdAt;
    }

    struct Bid {
        address agent;
        string proposal;
        uint256 bidTime;
        bool accepted;
    }

    uint256 public taskCount;
    uint256 public platformFee = 250; // 2.5%
    uint256 public totalVolume;

    mapping(uint256 => MarketTask) public tasks;
    mapping(uint256 => Bid[]) public bids;
    mapping(address => uint256[]) public agentTasks;
    mapping(address => uint256[]) public posterTasks;
    mapping(address => uint256) public agentEarnings;
    mapping(address => uint256) public agentCompletions;

    event TaskPosted(uint256 indexed id, address indexed poster, string title, uint256 reward);
    event BidPlaced(uint256 indexed taskId, address indexed agent, string proposal);
    event BidAccepted(uint256 indexed taskId, address indexed agent);
    event TaskCompleted(uint256 indexed taskId, address indexed agent, uint256 reward);
    event TaskCancelled(uint256 indexed taskId);
    event TaskDisputed(uint256 indexed taskId);

    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }
    modifier onlyRegistered() { require(msg.sender != address(0), "Invalid agent"); _; }
    modifier taskExists(uint256 taskId) { require(taskId < taskCount, "Task not found"); _; }

    constructor() {
        owner = msg.sender;
    }

    function postTask(
        string calldata title,
        string calldata description,
        uint256 deadline
    ) external payable {
        require(msg.value > 0, "Reward required");
        require(deadline > block.timestamp, "Invalid deadline");
        require(bytes(title).length > 0, "Title required");

        uint256 id = taskCount++;
        tasks[id] = MarketTask({
            id: id,
            poster: msg.sender,
            title: title,
            description: description,
            reward: msg.value,
            deadline: deadline,
            status: TaskStatus.Open,
            assignedAgent: address(0),
            completionProof: "",
            createdAt: block.timestamp
        });

        posterTasks[msg.sender].push(id);
        emit TaskPosted(id, msg.sender, title, msg.value);
    }

    function placeBid(uint256 taskId, string calldata proposal)
        external
        onlyRegistered
        taskExists(taskId)
    {
        MarketTask storage task = tasks[taskId];
        require(task.status == TaskStatus.Open, "Task not open");
        require(task.poster != msg.sender, "Cannot bid own task");
        require(block.timestamp < task.deadline, "Task expired");

        bids[taskId].push(Bid({
            agent: msg.sender,
            proposal: proposal,
            bidTime: block.timestamp,
            accepted: false
        }));

        emit BidPlaced(taskId, msg.sender, proposal);
    }

    function acceptBid(uint256 taskId, uint256 bidIndex)
        external
        taskExists(taskId)
    {
        MarketTask storage task = tasks[taskId];
        require(task.poster == msg.sender, "Not task poster");
        require(task.status == TaskStatus.Open, "Task not open");
        require(bidIndex < bids[taskId].length, "Invalid bid");

        bids[taskId][bidIndex].accepted = true;
        task.assignedAgent = bids[taskId][bidIndex].agent;
        task.status = TaskStatus.Assigned;

        agentTasks[task.assignedAgent].push(taskId);
        emit BidAccepted(taskId, task.assignedAgent);
    }

    function submitCompletion(uint256 taskId, string calldata proof)
        external
        taskExists(taskId)
    {
        MarketTask storage task = tasks[taskId];
        require(task.assignedAgent == msg.sender, "Not assigned agent");
        require(task.status == TaskStatus.Assigned, "Task not assigned");

        task.completionProof = proof;
        task.status = TaskStatus.Completed;

        emit TaskCompleted(taskId, msg.sender, task.reward);
    }

    function releasePayment(uint256 taskId) external taskExists(taskId) {
        MarketTask storage task = tasks[taskId];
        require(task.poster == msg.sender, "Not poster");
        require(task.status == TaskStatus.Completed, "Not completed");

        uint256 fee = (task.reward * platformFee) / 10000;
        uint256 agentPay = task.reward - fee;

        agentEarnings[task.assignedAgent] += agentPay;
        agentCompletions[task.assignedAgent]++;
        totalVolume += task.reward;

        payable(task.assignedAgent).transfer(agentPay);
        payable(owner).transfer(fee);
    }

    function cancelTask(uint256 taskId) external taskExists(taskId) {
        MarketTask storage task = tasks[taskId];
        require(task.poster == msg.sender, "Not poster");
        require(task.status == TaskStatus.Open, "Cannot cancel");

        task.status = TaskStatus.Cancelled;
        payable(msg.sender).transfer(task.reward);
        emit TaskCancelled(taskId);
    }

    function disputeTask(uint256 taskId) external taskExists(taskId) {
        MarketTask storage task = tasks[taskId];
        require(
            task.poster == msg.sender || task.assignedAgent == msg.sender,
            "Not involved"
        );
        require(task.status == TaskStatus.Assigned || task.status == TaskStatus.Completed, "Cannot dispute");
        task.status = TaskStatus.Disputed;
        emit TaskDisputed(taskId);
    }

    function resolveDispute(uint256 taskId, bool payAgent)
        external
        onlyOwner
        taskExists(taskId)
    {
        MarketTask storage task = tasks[taskId];
        require(task.status == TaskStatus.Disputed, "Not disputed");
        if (payAgent) {
            payable(task.assignedAgent).transfer(task.reward);
        } else {
            payable(task.poster).transfer(task.reward);
        }
        task.status = TaskStatus.Cancelled;
    }

    function getOpenTasks() external view returns (MarketTask[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < taskCount; i++) {
            if (tasks[i].status == TaskStatus.Open) count++;
        }
        MarketTask[] memory open = new MarketTask[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < taskCount; i++) {
            if (tasks[i].status == TaskStatus.Open) open[idx++] = tasks[i];
        }
        return open;
    }

    function getTaskBids(uint256 taskId) external view returns (Bid[] memory) {
        return bids[taskId];
    }

    function getAgentStats(address agent) external view returns (
        uint256 earnings,
        uint256 completions,
        uint256 activeTasks
    ) {
        return (agentEarnings[agent], agentCompletions[agent], agentTasks[agent].length);
    }

    function getStats() external view returns (
        uint256 total,
        uint256 open,
        uint256 completed,
        uint256 volume
    ) {
        uint256 o = 0; uint256 c = 0;
        for (uint256 i = 0; i < taskCount; i++) {
            if (tasks[i].status == TaskStatus.Open) o++;
            if (tasks[i].status == TaskStatus.Completed) c++;
        }
        return (taskCount, o, c, totalVolume);
    }

    function setPlatformFee(uint256 fee) external onlyOwner {
        require(fee <= 1000, "Max 10%");
        platformFee = fee;
    }

    receive() external payable {}
}
