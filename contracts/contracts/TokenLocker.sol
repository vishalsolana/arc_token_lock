// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title TokenLocker
/// @notice Permissionless escrow for locking any ERC-20 supply until a chosen unlock time, so a
/// token creator (or anyone) can prove on-chain that a balance can't move until then. Unlock
/// dates can only ever be pushed later, never pulled earlier, and the contract has no admin
/// surface over anyone's locked funds — the owner can only adjust the flat native-asset fee
/// charged per lock and where it's sent, never touch escrowed tokens.
contract TokenLocker is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Lock {
        address token;
        address owner;
        uint256 amount;
        uint256 unlockTime;
        uint256 createdAt;
        bool withdrawn;
    }

    uint256 public lockFee;
    address public feeTreasury;

    Lock[] private _locks;
    mapping(address => uint256[]) private _locksByOwner;
    mapping(address => uint256[]) private _locksByToken;

    event LockFeeUpdated(uint256 fee, address treasury);
    event Locked(
        uint256 indexed lockId,
        address indexed token,
        address indexed owner,
        uint256 amount,
        uint256 unlockTime
    );
    event LockExtended(uint256 indexed lockId, uint256 newUnlockTime);
    event LockWithdrawn(uint256 indexed lockId, address indexed to, uint256 amount);
    event LockOwnershipTransferred(uint256 indexed lockId, address indexed oldOwner, address indexed newOwner);

    error ZeroAmount();
    error UnlockTimeNotInFuture();
    error InsufficientLockFee();
    error NoTokensReceived();
    error NotLockOwner();
    error UnlockTimeCannotMoveEarlier();
    error StillLocked();
    error AlreadyWithdrawn();
    error ZeroAddress();
    error NativeFeeTransferFailed();

    constructor(address owner_, address feeTreasury_) Ownable(owner_) {
        feeTreasury = feeTreasury_;
    }

    // ---------------------------------------------------------------------
    // Owner configuration — fee terms only, never touches escrowed tokens.
    // ---------------------------------------------------------------------

    function setLockFee(uint256 fee, address treasury) external onlyOwner {
        if (treasury == address(0)) revert ZeroAddress();
        lockFee = fee;
        feeTreasury = treasury;
        emit LockFeeUpdated(fee, treasury);
    }

    // ---------------------------------------------------------------------
    // Locking
    // ---------------------------------------------------------------------

    /// @notice Locks `amount` of `token` until `unlockTime`. Pulls tokens via transferFrom and
    /// records the balance actually received, so fee-on-transfer/deflationary tokens are handled
    /// correctly instead of over-crediting the lock.
    function lock(address token, uint256 amount, uint256 unlockTime) external payable nonReentrant returns (uint256 lockId) {
        if (amount == 0) revert ZeroAmount();
        if (unlockTime <= block.timestamp) revert UnlockTimeNotInFuture();
        if (msg.value < lockFee) revert InsufficientLockFee();

        IERC20 erc20 = IERC20(token);
        uint256 before = erc20.balanceOf(address(this));
        erc20.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = erc20.balanceOf(address(this)) - before;
        if (received == 0) revert NoTokensReceived();

        lockId = _locks.length;
        _locks.push(Lock({
            token: token,
            owner: msg.sender,
            amount: received,
            unlockTime: unlockTime,
            createdAt: block.timestamp,
            withdrawn: false
        }));
        _locksByOwner[msg.sender].push(lockId);
        _locksByToken[token].push(lockId);

        _settleFee();

        emit Locked(lockId, token, msg.sender, received, unlockTime);
    }

    /// @notice Pushes a lock's unlock time later. Reverts if `newUnlockTime` would move it
    /// earlier — locks can only ever become stricter, never looser, which is the whole point of
    /// using this as a public trust signal.
    function extendLock(uint256 lockId, uint256 newUnlockTime) external {
        Lock storage l = _locks[lockId];
        if (msg.sender != l.owner) revert NotLockOwner();
        if (l.withdrawn) revert AlreadyWithdrawn();
        if (newUnlockTime <= l.unlockTime) revert UnlockTimeCannotMoveEarlier();

        l.unlockTime = newUnlockTime;
        emit LockExtended(lockId, newUnlockTime);
    }

    /// @notice Reassigns who controls (can extend/withdraw) a lock, without moving the tokens.
    /// Useful for e.g. handing a lock over to a multisig after creating it from an EOA.
    function transferLockOwnership(uint256 lockId, address newOwner) external {
        if (newOwner == address(0)) revert ZeroAddress();
        Lock storage l = _locks[lockId];
        if (msg.sender != l.owner) revert NotLockOwner();
        if (l.withdrawn) revert AlreadyWithdrawn();

        address old = l.owner;
        l.owner = newOwner;
        _locksByOwner[newOwner].push(lockId);
        emit LockOwnershipTransferred(lockId, old, newOwner);
    }

    function withdraw(uint256 lockId) external nonReentrant {
        Lock storage l = _locks[lockId];
        if (msg.sender != l.owner) revert NotLockOwner();
        if (l.withdrawn) revert AlreadyWithdrawn();
        if (block.timestamp < l.unlockTime) revert StillLocked();

        l.withdrawn = true;
        IERC20(l.token).safeTransfer(l.owner, l.amount);
        emit LockWithdrawn(lockId, l.owner, l.amount);
    }

    /// @dev Forwards exactly `lockFee` to the treasury and refunds any native asset sent beyond
    /// that (e.g. extra attached by mistake) back to the caller.
    function _settleFee() internal {
        if (lockFee > 0) {
            (bool ok, ) = feeTreasury.call{value: lockFee}("");
            if (!ok) revert NativeFeeTransferFailed();
        }
        uint256 refund = msg.value - lockFee;
        if (refund > 0) {
            (bool ok, ) = msg.sender.call{value: refund}("");
            if (!ok) revert NativeFeeTransferFailed();
        }
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function getLock(uint256 lockId) external view returns (Lock memory) {
        return _locks[lockId];
    }

    function locksCount() external view returns (uint256) {
        return _locks.length;
    }

    function locksByOwner(address account) external view returns (uint256[] memory) {
        return _locksByOwner[account];
    }

    function locksByToken(address token) external view returns (uint256[] memory) {
        return _locksByToken[token];
    }
}
