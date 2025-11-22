// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title JubyVault
 * @notice Goal-based savings vault with early withdrawal penalties
 * @dev Integrates with Morpho (ERC4626) vaults for yield generation
 *
 * Key Features:
 * - Users set a goal date when depositing
 * - Funds are deposited into Morpho vault for yield
 * - Early withdrawal (before goal): Juby keeps 50% of earned yield
 * - On-time withdrawal (after goal): User gets 100% of yield
 * - Designed for World Chain with MiniKit sendTransaction integration
 */
contract JubyVault {
    // Underlying asset (USDC)
    address public immutable asset;

    // Morpho vault (ERC4626 compliant)
    address public immutable morphoVault;

    // Juby treasury for collected penalties
    address public jubyTreasury;

    // Owner for admin functions
    address public owner;

    // User deposit tracking
    struct UserDeposit {
        uint256 shares; // Morpho vault shares owned
        uint256 principal; // Original USDC deposited
        uint256 goalDate; // Target withdrawal date (Unix timestamp)
        uint256 depositDate; // When deposit was made
        bool exists; // Whether deposit exists
    }

    mapping(address => UserDeposit) public deposits;

    // Events
    event Deposited(
        address indexed user,
        uint256 amount,
        uint256 shares,
        uint256 goalDate,
        uint256 depositDate
    );

    event Withdrawn(
        address indexed user,
        uint256 principal,
        uint256 yield,
        uint256 penalty,
        uint256 totalReceived,
        bool isEarly
    );

    event PenaltyCollected(address indexed user, uint256 amount);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    constructor(address _asset, address _morphoVault, address _jubyTreasury) {
        require(_asset != address(0), "Invalid asset");
        require(_morphoVault != address(0), "Invalid vault");
        require(_jubyTreasury != address(0), "Invalid treasury");

        asset = _asset;
        morphoVault = _morphoVault;
        jubyTreasury = _jubyTreasury;
        owner = msg.sender;
    }

    /**
     * @notice Deposit USDC with a savings goal date
     * @param amount Amount of USDC to deposit
     * @param goalDate Target withdrawal date (Unix timestamp)
     * @dev User must approve this contract to spend USDC before calling
     */
    function deposit(uint256 amount, uint256 goalDate) external returns (uint256 shares) {
        require(amount > 0, "Cannot deposit 0");
        require(goalDate > block.timestamp, "Goal date must be in future");
        require(!deposits[msg.sender].exists, "Existing deposit found. Withdraw first.");

        // Transfer USDC from user to this contract
        _transferFrom(asset, msg.sender, address(this), amount);

        // Approve Morpho vault to spend USDC
        _approve(asset, morphoVault, amount);

        // Deposit into Morpho vault and receive shares
        shares = _depositToMorpho(amount);

        // Record user's deposit
        deposits[msg.sender] = UserDeposit({
            shares: shares,
            principal: amount,
            goalDate: goalDate,
            depositDate: block.timestamp,
            exists: true
        });

        emit Deposited(msg.sender, amount, shares, goalDate, block.timestamp);

        return shares;
    }

    /**
     * @notice Withdraw savings with penalty if before goal date
     * @dev Early withdrawal: 50% of yield goes to Juby treasury
     *      On-time withdrawal: User receives 100% of funds + yield
     */
    function withdraw() external returns (uint256 totalReceived) {
        UserDeposit memory userDeposit = deposits[msg.sender];
        require(userDeposit.exists, "No deposit found");

        // Calculate current value of shares in the Morpho vault
        uint256 currentValue = _convertToAssets(userDeposit.shares);

        // Calculate yield earned
        uint256 yield = currentValue > userDeposit.principal
            ? currentValue - userDeposit.principal
            : 0;

        // Check if withdrawal is early
        bool isEarly = block.timestamp < userDeposit.goalDate;

        uint256 penalty = 0;
        uint256 userReceives = 0;

        if (isEarly && yield > 0) {
            // Early withdrawal: Juby keeps 50% of yield
            penalty = yield / 2;
            userReceives = userDeposit.principal + (yield - penalty);
        } else {
            // On-time or no yield: User gets everything
            userReceives = currentValue;
        }

        // Delete user deposit
        delete deposits[msg.sender];

        // Redeem shares from Morpho vault
        uint256 assetsReceived = _redeemFromMorpho(userDeposit.shares);

        // Ensure we received expected amount (slippage check)
        require(assetsReceived >= currentValue - 10, "Slippage too high"); // Allow 10 unit tolerance

        // Transfer penalty to treasury if applicable
        if (penalty > 0) {
            _transfer(asset, jubyTreasury, penalty);
            emit PenaltyCollected(msg.sender, penalty);
        }

        // Transfer remaining to user
        _transfer(asset, msg.sender, userReceives);

        emit Withdrawn(
            msg.sender,
            userDeposit.principal,
            yield,
            penalty,
            userReceives,
            isEarly
        );

        return userReceives;
    }

    /**
     * @notice Get user's current deposit information
     * @param user Address of the user
     * @return principal Original amount deposited
     * @return currentValue Current value including yield
     * @return yield Amount of yield earned
     * @return goalDate Target withdrawal date
     * @return isEarly Whether current time is before goal date
     * @return potentialPenalty Penalty if withdrawn now (0 if on-time)
     */
    function getUserInfo(address user)
        external
        view
        returns (
            uint256 principal,
            uint256 currentValue,
            uint256 yield,
            uint256 goalDate,
            bool isEarly,
            uint256 potentialPenalty
        )
    {
        UserDeposit memory userDeposit = deposits[user];

        if (!userDeposit.exists) {
            return (0, 0, 0, 0, false, 0);
        }

        principal = userDeposit.principal;
        currentValue = _convertToAssets(userDeposit.shares);
        yield = currentValue > principal ? currentValue - principal : 0;
        goalDate = userDeposit.goalDate;
        isEarly = block.timestamp < goalDate;
        potentialPenalty = (isEarly && yield > 0) ? yield / 2 : 0;

        return (principal, currentValue, yield, goalDate, isEarly, potentialPenalty);
    }

    /**
     * @notice Calculate withdrawal preview
     * @param user Address of the user
     * @return userWillReceive Amount user will receive if withdrawn now
     * @return penaltyAmount Penalty that will be charged
     */
    function previewWithdrawal(address user)
        external
        view
        returns (uint256 userWillReceive, uint256 penaltyAmount)
    {
        UserDeposit memory userDeposit = deposits[user];

        if (!userDeposit.exists) {
            return (0, 0);
        }

        uint256 currentValue = _convertToAssets(userDeposit.shares);
        uint256 yield = currentValue > userDeposit.principal
            ? currentValue - userDeposit.principal
            : 0;

        bool isEarly = block.timestamp < userDeposit.goalDate;

        if (isEarly && yield > 0) {
            penaltyAmount = yield / 2;
            userWillReceive = userDeposit.principal + (yield - penaltyAmount);
        } else {
            penaltyAmount = 0;
            userWillReceive = currentValue;
        }

        return (userWillReceive, penaltyAmount);
    }

    // Admin Functions

    /**
     * @notice Update Juby treasury address
     * @param newTreasury New treasury address
     */
    function updateTreasury(address newTreasury) external {
        require(msg.sender == owner, "Only owner");
        require(newTreasury != address(0), "Invalid treasury");

        address oldTreasury = jubyTreasury;
        jubyTreasury = newTreasury;

        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @notice Transfer ownership
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "Only owner");
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }

    // Internal Functions - Morpho Vault Interactions

    function _depositToMorpho(uint256 assets) internal returns (uint256 shares) {
        (bool success, bytes memory data) = morphoVault.call(
            abi.encodeWithSignature("deposit(uint256,address)", assets, address(this))
        );
        require(success, "Morpho deposit failed");
        shares = abi.decode(data, (uint256));
        return shares;
    }

    function _redeemFromMorpho(uint256 shares) internal returns (uint256 assets) {
        (bool success, bytes memory data) = morphoVault.call(
            abi.encodeWithSignature(
                "redeem(uint256,address,address)",
                shares,
                address(this),
                address(this)
            )
        );
        require(success, "Morpho redeem failed");
        assets = abi.decode(data, (uint256));
        return assets;
    }

    function _convertToAssets(uint256 shares) internal view returns (uint256) {
        (bool success, bytes memory data) = morphoVault.staticcall(
            abi.encodeWithSignature("convertToAssets(uint256)", shares)
        );
        require(success, "convertToAssets failed");
        return abi.decode(data, (uint256));
    }

    // Internal Functions - Token Operations

    function _transfer(address token, address to, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
    }

    function _transferFrom(address token, address from, address to, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", from, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "TransferFrom failed");
    }

    function _approve(address token, address spender, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("approve(address,uint256)", spender, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Approve failed");
    }
}
