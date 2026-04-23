// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract KebsToken is ERC20, Ownable {
    constructor() ERC20('Kebs Token', 'KEBS') Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**18);
    }
    function mint(address to, uint256 amount) public onlyOwner { _mint(to, amount); }
    function burn(uint256 amount) public { _burn(msg.sender, amount); }
}

contract KebsNFT is ERC721, Ownable {
    uint256 private _nextTokenId;
    uint256 public nftPrice = 100 * 10**18;
    mapping(uint256 => string) private _tokenURIs;
    KebsToken public token;
    mapping(address => uint256) public stakedAmount;
    mapping(address => uint256) public stakeTimestamp;

    constructor(address tokenAddress) ERC721('Kebs NFT', 'KNFT') Ownable(msg.sender) {
        token = KebsToken(tokenAddress);
    }

    function mintNFT(address to, string memory uri) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = uri;
        return tokenId;
    }

    function buyNFT(string memory uri) public returns (uint256) {
        require(token.balanceOf(msg.sender) >= nftPrice, 'Insufficient KEBS');
        token.transferFrom(msg.sender, address(this), nftPrice);
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _tokenURIs[tokenId] = uri;
        return tokenId;
    }

    function burnNFT(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, 'Not owner');
        _burn(tokenId);
    }

    function stake(uint256 amount) public {
        token.transferFrom(msg.sender, address(this), amount);
        stakedAmount[msg.sender] += amount;
        stakeTimestamp[msg.sender] = block.timestamp;
    }

    function unstake() public {
        uint256 amount = stakedAmount[msg.sender];
        require(amount > 0, 'Nothing staked');
        uint256 duration = block.timestamp - stakeTimestamp[msg.sender];
        uint256 reward = (amount * duration * 10) / (365 days * 100);
        stakedAmount[msg.sender] = 0;
        token.transfer(msg.sender, amount + reward);
    }

    function setNFTPrice(uint256 price) public onlyOwner { nftPrice = price; }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }
}
