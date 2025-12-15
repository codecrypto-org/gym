// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IERC721} from "forge-std/interfaces/IERC721.sol";
import {IERC165} from "forge-std/interfaces/IERC165.sol";

/// @title GymSBT - Soulbound Token for Gym Access Control
/// @notice Non-transferable NFT tokens with expiration dates for gym access management
contract GymSBT is IERC721 {
    // ERC-165 interface IDs
    bytes4 private constant _INTERFACE_ID_ERC165 = 0x01ffc9a7;
    bytes4 private constant _INTERFACE_ID_ERC721 = 0x80ac58cd;

    // Token name and symbol
    string public name;
    string public symbol;

    // Owner of the contract
    address public owner;

    // Price per month in wei
    uint256 public pricePerMonth;

    // Token counter
    uint256 private _tokenCounter;

    // Mapping from token ID to owner address
    mapping(uint256 => address) private _owners;

    // Mapping from owner address to token count
    mapping(address => uint256) private _balances;

    // Mapping from token ID to expiration timestamp
    mapping(uint256 => uint256) private _expirations;

    // Mapping from token ID to approved address
    mapping(uint256 => address) private _tokenApprovals;

    // Mapping from owner to operator approvals
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    // Events
    event TokenMinted(address indexed to, uint256 indexed tokenId, uint256 expirationTimestamp);
    event TokenPurchased(address indexed buyer, uint256 indexed tokenId, uint256 months, uint256 amountPaid);
    event TokenExpired(uint256 indexed tokenId);
    event TokenBurned(uint256 indexed tokenId);
    event PriceUpdated(uint256 newPricePerMonth);
    event FundsWithdrawn(address indexed to, uint256 amount);

    // Errors
    error NotOwner();
    error TokenNotExists();
    error TokenNotExpired();
    error SoulboundToken();
    error InvalidExpiration();
    error InsufficientPayment();
    error InvalidMonths();
    error NoFundsToWithdraw();

    /// @notice Constructor sets the contract owner and token metadata
    /// @param _name Name of the token collection
    /// @param _symbol Symbol of the token collection 
    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        owner = msg.sender;
        pricePerMonth = 0; // Initial price is 0, must be set by owner
    }

    /// @notice Modifier to check if caller is the owner
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /// @notice Mint a new SBT token with expiration date (owner only, free)
    /// @param to Address to mint the token to
    /// @param expirationTimestamp Unix timestamp when the token expires
    /// @return tokenId The ID of the newly minted token
    function mint(address to, uint256 expirationTimestamp) external onlyOwner returns (uint256) {
        if (expirationTimestamp <= block.timestamp) revert InvalidExpiration();
        
        _tokenCounter++;
        uint256 tokenId = _tokenCounter;

        _owners[tokenId] = to;
        _balances[to]++;
        _expirations[tokenId] = expirationTimestamp;

        emit Transfer(address(0), to, tokenId);
        emit TokenMinted(to, tokenId, expirationTimestamp);

        return tokenId;
    }

    /// @notice Set the price per month for token purchases
    /// @param _pricePerMonth Price in wei per month
    function setPricePerMonth(uint256 _pricePerMonth) external onlyOwner {
        pricePerMonth = _pricePerMonth;
        emit PriceUpdated(_pricePerMonth);
    }

    /// @notice Purchase a token by paying ETH
    /// @param months Number of months for the token validity
    /// @return tokenId The ID of the newly purchased token
    function purchaseToken(uint256 months) external payable returns (uint256) {
        if (months == 0) revert InvalidMonths();
        if (pricePerMonth == 0) revert InvalidMonths(); // Price must be set
        
        uint256 totalPrice = months * pricePerMonth;
        if (msg.value < totalPrice) revert InsufficientPayment();

        // Calculate expiration timestamp (30 days per month)
        uint256 expirationTimestamp = block.timestamp + (months * 30 days);
        
        _tokenCounter++;
        uint256 tokenId = _tokenCounter;

        _owners[tokenId] = msg.sender;
        _balances[msg.sender]++;
        _expirations[tokenId] = expirationTimestamp;

        emit Transfer(address(0), msg.sender, tokenId);
        emit TokenMinted(msg.sender, tokenId, expirationTimestamp);
        emit TokenPurchased(msg.sender, tokenId, months, msg.value);

        // Refund excess payment if any
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }

        return tokenId;
    }

    /// @notice Withdraw funds from the contract (owner only)
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoFundsToWithdraw();
        
        payable(owner).transfer(balance);
        emit FundsWithdrawn(owner, balance);
    }

    /// @notice Check if a token is valid (exists and not expired)
    /// @param tokenId The token ID to check
    /// @return true if the token is valid, false otherwise
    function isValid(uint256 tokenId) public view returns (bool) {
        if (_owners[tokenId] == address(0)) return false;
        return _expirations[tokenId] > block.timestamp;
    }

    /// @notice Get the expiration timestamp of a token
    /// @param tokenId The token ID
    /// @return The expiration timestamp, or 0 if token doesn't exist
    function getExpiration(uint256 tokenId) external view returns (uint256) {
        return _expirations[tokenId];
    }

    /// @notice Burn an expired token
    /// @param tokenId The token ID to burn
    function burnExpired(uint256 tokenId) external {
        address tokenOwner = _owners[tokenId];
        if (tokenOwner == address(0)) revert TokenNotExists();
        
        if (_expirations[tokenId] > block.timestamp) revert TokenNotExpired();

        _burn(tokenId);
        emit TokenExpired(tokenId);
    }

    /// @notice Internal function to burn a token
    /// @param tokenId The token ID to burn
    function _burn(uint256 tokenId) internal {
        address tokenOwner = _owners[tokenId];
        
        // Clear approvals
        _approve(address(0), tokenId);

        _balances[tokenOwner]--;
        delete _owners[tokenId];
        delete _expirations[tokenId];

        emit Transfer(tokenOwner, address(0), tokenId);
        emit TokenBurned(tokenId);
    }

    // ============ ERC-721 Implementation ============

    /// @notice Returns the number of tokens owned by an address
    /// @param _owner The address to query
    /// @return The number of tokens owned
    function balanceOf(address _owner) external view override returns (uint256) {
        if (_owner == address(0)) revert();
        return _balances[_owner];
    }

    /// @notice Returns the owner of a token
    /// @param _tokenId The token ID
    /// @return The owner address
    function ownerOf(uint256 _tokenId) external view override returns (address) {
        address tokenOwner = _owners[_tokenId];
        if (tokenOwner == address(0)) revert TokenNotExists();
        return tokenOwner;
    }

    /// @notice Approve an address to transfer a token (DISABLED - Soulbound)
    /// @dev This function always reverts as tokens are non-transferable
    function approve(address, uint256) external payable override {
        revert SoulboundToken();
    }

    /// @notice Get the approved address for a token
    /// @param _tokenId The token ID
    /// @return The approved address (always address(0) for SBTs)
    function getApproved(uint256 _tokenId) external view override returns (address) {
        if (_owners[_tokenId] == address(0)) revert TokenNotExists();
        return address(0);
    }

    /// @notice Set approval for all tokens (DISABLED - Soulbound)
    /// @dev This function always reverts as tokens are non-transferable
    function setApprovalForAll(address, bool) external pure override {
        revert SoulboundToken();
    }

    /// @notice Check if an operator is approved for all tokens of an owner
    /// @return Always false for SBTs
    function isApprovedForAll(address /* _owner */, address /* _operator */) external pure override returns (bool) {
        return false;
    }

    /// @notice Transfer a token (DISABLED - Soulbound)
    /// @dev This function always reverts as tokens are non-transferable
    function transferFrom(address, address, uint256) external payable override {
        revert SoulboundToken();
    }

    /// @notice Safely transfer a token (DISABLED - Soulbound)
    /// @dev This function always reverts as tokens are non-transferable
    function safeTransferFrom(address, address, uint256) external payable override {
        revert SoulboundToken();
    }

    /// @notice Safely transfer a token with data (DISABLED - Soulbound)
    /// @dev This function always reverts as tokens are non-transferable
    function safeTransferFrom(address, address, uint256, bytes calldata) external payable override {
        revert SoulboundToken();
    }

    /// @notice Internal function to approve an address for a token
    /// @param to The address to approve
    /// @param tokenId The token ID
    function _approve(address to, uint256 tokenId) internal {
        _tokenApprovals[tokenId] = to;
        emit Approval(_owners[tokenId], to, tokenId);
    }

    // ============ ERC-165 Implementation ============

    /// @notice Check if the contract supports an interface
    /// @param interfaceId The interface identifier
    /// @return true if the interface is supported
    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == _INTERFACE_ID_ERC165 || interfaceId == _INTERFACE_ID_ERC721;
    }
}

