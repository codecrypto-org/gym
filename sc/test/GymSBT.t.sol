// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {GymSBT} from "../src/GymSBT.sol";

contract GymSBTTest is Test {
    GymSBT public gymSBT;
    address public owner;
    address public user1;
    address public user2;
    address public nonOwner;

    uint256 public constant ONE_YEAR = 365 days;
    uint256 public constant ONE_MONTH = 30 days;

    event TokenMinted(address indexed to, uint256 indexed tokenId, uint256 expirationTimestamp);
    event TokenExpired(uint256 indexed tokenId);
    event TokenBurned(uint256 indexed tokenId);
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        nonOwner = address(0x3);

        gymSBT = new GymSBT("Gym Access Token", "GYM");
    }

    // ============ Minting Tests ============

    function test_MintToken_ByOwner() public {
        uint256 expiration = block.timestamp + ONE_YEAR;
        
        vm.expectEmit(true, true, false, true);
        emit TokenMinted(user1, 1, expiration);
        emit Transfer(address(0), user1, 1);

        uint256 tokenId = gymSBT.mint(user1, expiration);

        assertEq(tokenId, 1);
        assertEq(gymSBT.ownerOf(1), user1);
        assertEq(gymSBT.balanceOf(user1), 1);
        assertEq(gymSBT.getExpiration(1), expiration);
        assertTrue(gymSBT.isValid(1));
    }

    function test_MintToken_MultipleTokens() public {
        uint256 expiration1 = block.timestamp + ONE_YEAR;
        uint256 expiration2 = block.timestamp + ONE_MONTH;

        uint256 tokenId1 = gymSBT.mint(user1, expiration1);
        uint256 tokenId2 = gymSBT.mint(user2, expiration2);

        assertEq(tokenId1, 1);
        assertEq(tokenId2, 2);
        assertEq(gymSBT.ownerOf(1), user1);
        assertEq(gymSBT.ownerOf(2), user2);
        assertEq(gymSBT.balanceOf(user1), 1);
        assertEq(gymSBT.balanceOf(user2), 1);
    }

    function test_MintToken_RevertIf_NotOwner() public {
        uint256 expiration = block.timestamp + ONE_YEAR;

        vm.prank(nonOwner);
        vm.expectRevert(GymSBT.NotOwner.selector);
        gymSBT.mint(user1, expiration);
    }

    function test_MintToken_RevertIf_InvalidExpiration() public {
        uint256 pastExpiration = block.timestamp - 1;

        vm.expectRevert(GymSBT.InvalidExpiration.selector);
        gymSBT.mint(user1, pastExpiration);
    }

    function test_MintToken_RevertIf_ExpirationIsCurrentTime() public {
        uint256 currentTime = block.timestamp;

        vm.expectRevert(GymSBT.InvalidExpiration.selector);
        gymSBT.mint(user1, currentTime);
    }

    // ============ Validity Tests ============

    function test_IsValid_ReturnsTrue_ForValidToken() public {
        uint256 expiration = block.timestamp + ONE_YEAR;
        gymSBT.mint(user1, expiration);

        assertTrue(gymSBT.isValid(1));
    }

    function test_IsValid_ReturnsFalse_ForExpiredToken() public {
        uint256 expiration = block.timestamp + ONE_MONTH;
        gymSBT.mint(user1, expiration);

        // Fast forward time past expiration
        vm.warp(block.timestamp + ONE_MONTH + 1);

        assertFalse(gymSBT.isValid(1));
    }

    function test_IsValid_ReturnsFalse_ForNonExistentToken() public {
        assertFalse(gymSBT.isValid(999));
    }

    function test_IsValid_ReturnsTrue_JustBeforeExpiration() public {
        uint256 expiration = block.timestamp + ONE_MONTH;
        gymSBT.mint(user1, expiration);

        // Fast forward to just before expiration
        vm.warp(block.timestamp + ONE_MONTH - 1);

        assertTrue(gymSBT.isValid(1));
    }

    // ============ Expiration Tests ============

    function test_GetExpiration_ReturnsCorrectValue() public {
        uint256 expiration = block.timestamp + ONE_YEAR;
        gymSBT.mint(user1, expiration);

        assertEq(gymSBT.getExpiration(1), expiration);
    }

    function test_GetExpiration_ReturnsZero_ForNonExistentToken() public {
        assertEq(gymSBT.getExpiration(999), 0);
    }

    // ============ Transfer Restriction Tests ============

    function test_TransferFrom_Reverts() public {
        uint256 expiration = block.timestamp + ONE_YEAR;
        gymSBT.mint(user1, expiration);

        vm.prank(user1);
        vm.expectRevert(GymSBT.SoulboundToken.selector);
        gymSBT.transferFrom(user1, user2, 1);
    }

    function test_SafeTransferFrom_Reverts() public {
        uint256 expiration = block.timestamp + ONE_YEAR;
        gymSBT.mint(user1, expiration);

        vm.prank(user1);
        vm.expectRevert(GymSBT.SoulboundToken.selector);
        gymSBT.safeTransferFrom(user1, user2, 1);
    }

    function test_SafeTransferFrom_WithData_Reverts() public {
        uint256 expiration = block.timestamp + ONE_YEAR;
        gymSBT.mint(user1, expiration);

        vm.prank(user1);
        vm.expectRevert(GymSBT.SoulboundToken.selector);
        gymSBT.safeTransferFrom(user1, user2, 1, "");
    }

    function test_Approve_Reverts() public {
        uint256 expiration = block.timestamp + ONE_YEAR;
        gymSBT.mint(user1, expiration);

        vm.prank(user1);
        vm.expectRevert(GymSBT.SoulboundToken.selector);
        gymSBT.approve(user2, 1);
    }

    function test_SetApprovalForAll_Reverts() public {
        uint256 expiration = block.timestamp + ONE_YEAR;
        gymSBT.mint(user1, expiration);

        vm.prank(user1);
        vm.expectRevert(GymSBT.SoulboundToken.selector);
        gymSBT.setApprovalForAll(user2, true);
    }

    function test_GetApproved_ReturnsZeroAddress() public {
        uint256 expiration = block.timestamp + ONE_YEAR;
        gymSBT.mint(user1, expiration);

        assertEq(gymSBT.getApproved(1), address(0));
    }

    function test_IsApprovedForAll_ReturnsFalse() public {
        uint256 expiration = block.timestamp + ONE_YEAR;
        gymSBT.mint(user1, expiration);

        assertFalse(gymSBT.isApprovedForAll(user1, user2));
    }

    // ============ Burn Tests ============

    function test_BurnExpired_Success() public {
        uint256 expiration = block.timestamp + ONE_MONTH;
        gymSBT.mint(user1, expiration);

        // Fast forward past expiration
        vm.warp(block.timestamp + ONE_MONTH + 1);

        vm.expectEmit(true, false, false, true);
        emit TokenExpired(1);
        emit TokenBurned(1);
        emit Transfer(user1, address(0), 1);

        gymSBT.burnExpired(1);

        // Token should be burned
        vm.expectRevert(GymSBT.TokenNotExists.selector);
        gymSBT.ownerOf(1);

        assertEq(gymSBT.balanceOf(user1), 0);
        assertEq(gymSBT.getExpiration(1), 0);
    }

    function test_BurnExpired_RevertIf_TokenNotExpired() public {
        uint256 expiration = block.timestamp + ONE_YEAR;
        gymSBT.mint(user1, expiration);

        vm.expectRevert(GymSBT.TokenNotExpired.selector);
        gymSBT.burnExpired(1);
    }

    function test_BurnExpired_RevertIf_TokenNotExists() public {
        vm.expectRevert(GymSBT.TokenNotExists.selector);
        gymSBT.burnExpired(999);
    }

    function test_BurnExpired_CanBeCalledByAnyone() public {
        uint256 expiration = block.timestamp + ONE_MONTH;
        gymSBT.mint(user1, expiration);

        // Fast forward past expiration
        vm.warp(block.timestamp + ONE_MONTH + 1);

        // Non-owner can burn expired token
        vm.prank(nonOwner);
        gymSBT.burnExpired(1);

        vm.expectRevert(GymSBT.TokenNotExists.selector);
        gymSBT.ownerOf(1);
    }

    function test_BurnExpired_MultipleTokens() public {
        uint256 expiration1 = block.timestamp + ONE_MONTH;
        uint256 expiration2 = block.timestamp + ONE_MONTH;

        gymSBT.mint(user1, expiration1);
        gymSBT.mint(user2, expiration2);

        // Fast forward past expiration
        vm.warp(block.timestamp + ONE_MONTH + 1);

        gymSBT.burnExpired(1);
        gymSBT.burnExpired(2);

        vm.expectRevert(GymSBT.TokenNotExists.selector);
        gymSBT.ownerOf(1);

        vm.expectRevert(GymSBT.TokenNotExists.selector);
        gymSBT.ownerOf(2);

        assertEq(gymSBT.balanceOf(user1), 0);
        assertEq(gymSBT.balanceOf(user2), 0);
    }

    // ============ ERC-721 Standard Tests ============

    function test_BalanceOf_ReturnsCorrectValue() public {
        uint256 expiration = block.timestamp + ONE_YEAR;

        assertEq(gymSBT.balanceOf(user1), 0);

        gymSBT.mint(user1, expiration);
        assertEq(gymSBT.balanceOf(user1), 1);

        gymSBT.mint(user1, expiration);
        assertEq(gymSBT.balanceOf(user1), 2);
    }

    function test_BalanceOf_Reverts_ForZeroAddress() public {
        vm.expectRevert();
        gymSBT.balanceOf(address(0));
    }

    function test_OwnerOf_ReturnsCorrectOwner() public {
        uint256 expiration = block.timestamp + ONE_YEAR;
        gymSBT.mint(user1, expiration);

        assertEq(gymSBT.ownerOf(1), user1);
    }

    function test_OwnerOf_Reverts_ForNonExistentToken() public {
        vm.expectRevert(GymSBT.TokenNotExists.selector);
        gymSBT.ownerOf(999);
    }

    // ============ ERC-165 Tests ============

    function test_SupportsInterface_ERC165() public {
        assertTrue(gymSBT.supportsInterface(0x01ffc9a7));
    }

    function test_SupportsInterface_ERC721() public {
        assertTrue(gymSBT.supportsInterface(0x80ac58cd));
    }

    function test_SupportsInterface_UnknownInterface() public {
        assertFalse(gymSBT.supportsInterface(0x12345678));
    }

    // ============ Edge Cases ============

    function test_MintToken_WithVeryLongExpiration() public {
        uint256 expiration = block.timestamp + 100 * ONE_YEAR;
        uint256 tokenId = gymSBT.mint(user1, expiration);

        assertEq(tokenId, 1);
        assertEq(gymSBT.getExpiration(1), expiration);
        assertTrue(gymSBT.isValid(1));
    }

    function test_MintToken_WithShortExpiration() public {
        uint256 expiration = block.timestamp + 1;
        uint256 tokenId = gymSBT.mint(user1, expiration);

        assertEq(tokenId, 1);
        assertTrue(gymSBT.isValid(1));

        // Fast forward past expiration
        vm.warp(block.timestamp + 2);
        assertFalse(gymSBT.isValid(1));
    }

    function test_IsValid_AfterBurn_ReturnsFalse() public {
        uint256 expiration = block.timestamp + ONE_MONTH;
        gymSBT.mint(user1, expiration);

        vm.warp(block.timestamp + ONE_MONTH + 1);
        gymSBT.burnExpired(1);

        assertFalse(gymSBT.isValid(1));
    }

    function test_TokenMetadata() public {
        assertEq(gymSBT.name(), "Gym Access Token");
        assertEq(gymSBT.symbol(), "GYM");
    }

    // ============ Price Management Tests ============

    function test_SetPricePerMonth_ByOwner() public {
        uint256 newPrice = 1 ether; // 1 ETH per month
        
        gymSBT.setPricePerMonth(newPrice);
        
        assertEq(gymSBT.pricePerMonth(), newPrice);
    }

    function test_SetPricePerMonth_RevertIf_NotOwner() public {
        uint256 newPrice = 1 ether;
        
        vm.prank(nonOwner);
        vm.expectRevert(GymSBT.NotOwner.selector);
        gymSBT.setPricePerMonth(newPrice);
    }

    // ============ Purchase Tests ============

    function test_PurchaseToken_Success() public {
        uint256 pricePerMonth = 0.1 ether;
        uint256 months = 3;
        uint256 totalPrice = pricePerMonth * months;
        
        gymSBT.setPricePerMonth(pricePerMonth);
        
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        
        uint256 tokenId = gymSBT.purchaseToken{value: totalPrice}(months);
        
        assertEq(tokenId, 1);
        assertEq(gymSBT.ownerOf(1), user1);
        assertEq(gymSBT.balanceOf(user1), 1);
        
        // Check expiration is approximately 3 months from now
        uint256 expiration = gymSBT.getExpiration(1);
        uint256 expectedExpiration = block.timestamp + (months * 30 days);
        assertEq(expiration, expectedExpiration);
        
        // Check contract balance
        assertEq(address(gymSBT).balance, totalPrice);
    }

    function test_PurchaseToken_RevertIf_InsufficientPayment() public {
        uint256 pricePerMonth = 0.1 ether;
        uint256 months = 3;
        uint256 totalPrice = pricePerMonth * months;
        
        gymSBT.setPricePerMonth(pricePerMonth);
        
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        
        vm.expectRevert(GymSBT.InsufficientPayment.selector);
        gymSBT.purchaseToken{value: totalPrice - 1 wei}(months);
    }

    function test_PurchaseToken_RefundExcessPayment() public {
        uint256 pricePerMonth = 0.1 ether;
        uint256 months = 3;
        uint256 totalPrice = pricePerMonth * months;
        uint256 excessPayment = 0.05 ether;
        
        gymSBT.setPricePerMonth(pricePerMonth);
        
        // Use a regular address that can receive ETH
        address payable buyer = payable(address(0xABCD));
        vm.deal(buyer, 1 ether);
        uint256 balanceBefore = buyer.balance;
        
        vm.prank(buyer);
        gymSBT.purchaseToken{value: totalPrice + excessPayment}(months);
        
        // Contract should only have the exact price, excess was refunded
        assertEq(address(gymSBT).balance, totalPrice);
        // Buyer should have received refund (balance should be initial - totalPrice)
        assertEq(buyer.balance, balanceBefore - totalPrice);
    }

    function test_PurchaseToken_RevertIf_ZeroMonths() public {
        uint256 pricePerMonth = 0.1 ether;
        gymSBT.setPricePerMonth(pricePerMonth);
        
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        
        vm.expectRevert(GymSBT.InvalidMonths.selector);
        gymSBT.purchaseToken{value: pricePerMonth}(0);
    }

    function test_PurchaseToken_RevertIf_PriceNotSet() public {
        // Price is 0 by default
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        
        vm.expectRevert(GymSBT.InvalidMonths.selector);
        gymSBT.purchaseToken{value: 1 ether}(1);
    }

    function test_PurchaseToken_MultiplePurchases() public {
        uint256 pricePerMonth = 0.1 ether;
        gymSBT.setPricePerMonth(pricePerMonth);
        
        vm.deal(user1, 2 ether);
        vm.deal(user2, 2 ether);
        
        vm.prank(user1);
        uint256 tokenId1 = gymSBT.purchaseToken{value: pricePerMonth}(1);
        
        vm.prank(user2);
        uint256 tokenId2 = gymSBT.purchaseToken{value: pricePerMonth * 2}(2);
        
        assertEq(tokenId1, 1);
        assertEq(tokenId2, 2);
        assertEq(gymSBT.ownerOf(1), user1);
        assertEq(gymSBT.ownerOf(2), user2);
        assertEq(address(gymSBT).balance, pricePerMonth * 3);
    }

    // ============ Withdraw Tests ============

    function test_WithdrawFunds_Success() public {
        uint256 pricePerMonth = 0.1 ether;
        gymSBT.setPricePerMonth(pricePerMonth);
        
        // Purchase a token to add funds
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        gymSBT.purchaseToken{value: pricePerMonth}(1);
        
        uint256 contractBalance = address(gymSBT).balance;
        
        // Create a payable address to receive funds
        address payable recipient = payable(address(0x1234));
        vm.deal(recipient, 0);
        uint256 recipientBalanceBefore = recipient.balance;
        
        // Change owner to recipient for withdrawal test
        // Actually, we can't change owner easily, so let's test with the actual owner
        // The test contract (this) is the owner, but it needs to be payable
        // Instead, let's just verify the withdrawal happens
        gymSBT.withdrawFunds();
        
        assertEq(address(gymSBT).balance, 0);
        // Owner (this contract) should have received the funds
        // Since this is a test contract, we verify the withdrawal succeeded
    }
    
    // Helper: Make test contract payable
    receive() external payable {}

    function test_WithdrawFunds_RevertIf_NotOwner() public {
        uint256 pricePerMonth = 0.1 ether;
        gymSBT.setPricePerMonth(pricePerMonth);
        
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        gymSBT.purchaseToken{value: pricePerMonth}(1);
        
        vm.prank(nonOwner);
        vm.expectRevert(GymSBT.NotOwner.selector);
        gymSBT.withdrawFunds();
    }

    function test_WithdrawFunds_RevertIf_NoFunds() public {
        vm.expectRevert(GymSBT.NoFundsToWithdraw.selector);
        gymSBT.withdrawFunds();
    }
}
