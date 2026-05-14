// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract KebsAgent {

    // ─── State ───────────────────────────────────────────────────────────────

    address public owner;
    address public agentWallet;
    string  public agentId;
    string  public version = "1.0.0";
    bool    public active;

    IERC20  public usdc;

    uint256 public totalPaymentsSent;
    uint256 public totalPaymentsReceived;
    uint256 public taskCount;

    // ─── Structs ─────────────────────────────────────────────────────────────

    struct Payment {
        address from;
        address to;
        uint256 amount;
        string  memo;
        uint256 timestamp;
    }

    struct Task {
        uint256 id;
        string  taskType;   // "swap" | "payment" | "monitor" | "message"
        string  status;     // "pending" | "executing" | "done" | "failed"
        string  result;
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct AgentMessage {
        uint256 id;
        address fromAgent;
        string  messageType; // "payment_request" | "task_request" | "data_request"
        string  payload;
        bool    processed;
        uint256 timestamp;
    }

    // ─── Storage ─────────────────────────────────────────────────────────────

    Payment[]      public payments;
    Task[]         public tasks;
    AgentMessage[] public inbox;

    mapping(address => bool) public trustedAgents;
    mapping(address => string) public agentRegistry; // address -> agentId

    // ─── Events ──────────────────────────────────────────────────────────────

    event AgentActivated(address indexed agentWallet, string agentId, uint256 timestamp);
    event AgentDeactivated(uint256 timestamp);
    event PaymentSent(address indexed to, uint256 amount, string memo, uint256 timestamp);
    event PaymentReceived(address indexed from, uint256 amount, string memo, uint256 timestamp);
    event TaskCreated(uint256 indexed taskId, string taskType, uint256 timestamp);
    event TaskUpdated(uint256 indexed taskId, string status, string result, uint256 timestamp);
    event MessageReceived(uint256 indexed msgId, address indexed fromAgent, string messageType, uint256 timestamp);
    event AgentTrusted(address indexed agent, string agentId);
    event AgentUntrusted(address indexed agent);

    // ─── Modifiers ───────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAgent() {
        require(msg.sender == agentWallet || msg.sender == owner, "Not agent");
        _;
    }

    modifier onlyActive() {
        require(active, "Agent not active");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(
        address _agentWallet,
        address _usdcAddress,
        string memory _agentId
    ) {
        owner       = msg.sender;
        agentWallet = _agentWallet;
        usdc        = IERC20(_usdcAddress);
        agentId     = _agentId;
        active      = true;

        emit AgentActivated(_agentWallet, _agentId, block.timestamp);
    }

    // ─── Agent Control ────────────────────────────────────────────────────────

    function activate() external onlyOwner {
        active = true;
        emit AgentActivated(agentWallet, agentId, block.timestamp);
    }

    function deactivate() external onlyOwner {
        active = false;
        emit AgentDeactivated(block.timestamp);
    }

    function setAgentWallet(address _newWallet) external onlyOwner {
        agentWallet = _newWallet;
    }

    // ─── Payments ─────────────────────────────────────────────────────────────

    function sendUSDC(address to, uint256 amount, string calldata memo)
        external onlyAgent onlyActive
    {
        require(usdc.transfer(to, amount), "Transfer failed");
        payments.push(Payment(address(this), to, amount, memo, block.timestamp));
        totalPaymentsSent += amount;
        emit PaymentSent(to, amount, memo, block.timestamp);
    }

    function receiveUSDC(address from, uint256 amount, string calldata memo)
        external onlyActive
    {
        require(usdc.transferFrom(from, address(this), amount), "TransferFrom failed");
        payments.push(Payment(from, address(this), amount, memo, block.timestamp));
        totalPaymentsReceived += amount;
        emit PaymentReceived(from, amount, memo, block.timestamp);
    }

    // Accept native token payments
    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value, "native", block.timestamp);
        totalPaymentsReceived += msg.value;
    }

    // ─── Tasks ────────────────────────────────────────────────────────────────

    function createTask(string calldata taskType)
        external onlyAgent onlyActive returns (uint256)
    {
        uint256 id = taskCount++;
        tasks.push(Task(id, taskType, "pending", "", block.timestamp, block.timestamp));
        emit TaskCreated(id, taskType, block.timestamp);
        return id;
    }

    function updateTask(uint256 taskId, string calldata status, string calldata result)
        external onlyAgent
    {
        require(taskId < tasks.length, "Invalid task");
        tasks[taskId].status    = status;
        tasks[taskId].result    = result;
        tasks[taskId].updatedAt = block.timestamp;
        emit TaskUpdated(taskId, status, result, block.timestamp);
    }

    // ─── Agent-to-Agent Messaging ─────────────────────────────────────────────

    function trustAgent(address agent, string calldata _agentId) external onlyOwner {
        trustedAgents[agent]  = true;
        agentRegistry[agent]  = _agentId;
        emit AgentTrusted(agent, _agentId);
    }

    function untrustAgent(address agent) external onlyOwner {
        trustedAgents[agent] = false;
        emit AgentUntrusted(agent);
    }

    function sendMessage(
        address toAgent,
        string calldata messageType,
        string calldata payload
    ) external onlyAgent onlyActive {
        // Call receiveMessage on the target KebsAgent contract
        KebsAgent(payable(toAgent)).receiveMessage(msg.sender, messageType, payload);
    }

    function receiveMessage(
        address fromAgent,
        string calldata messageType,
        string calldata payload
    ) external {
        require(trustedAgents[msg.sender] || msg.sender == owner, "Untrusted agent");
        uint256 id = inbox.length;
        inbox.push(AgentMessage(id, fromAgent, messageType, payload, false, block.timestamp));
        emit MessageReceived(id, fromAgent, messageType, block.timestamp);
    }

    function processMessage(uint256 msgId) external onlyAgent {
        require(msgId < inbox.length, "Invalid message");
        inbox[msgId].processed = true;
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getPayments() external view returns (Payment[] memory) {
        return payments;
    }

    function getTasks() external view returns (Task[] memory) {
        return tasks;
    }

    function getInbox() external view returns (AgentMessage[] memory) {
        return inbox;
    }

    function getPendingMessages() external view returns (AgentMessage[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < inbox.length; i++) {
            if (!inbox[i].processed) count++;
        }
        AgentMessage[] memory pending = new AgentMessage[](count);
        uint256 j = 0;
        for (uint256 i = 0; i < inbox.length; i++) {
            if (!inbox[i].processed) pending[j++] = inbox[i];
        }
        return pending;
    }

    function getStats() external view returns (
        uint256 _taskCount,
        uint256 _paymentsSent,
        uint256 _paymentsReceived,
        uint256 _inboxCount,
        bool    _active,
        uint256 _usdcBalance,
        uint256 _nativeBalance
    ) {
        return (
            taskCount,
            totalPaymentsSent,
            totalPaymentsReceived,
            inbox.length,
            active,
            usdc.balanceOf(address(this)),
            address(this).balance
        );
    }

    // ─── Withdraw (owner only) ────────────────────────────────────────────────

    function withdrawUSDC(uint256 amount) external onlyOwner {
        require(usdc.transfer(owner, amount), "Transfer failed");
    }

    function withdrawNative() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}
