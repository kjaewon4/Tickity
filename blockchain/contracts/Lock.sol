// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title Time-locked Wallet
/// @notice 배포 시점에 예치된 ETH는 unlockTime 이전에는 출금 불가, deployer만 출금 가능
contract Lock {
    uint public unlockTime;
    address payable public owner;

    event Withdrawal(uint amount, uint when);

    /// @param _unlockTime 잠금 해제 시각 (unix timestamp)
    constructor(uint _unlockTime) payable {
        require(
            block.timestamp < _unlockTime,
            "Unlock time should be in the future"
        );
        unlockTime = _unlockTime;
        owner = payable(msg.sender);
    }

    /// @notice 잠금 시간이 지나면 소유자가 컨트랙트에 쌓인 ETH를 인출할 수 있다
    function withdraw() public {
        require(block.timestamp >= unlockTime, "You can't withdraw yet");
        require(msg.sender == owner, "You aren't the owner");

        uint balance = address(this).balance;
        emit Withdrawal(balance, block.timestamp);
        owner.transfer(balance);
    }
}
