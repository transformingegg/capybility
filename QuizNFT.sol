// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC721/ERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/access/AccessControl.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/security/ReentrancyGuard.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/utils/Counters.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC20/IERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/utils/cryptography/ECDSA.sol";

contract QuizCreatorNFT is ERC721, AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    using ECDSA for bytes32;
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    
    IERC20 public immutable eduToken;
    uint256 public mintPrice;
    
    Counters.Counter private _tokenIdCounter;
    string private _baseTokenURI;
    
    mapping(uint256 => string) private _quizIds;
    mapping(string => address) private _quizCreators;
    mapping(bytes => bool) private _usedSignatures;
    mapping(address => uint256) private _nonces;

    event QuizCreated(address indexed creator, uint256 indexed tokenId, string quizId);
    event MintPriceUpdated(uint256 newPrice);
    event BaseURIChanged(string newBaseURI);
    event SignerUpdated(address newSigner);
    event FundsWithdrawn(address to, uint256 amount);

    constructor(
        string memory baseURI,
        address eduTokenAddress,
        uint256 initialMintPrice,
        address signer
    ) ERC721("Quiz Creator NFT", "QCNFT") {
        require(eduTokenAddress != address(0), "Invalid EDU token address");
        require(signer != address(0), "Invalid signer address");
        require(initialMintPrice > 0, "Invalid mint price");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(SIGNER_ROLE, signer);
        
        _baseTokenURI = baseURI;
        eduToken = IERC20(eduTokenAddress);
        mintPrice = initialMintPrice;
        _tokenIdCounter.increment(); // Start from 1
    }

    function mint(
        string memory quizId,
        bytes memory signature
    ) public nonReentrant returns (uint256) {
        require(!_usedSignatures[signature], "Signature already used");
        require(_quizCreators[quizId] == address(0), "Quiz already has a creator");

        bytes32 messageHash = keccak256(abi.encodePacked(
            msg.sender,
            quizId,
            _nonces[msg.sender],
            address(this)
        ));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        require(hasRole(SIGNER_ROLE, recoveredSigner), "Invalid signature");

        require(eduToken.balanceOf(msg.sender) >= mintPrice, "Insufficient EDU balance");
        require(eduToken.allowance(msg.sender, address(this)) >= mintPrice, "EDU transfer not approved");
        require(eduToken.transferFrom(msg.sender, address(this), mintPrice), "EDU transfer failed");

        _usedSignatures[signature] = true;
        _nonces[msg.sender]++;

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
        _quizIds[tokenId] = quizId;
        _quizCreators[quizId] = msg.sender;

        emit QuizCreated(msg.sender, tokenId, quizId);
        return tokenId;
    }

    function getQuizId(uint256 tokenId) public view returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return _quizIds[tokenId];
    }

    function getQuizCreator(string memory quizId) public view returns (address) {
        return _quizCreators[quizId];
    }

    function getNonce(address user) public view returns (uint256) {
        return _nonces[user];
    }

    function updateMintPrice(uint256 newPrice) public onlyRole(ADMIN_ROLE) {
        require(newPrice > 0, "Invalid mint price");
        mintPrice = newPrice;
        emit MintPriceUpdated(newPrice);
    }

    function setBaseURI(string memory newBaseURI) public onlyRole(ADMIN_ROLE) {
        _baseTokenURI = newBaseURI;
        emit BaseURIChanged(newBaseURI);
    }

    function setSigner(address newSigner) public onlyRole(ADMIN_ROLE) {
        require(newSigner != address(0), "Invalid signer address");
        grantRole(SIGNER_ROLE, newSigner);
        emit SignerUpdated(newSigner);
    }

    function withdrawFunds(address to, uint256 amount) public onlyRole(ADMIN_ROLE) nonReentrant {
        require(to != address(0), "Invalid withdrawal address");
        require(eduToken.balanceOf(address(this)) >= amount, "Insufficient contract balance");
        require(eduToken.transfer(to, amount), "Transfer failed");
        emit FundsWithdrawn(to, amount);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override {
        require(from == address(0), "Token is soulbound");
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}