// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract KebsProtocol is ERC721, Ownable {
    // ERC20-like token state
    string public tokenName = 'Kebs Token';
    string public tokenSymbol = 'KEBS';
    uint8 public tokenDecimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public tokenBalance;
    mapping(address => mapping(address => uint256)) public tokenAllowance;

    // NFT state
    uint256 private _nextTokenId;
    uint256 public nftPrice = 100 * 10**18;
    mapping(uint256 => string) private _tokenURIs;

    // Staking
    mapping(address => uint256) public stakedAmount;
    mapping(address => uint256) public stakeTimestamp;

    // Marketplace
    struct Listing { address seller; uint256 price; bool active; }
    mapping(uint256 => Listing) public listings;

    // Events
    event TokenTransfer(address indexed from, address indexed to, uint256 value);
    event TokenApproval(address indexed owner, address indexed spender, uint256 value);
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);
    event NFTListed(uint256 indexed tokenId, uint256 price);
    event NFTSold(uint256 indexed tokenId, address buyer, uint256 price);

    constructor() ERC721('Kebs NFT', 'KNFT') Ownable(msg.sender) {
        _mintTokens(msg.sender, 1000000 * 10**18);
    }

    // ── TOKEN FUNCTIONS ──
    function _mintTokens(address to, uint256 amount) internal {
        tokenBalance[to] += amount;
        totalSupply += amount;
        emit TokenTransfer(address(0), to, amount);
    }

    function mintToken(address to, uint256 amount) public onlyOwner {
        _mintTokens(to, amount);
    }

    function burnToken(uint256 amount) public {
        require(tokenBalance[msg.sender] >= amount, 'Insufficient balance');
        tokenBalance[msg.sender] -= amount;
        totalSupply -= amount;
        emit TokenTransfer(msg.sender, address(0), amount);
    }

    function transferToken(address to, uint256 amount) public returns (bool) {
        require(tokenBalance[msg.sender] >= amount, 'Insufficient balance');
        tokenBalance[msg.sender] -= amount;
        tokenBalance[to] += amount;
        emit TokenTransfer(msg.sender, to, amount);
        return true;
    }

    function approveToken(address spender, uint256 amount) public returns (bool) {
        tokenAllowance[msg.sender][spender] = amount;
        emit TokenApproval(msg.sender, spender, amount);
        return true;
    }

    function transferTokenFrom(address from, address to, uint256 amount) public returns (bool) {
        require(tokenAllowance[from][msg.sender] >= amount, 'Not approved');
        require(tokenBalance[from] >= amount, 'Insufficient balance');
        tokenAllowance[from][msg.sender] -= amount;
        tokenBalance[from] -= amount;
        tokenBalance[to] += amount;
        emit TokenTransfer(from, to, amount);
        return true;
    }

    // ── NFT FUNCTIONS ──
    function mintNFT(address to, string memory uri) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = uri;
        return tokenId;
    }

    function buyNFT(string memory uri) public returns (uint256) {
        require(tokenBalance[msg.sender] >= nftPrice, 'Insufficient KEBS');
        tokenBalance[msg.sender] -= nftPrice;
        tokenBalance[address(this)] += nftPrice;
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _tokenURIs[tokenId] = uri;
        return tokenId;
    }

    function burnNFT(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, 'Not owner');
        _burn(tokenId);
    }

    function setNFTPrice(uint256 price) public onlyOwner { nftPrice = price; }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    // ── STAKING ──
    function stake(uint256 amount) public {
        require(tokenBalance[msg.sender] >= amount, 'Insufficient KEBS');
        tokenBalance[msg.sender] -= amount;
        tokenBalance[address(this)] += amount;
        stakedAmount[msg.sender] += amount;
        stakeTimestamp[msg.sender] = block.timestamp;
        emit Staked(msg.sender, amount);
    }

    function unstake() public {
        uint256 amount = stakedAmount[msg.sender];
        require(amount > 0, 'Nothing staked');
        uint256 duration = block.timestamp - stakeTimestamp[msg.sender];
        uint256 reward = (amount * duration * 10) / (365 days * 100);
        stakedAmount[msg.sender] = 0;
        tokenBalance[address(this)] -= amount;
        _mintTokens(msg.sender, amount + reward);
        emit Unstaked(msg.sender, amount, reward);
    }

    // ── MARKETPLACE ──
    function listNFT(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, 'Not owner');
        listings[tokenId] = Listing(msg.sender, price, true);
        emit NFTListed(tokenId, price);
    }

    function buyListedNFT(uint256 tokenId) public {
        Listing memory l = listings[tokenId];
        require(l.active, 'Not listed');
        require(tokenBalance[msg.sender] >= l.price, 'Insufficient KEBS');
        tokenBalance[msg.sender] -= l.price;
        tokenBalance[l.seller] += l.price;
        listings[tokenId].active = false;
        _transfer(l.seller, msg.sender, tokenId);
        emit NFTSold(tokenId, msg.sender, l.price);
    }

    function cancelListing(uint256 tokenId) public {
        require(listings[tokenId].seller == msg.sender, 'Not seller');
        listings[tokenId].active = false;
    }
}
