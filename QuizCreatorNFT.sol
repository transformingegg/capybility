// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC721/ERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/access/AccessControl.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/utils/Counters.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/utils/Strings.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/utils/cryptography/ECDSA.sol";

contract QuizCreatorNFT is ERC721, AccessControl {
    using Counters for Counters.Counter;
    using ECDSA for bytes32;
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    
    uint256 public mintPrice;
    address public signer;
    
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
        uint256 initialMintPrice,
        address initialSigner
    ) ERC721("Quiz Creator NFT", "QCNFT") {
        require(initialSigner != address(0), "Invalid signer address");
        require(initialMintPrice > 0, "Invalid mint price");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(SIGNER_ROLE, initialSigner);
        
        _baseTokenURI = baseURI;
        mintPrice = initialMintPrice;
        signer = initialSigner;
        _tokenIdCounter.increment();
    }

    function mint(
        string calldata quizId,
        bytes calldata signature
    ) external payable returns (uint256) {
        require(!_usedSignatures[signature], "Signature already used");
        require(_quizCreators[quizId] == address(0), "Quiz already has a creator");
        require(msg.value >= mintPrice, "Insufficient EDU sent");

        bytes32 messageHash = keccak256(abi.encodePacked(
            msg.sender,
            quizId,
            _nonces[msg.sender]
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
        _quizCreators[quizId] = msg.sender;

        emit QuizCreated(msg.sender, tokenId, quizId);
        return tokenId;
    }

    function getQuizId(uint256 tokenId) external view returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return _quizIds[tokenId];
    }

    function getQuizCreator(string calldata quizId) external view returns (address) {
        return _quizCreators[quizId];
    }

    function getNonce(address user) external view returns (uint256) {
        return _nonces[user];
    }

    function updateMintPrice(uint256 newPrice) external onlyRole(ADMIN_ROLE) {
        require(newPrice > 0, "Invalid mint price");
        mintPrice = newPrice;
        emit MintPriceUpdated(newPrice);
    }

    function setBaseURI(string calldata newBaseURI) external onlyRole(ADMIN_ROLE) {
        _baseTokenURI = newBaseURI;
        emit BaseURIChanged(newBaseURI);
    }

    function setSigner(address newSigner) external onlyRole(ADMIN_ROLE) {
        require(newSigner != address(0), "Invalid signer address");
        revokeRole(SIGNER_ROLE, signer);
        grantRole(SIGNER_ROLE, newSigner);
        signer = newSigner;
        emit SignerUpdated(newSigner);
    }

    function withdrawFunds(address payable to, uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(to != address(0), "Invalid withdrawal address");
        require(address(this).balance >= amount, "Insufficient contract balance");
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
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

    // Required to receive EDU (native token)
    receive() external payable {}
}