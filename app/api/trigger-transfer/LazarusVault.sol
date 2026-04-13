// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LazarusVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public executor;

    struct Switch {
        address beneficiary;
        uint256 amount;
        IERC20 token;
        bool active;
        uint256 lastHeartbeat;
        bytes32 currentHashCommitment; 
    }

    mapping(address => Switch) public switches;

    event SwitchCreated(address indexed owner, address indexed beneficiary, uint256 amount);
    event SwitchExecuted(address indexed owner, address indexed beneficiary, uint256 amount);
    event SwitchCancelled(address indexed owner, uint256 amount);
    event HeartbeatPoked(address indexed owner, uint256 timestamp);

    constructor(address _initialExecutor) Ownable(msg.sender) {
        require(_initialExecutor != address(0), "Invalid executor address");
        executor = _initialExecutor;
    }

    function createSwitch(
        address _beneficiary, 
        address _token, 
        uint256 _amount, 
        bytes32 _hashCommitment
    ) external nonReentrant {
        require(_beneficiary != address(0), "Invalid beneficiary");
        require(_token != address(0), "Invalid token");
        require(_amount > 0, "Amount must be greater than 0");
        require(!switches[msg.sender].active, "Switch already exists");

        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        
        switches[msg.sender] = Switch({
            beneficiary: _beneficiary,
            amount: _amount,
            token: IERC20(_token),
            active: true,
            lastHeartbeat: block.timestamp,
            currentHashCommitment: _hashCommitment
        });

        emit SwitchCreated(msg.sender, _beneficiary, _amount);
    }

    function poke(bytes32 _preImage, bytes32 _nextHashCommitment) external {
        Switch storage s = switches[msg.sender];
        require(s.active, "No active switch");
        
        require(keccak256(abi.encodePacked(_preImage)) == s.currentHashCommitment, "Invalid Proof of Life");

        s.lastHeartbeat = block.timestamp;
        s.currentHashCommitment = _nextHashCommitment;

        emit HeartbeatPoked(msg.sender, block.timestamp);
    }

    function executeTransfer(address _owner) external nonReentrant {
        require(msg.sender == executor, "Only Lazarus Executor can trigger");
        
        Switch storage s = switches[_owner];
        require(s.active, "Switch not active");

        s.active = false;
        uint256 transferAmount = s.amount;
        
        s.token.safeTransfer(s.beneficiary, transferAmount);

        emit SwitchExecuted(_owner, s.beneficiary, transferAmount);
    }

    function cancelSwitch() external nonReentrant {
        Switch storage s = switches[msg.sender];
        require(s.active, "No active switch");

        s.active = false;
        uint256 returnAmount = s.amount;
        
        s.token.safeTransfer(msg.sender, returnAmount);

        emit SwitchCancelled(msg.sender, returnAmount);
    }

    function updateExecutor(address _newExecutor) external onlyOwner {
        require(_newExecutor != address(0), "Invalid address");
        executor = _newExecutor;
    }
}