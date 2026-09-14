// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Test-only stand-in for a deflationary/fee-on-transfer token: burns a flat 5% of every
/// transfer, so TokenLocker's "credit what actually arrived" balance-diff logic can be verified.
contract MockFeeOnTransferERC20 is ERC20 {
    uint256 public constant FEE_BPS = 500;

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0) && to != address(0)) {
            uint256 fee = (value * FEE_BPS) / 10_000;
            super._update(from, address(0xdead), fee);
            value -= fee;
        }
        super._update(from, to, value);
    }
}
