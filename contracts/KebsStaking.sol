// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract KebsStaking {
    IERC20 public usdc;
    address public owner;

    uint256 public rewardRatePerSecond = 1157407407;
    uint256 public totalStaked;

    struct Stake {
        uint256 amount;
        uint256 stakedAt;
        uint256 lastClaimed;
        uint256 totalEarned;
    }

    mapping(address => Stake) public stakes;
    address[] public stakers;

    event Staked(address indexed user, uint256 amount, uint256 time);
    event Unstaked(address indexed user, uint256 amount, uint256 time);
    event RewardClaimed(address indexed user, uint256 reward, uint256 time);

    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
        owner = msg.sender;
    }

    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        if (stakes[msg.sender].amount == 0) stakers.push(msg.sender);
        if (stakes[msg.sender].amount > 0) _claimReward(msg.sender);
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].stakedAt = block.timestamp;
        stakes[msg.sender].lastClaimed = block.timestamp;
        totalStaked += amount;
        emit Staked(msg.sender, amount, block.timestamp);
    }

    function unstake(uint256 amount) external {
        require(stakes[msg.sender].amount >= amount, "Insufficient stake");
        _claimReward(msg.sender);
        stakes[msg.sender].amount -= amount;
        totalStaked -= amount;
        require(usdc.transfer(msg.sender, amount), "Transfer failed");
        emit Unstaked(msg.sender, amount, block.timestamp);
    }

    function claimReward() external {
        _claimReward(msg.sender);
    }

    function _claimReward(address user) internal {
        uint256 reward = pendingReward(user);
        if (reward > 0 && usdc.balanceOf(address(this)) > totalStaked + reward) {
            stakes[user].totalEarned += reward;
            stakes[user].lastClaimed = block.timestamp;
            usdc.transfer(user, reward);
            emit RewardClaimed(user, reward, block.timestamp);
        } else {
            stakes[user].lastClaimed = block.timestamp;
        }
    }

    function pendingReward(address user) public view returns (uint256) {
        Stake memory s = stakes[user];
        if (s.amount == 0) return 0;
        uint256 duration = block.timestamp - s.lastClaimed;
        return (s.amount * rewardRatePerSecond * duration) / 1e18;
    }

    function getStake(address user) external view returns (
        uint256 amount,
        uint256 stakedAt,
        uint256 pending,
        uint256 totalEarned
    ) {
        return (
            stakes[user].amount,
            stakes[user].stakedAt,
            pendingReward(user),
            stakes[user].totalEarned
        );
    }

    function getStats() external view returns (
        uint256 _totalStaked,
        uint256 _stakerCount,
        uint256 _rewardRate
    ) {
        return (totalStaked, stakers.length, rewardRatePerSecond);
    }

    function setRewardRate(uint256 rate) external onlyOwner {
        rewardRatePerSecond = rate;
    }

    function fundRewards(uint256 amount) external {
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }
}
