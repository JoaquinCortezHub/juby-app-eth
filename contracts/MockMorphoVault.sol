// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockMorphoVault
 * @notice ERC4626-compliant vault following Morpho's conventions and best practices
 * @dev Simulates yield generation (~5% APY) while following Morpho vault mechanics
 *
 * Key Morpho Conventions Implemented:
 * - Dead deposit protection against share inflation attacks
 * - Share price appreciation through yield accrual
 * - Full ERC4626 standard compliance
 * - Proper asset/share conversion mechanisms
 *
 * References:
 * - ERC4626: https://eips.ethereum.org/EIPS/eip-4626
 * - Morpho Docs: https://docs.morpho.org/build/earn/concepts/vault-mechanics
 */
contract MockMorphoVault {
    // ERC20 Metadata for vault shares
    string public constant name = "Mock Morpho USDC Vault";
    string public constant symbol = "mmUSDC";
    uint8 public constant decimals = 6;

    // ERC4626 - The underlying asset (USDC)
    address public immutable asset;

    // Vault state
    uint256 public totalSupply; // Total vault shares
    uint256 private _totalAssets; // Cached total assets

    // Yield simulation
    uint256 public lastYieldUpdate;
    uint256 public constant ANNUAL_YIELD_BPS = 500; // 5% APY in basis points

    // Dead deposit protection (Morpho best practice)
    address private constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    uint256 private constant DEAD_SHARES = 1e9; // Minimum dead shares
    bool private initialized;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares);
    event Withdraw(
        address indexed sender,
        address indexed receiver,
        address indexed owner,
        uint256 assets,
        uint256 shares
    );
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(address _asset) {
        require(_asset != address(0), "Invalid asset");
        asset = _asset;
        lastYieldUpdate = block.timestamp;
    }

    /**
     * @notice Get total assets including accrued yield
     * @dev This returns the current total assets with simulated yield
     */
    function totalAssets() public view returns (uint256) {
        if (_totalAssets == 0) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - lastYieldUpdate;
        if (timeElapsed == 0) {
            return _totalAssets;
        }

        // Calculate accrued yield: (totalAssets * APY * timeElapsed) / (365 days * 10000)
        uint256 yield = (_totalAssets * ANNUAL_YIELD_BPS * timeElapsed) / (365 days * 10000);
        return _totalAssets + yield;
    }

    /**
     * @notice Update cached assets with accrued yield
     * @dev Called before any state-changing operation
     */
    function _accrueYield() internal {
        uint256 newTotalAssets = totalAssets();
        _totalAssets = newTotalAssets;
        lastYieldUpdate = block.timestamp;
    }

    /**
     * @notice Convert assets to shares (ERC4626)
     * @dev Follows Morpho's share pricing: shares appreciate as totalAssets grows
     */
    function convertToShares(uint256 assets) public view returns (uint256) {
        uint256 supply = totalSupply;
        uint256 total = totalAssets();

        // If vault is empty, 1:1 ratio
        if (supply == 0 || total == 0) {
            return assets;
        }

        // shares = (assets * totalSupply) / totalAssets
        // This means as totalAssets grows, same assets = fewer shares (share price up)
        return (assets * supply) / total;
    }

    /**
     * @notice Convert shares to assets (ERC4626)
     * @dev Share price appreciation: as totalAssets grows, shares worth more assets
     */
    function convertToAssets(uint256 shares) public view returns (uint256) {
        uint256 supply = totalSupply;

        if (supply == 0) {
            return shares;
        }

        // assets = (shares * totalAssets) / totalSupply
        return (shares * totalAssets()) / supply;
    }

    /**
     * @notice Deposit assets and receive vault shares (ERC4626)
     * @param assets Amount of underlying assets to deposit
     * @param receiver Address to receive the shares
     * @return shares Amount of shares minted
     */
    function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
        require(assets > 0, "Cannot deposit 0");
        require(receiver != address(0), "Invalid receiver");

        // Accrue yield before calculating shares
        _accrueYield();

        // Initialize dead deposit on first deposit (Morpho best practice)
        if (!initialized) {
            _initializeVault(assets);
            initialized = true;
        }

        shares = convertToShares(assets);
        require(shares > 0, "Zero shares");

        // Transfer assets from sender to vault
        _transferFrom(asset, msg.sender, address(this), assets);

        // Mint shares to receiver
        totalSupply += shares;
        balanceOf[receiver] += shares;
        _totalAssets += assets;

        emit Deposit(msg.sender, receiver, assets, shares);
        emit Transfer(address(0), receiver, shares);

        return shares;
    }

    /**
     * @notice Mint exact shares by depositing calculated assets (ERC4626)
     * @param shares Amount of shares to mint
     * @param receiver Address to receive the shares
     * @return assets Amount of assets deposited
     */
    function mint(uint256 shares, address receiver) external returns (uint256 assets) {
        require(shares > 0, "Cannot mint 0");
        require(receiver != address(0), "Invalid receiver");

        _accrueYield();

        if (!initialized) {
            // For mint during initialization, calculate required assets
            assets = shares; // 1:1 on first deposit
            _initializeVault(assets);
            initialized = true;
        } else {
            assets = convertToAssets(shares);
        }

        require(assets > 0, "Zero assets");

        // Transfer assets from sender to vault
        _transferFrom(asset, msg.sender, address(this), assets);

        // Mint shares to receiver
        totalSupply += shares;
        balanceOf[receiver] += shares;
        _totalAssets += assets;

        emit Deposit(msg.sender, receiver, assets, shares);
        emit Transfer(address(0), receiver, shares);

        return assets;
    }

    /**
     * @notice Withdraw assets by burning shares (ERC4626)
     * @param assets Amount of assets to withdraw
     * @param receiver Address to receive the assets
     * @param owner Address that owns the shares
     * @return shares Amount of shares burned
     */
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares) {
        require(assets > 0, "Cannot withdraw 0");
        require(receiver != address(0), "Invalid receiver");

        _accrueYield();

        shares = convertToShares(assets);
        require(shares > 0, "Zero shares");

        // Check allowance if caller is not the owner
        if (msg.sender != owner) {
            uint256 allowed = allowance[owner][msg.sender];
            require(allowed >= shares, "Insufficient allowance");
            allowance[owner][msg.sender] = allowed - shares;
        }

        require(balanceOf[owner] >= shares, "Insufficient balance");

        // Burn shares from owner
        balanceOf[owner] -= shares;
        totalSupply -= shares;
        _totalAssets -= assets;

        // Transfer assets to receiver
        _transfer(asset, receiver, assets);

        emit Withdraw(msg.sender, receiver, owner, assets, shares);
        emit Transfer(owner, address(0), shares);

        return shares;
    }

    /**
     * @notice Redeem shares for underlying assets (ERC4626)
     * @param shares Amount of shares to redeem
     * @param receiver Address to receive the assets
     * @param owner Address that owns the shares
     * @return assets Amount of assets withdrawn
     */
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets) {
        require(shares > 0, "Cannot redeem 0");
        require(receiver != address(0), "Invalid receiver");

        // Check allowance if caller is not the owner
        if (msg.sender != owner) {
            uint256 allowed = allowance[owner][msg.sender];
            require(allowed >= shares, "Insufficient allowance");
            allowance[owner][msg.sender] = allowed - shares;
        }

        require(balanceOf[owner] >= shares, "Insufficient balance");

        _accrueYield();

        assets = convertToAssets(shares);
        require(assets > 0, "Zero assets");

        // Burn shares from owner
        balanceOf[owner] -= shares;
        totalSupply -= shares;
        _totalAssets -= assets;

        // Transfer assets to receiver
        _transfer(asset, receiver, assets);

        emit Withdraw(msg.sender, receiver, owner, assets, shares);
        emit Transfer(owner, address(0), shares);

        return assets;
    }

    // ERC4626 View Functions

    function maxDeposit(address) external pure returns (uint256) {
        return type(uint256).max;
    }

    function maxMint(address) external pure returns (uint256) {
        return type(uint256).max;
    }

    function maxWithdraw(address owner) external view returns (uint256) {
        return convertToAssets(balanceOf[owner]);
    }

    function maxRedeem(address owner) external view returns (uint256) {
        return balanceOf[owner];
    }

    function previewDeposit(uint256 assets) external view returns (uint256) {
        return convertToShares(assets);
    }

    function previewMint(uint256 shares) external view returns (uint256) {
        uint256 supply = totalSupply;
        if (supply == 0) {
            return shares;
        }
        uint256 total = totalAssets();
        // Round up for mint preview
        return (shares * total + supply - 1) / supply;
    }

    function previewWithdraw(uint256 assets) external view returns (uint256) {
        uint256 supply = totalSupply;
        uint256 total = totalAssets();
        if (supply == 0 || total == 0) {
            return assets;
        }
        // Round up for withdraw preview
        return (assets * supply + total - 1) / total;
    }

    function previewRedeem(uint256 shares) external view returns (uint256) {
        return convertToAssets(shares);
    }

    // ERC20 Functions for Vault Shares

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        require(balanceOf[from] >= amount, "Insufficient balance");

        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;

        emit Transfer(from, to, amount);
        return true;
    }

    // Internal Functions

    /**
     * @notice Initialize vault with dead deposit (Morpho best practice)
     * @dev Creates minimum share supply at dead address to prevent inflation attacks
     */
    function _initializeVault(uint256 firstDeposit) internal {
        require(firstDeposit >= DEAD_SHARES, "First deposit too small");

        // Mint dead shares to prevent share inflation attack
        totalSupply = DEAD_SHARES;
        balanceOf[DEAD_ADDRESS] = DEAD_SHARES;
        _totalAssets = DEAD_SHARES;

        emit Transfer(address(0), DEAD_ADDRESS, DEAD_SHARES);
    }

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
}
