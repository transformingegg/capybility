// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC721/ERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/access/AccessControl.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/security/ReentrancyGuard.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/utils/Counters.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC20/IERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/utils/cryptography/ECDSA.sol";

contract QuizCompletionNFT is ERC721, AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    using ECDSA for bytes32;
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    
    IERC20 public paymentToken; // Settable ERC20 token for payment
    uint256 public nativeMintPrice;
    uint256 public tokenMintPrice;
    
    uint256 public discountBps = 10000; // 10000 = 100% (no discount), 9000 = 90%, etc.


    Counters.Counter private _tokenIdCounter;
    string private _baseTokenURI;
    
    mapping(uint256 => string) private _quizIds;
    mapping(string => mapping(address => bool)) private _quizCompletions;

    mapping(bytes => bool) private _usedSignatures;
    mapping(address => uint256) private _nonces;
    mapping(address => uint256[]) private _ownedTokens;

    event QuizCompleted(address indexed user, uint256 indexed tokenId, string quizId);
    event MintPriceUpdated(uint256 newPrice);
    event BaseURIChanged(string newBaseURI);
    event SignerUpdated(address newSigner);
    event PaymentTokenUpdated(address newPaymentToken);
    event FundsWithdrawn(address to, uint256 amount);
    event NativeFundsWithdrawn(address to, uint256 amount);
    event NativeMintPriceUpdated(uint256 newPrice);
    event TokenMintPriceUpdated(uint256 newPrice);

    constructor(
        string memory baseURI,
        address paymentTokenAddress,
        uint256 initialNativeMintPrice,
        uint256 initialTokenMintPrice,
        address signer
    ) ERC721("Capybility Quiz Completion NFT", "CCNFT") {
        require(paymentTokenAddress != address(0), "Invalid payment token address");
        require(signer != address(0), "Invalid signer address");
        require(initialNativeMintPrice > 0, "Invalid native mint price");
        require(initialTokenMintPrice > 0, "Invalid token mint price");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(SIGNER_ROLE, signer);
        
        _baseTokenURI = baseURI;
        paymentToken = IERC20(paymentTokenAddress);
        nativeMintPrice = initialNativeMintPrice;
        tokenMintPrice = initialTokenMintPrice;
        _tokenIdCounter.increment(); // Start from 1
    }

    function setDiscountBps(uint256 newDiscountBps) external onlyRole(ADMIN_ROLE) {
        require(newDiscountBps <= 10000, "Discount cannot exceed 100%");
        discountBps = newDiscountBps;
    }

    function mint(
        string memory quizId,
        bytes memory signature
    ) public payable nonReentrant returns (uint256) {
        require(!_usedSignatures[signature], "Signature already used");
        require(!_quizCompletions[quizId][msg.sender], "You have already minted for this quiz");
        bytes32 messageHash = keccak256(abi.encodePacked(
            msg.sender,
            quizId,
            _nonces[msg.sender],
            address(this)
        ));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        require(hasRole(SIGNER_ROLE, recoveredSigner), "Invalid signature");

        require(msg.value >= nativeMintPrice, "Insufficient native token sent");

        _usedSignatures[signature] = true;
        _nonces[msg.sender]++;

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
        _quizIds[tokenId] = quizId;
        _ownedTokens[msg.sender].push(tokenId);

        _quizCompletions[quizId][msg.sender] = true;

        emit QuizCompleted(msg.sender, tokenId, quizId);
        return tokenId;
    }

    function mintWithToken(
        string memory quizId,
        bytes memory signature
    ) public nonReentrant returns (uint256) {
        require(!_usedSignatures[signature], "Signature already used");
        require(!_quizCompletions[quizId][msg.sender], "You have already minted for this quiz");

        bytes32 messageHash = keccak256(abi.encodePacked(
            msg.sender,
            quizId,
            _nonces[msg.sender],
            address(this)
        ));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        require(hasRole(SIGNER_ROLE, recoveredSigner), "Invalid signature");

        require(paymentToken.balanceOf(msg.sender) >= tokenMintPrice, "Insufficient token balance");
        require(paymentToken.allowance(msg.sender, address(this)) >= tokenMintPrice, "Token transfer not approved");
        require(paymentToken.transferFrom(msg.sender, address(this), tokenMintPrice), "Token transfer failed");

        _usedSignatures[signature] = true;
        _nonces[msg.sender]++;

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
        _quizIds[tokenId] = quizId;
        _ownedTokens[msg.sender].push(tokenId);

        _quizCompletions[quizId][msg.sender] = true;

        emit QuizCompleted(msg.sender, tokenId, quizId);
        return tokenId;
    }

    function mintWithDiscount(
        string memory quizId,
        bytes memory signature
    ) public payable nonReentrant returns (uint256) {
        require(!_usedSignatures[signature], "Signature already used");
        require(!_quizCompletions[quizId][msg.sender], "You have already minted for this quiz");

        uint256 discountedPrice = (nativeMintPrice * discountBps) / 10000;
        require(msg.value >= discountedPrice, "Insufficient native token sent");

        bytes32 messageHash = keccak256(abi.encodePacked(
            msg.sender,
            quizId,
            _nonces[msg.sender],
            address(this)
        ));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        require(hasRole(SIGNER_ROLE, recoveredSigner), "Invalid signature");

        _usedSignatures[signature] = true;
        _nonces[msg.sender]++;

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
        _quizIds[tokenId] = quizId;
        _ownedTokens[msg.sender].push(tokenId);

        _quizCompletions[quizId][msg.sender] = true;

        emit QuizCompleted(msg.sender, tokenId, quizId);
        return tokenId;
    }

    /**
     * @dev Allows ADMIN_ROLE to update the ERC20 payment token.
     */
    function setPaymentToken(address newPaymentToken) public onlyRole(ADMIN_ROLE) {
        require(newPaymentToken != address(0), "Invalid payment token address");
        paymentToken = IERC20(newPaymentToken);
        emit PaymentTokenUpdated(newPaymentToken);
    }

    function updateNativeMintPrice(uint256 newPrice) public onlyRole(ADMIN_ROLE) {
        require(newPrice > 0, "Invalid native mint price");
        nativeMintPrice = newPrice;
        emit NativeMintPriceUpdated(newPrice);
    }

    function updateTokenMintPrice(uint256 newPrice) public onlyRole(ADMIN_ROLE) {
        require(newPrice > 0, "Invalid token mint price");
        tokenMintPrice = newPrice;
        emit TokenMintPriceUpdated(newPrice);
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
        require(paymentToken.balanceOf(address(this)) >= amount, "Insufficient contract balance");
        require(paymentToken.transfer(to, amount), "Transfer failed");
        emit FundsWithdrawn(to, amount);
    }

    function withdrawNative(address to, uint256 amount) public onlyRole(ADMIN_ROLE) nonReentrant {
        require(to != address(0), "Invalid withdrawal address");
        require(address(this).balance >= amount, "Insufficient contract balance");
        (bool sent, ) = to.call{value: amount}("");
        require(sent, "Native token transfer failed");
        emit NativeFundsWithdrawn(to, amount);
    }

    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        return _ownedTokens[owner];
    }

    function getQuizId(uint256 tokenId) public view returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return _quizIds[tokenId];
    }

    function hasCompletedQuiz(string memory quizId, address user) public view returns (bool) {
        return _quizCompletions[quizId][user];
    }
    
    function getNonce(address user) public view returns (uint256) {
        return _nonces[user];
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