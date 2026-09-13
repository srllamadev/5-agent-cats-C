// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AuditPaywall {
    address public owner;
    uint256 public auditFee;

    event AuditPaid(address indexed user, string auditId, uint256 amount);

    constructor() {
        owner = msg.sender;
        auditFee = 0.1 ether; // 0.1 AVAX on Avalanche
    }

    // Function to pay for an audit
    function payForAudit(string memory auditId) public payable {
        require(msg.value >= auditFee, "Insufficient AVAX sent for audit");
        emit AuditPaid(msg.sender, auditId, msg.value);
    }

    // Update the fee
    function setAuditFee(uint256 _newFee) public {
        require(msg.sender == owner, "Only owner can set fee");
        auditFee = _newFee;
    }

    // Withdraw collected funds
    function withdraw() public {
        require(msg.sender == owner, "Only owner can withdraw");
        payable(owner).transfer(address(this).balance);
    }
}
