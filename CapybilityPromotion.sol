// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC721/ERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/access/AccessControl.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/security/ReentrancyGuard.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/utils/Counters.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/utils/Strings.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/utils/cryptography/ECDSA.sol"; // Import the ECDSA library

contract CapybilityPromotion is ERC721, AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    using Strings for uint256;
    using ECDSA for bytes32; // Use the ECDSA library

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

    Counters.Counter private _tokenIdCounter;
    string private _baseTokenURI;

    mapping(uint256 => string) private _promotionTypes;

    // New mapping to track minted promotion types for each address
    mapping(address => mapping(string => bool)) private _mintedPromotionTypes;

    mapping(bytes => bool) private _usedSignatures;
    mapping(address => uint256) private _nonces;

    event PromotionMinted(address indexed user, uint256 indexed tokenId, string promotionType);
    event BaseURIChanged(string newBaseURI);
    event SignerUpdated(address newSigner);

    constructor(
        string memory baseURI,
        address initialSigner
    ) ERC721("Capybility Promotion Badge", "CapyBadge") {
        require(initialSigner != address(0), "Invalid signer address");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(SIGNER_ROLE, initialSigner);

        _baseTokenURI = baseURI;
        _tokenIdCounter.increment(); // Start from 1
    }

    function getNonce(address user) public view returns (uint256) {
        return _nonces[user];
    }

    function getPromotionType(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _promotionTypes[tokenId];
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

    function mint(
        address to,
        string memory promotionType,
        bytes memory signature
    ) public nonReentrant returns (uint256) {
        require(!_usedSignatures[signature], "Signature already used");
        require(!hasMintedPromotionType(to, promotionType), "Address has already minted this promotion type");

        bytes32 messageHash = keccak256(abi.encodePacked(
            to,
            promotionType,
            _nonces[to],
            address(this)
        ));
        bytes32 ethSignedMessageHash = ECDSA.toEthSignedMessageHash(messageHash); // Use ECDSA.toEthSignedMessageHash()
        address recoveredSigner = ECDSA.recover(ethSignedMessageHash, signature);
        require(hasRole(SIGNER_ROLE, recoveredSigner), "Invalid signature");

        _usedSignatures[signature] = true;
        _nonces[to]++;

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _promotionTypes[tokenId] = promotionType;

        // Mark this promotion type as minted for this address
        _mintedPromotionTypes[to][promotionType] = true;

        emit PromotionMinted(to, tokenId, promotionType);
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");

        string memory base = _baseURI();
        return string.concat(base, tokenId.toString());
    }

    function _baseURI() internal view override virtual returns (string memory) {
        return _baseTokenURI;
    }

    // New function to check if an address has minted a specific promotion type
    function hasMintedPromotionType(address user, string memory promotionType) public view returns (bool) {
        return _mintedPromotionTypes[user][promotionType];
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Required to receive native token
    receive() external payable {}
}