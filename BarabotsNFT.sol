// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC721/ERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/access/AccessControl.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/security/ReentrancyGuard.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/utils/Counters.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC20/IERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/utils/cryptography/ECDSA.sol";

contract BarabotsNFT is ERC721, AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    using ECDSA for bytes32;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

    IERC20 public paymentToken;
    uint256 public fullMintPrice;      // Full price in payment tokens
    uint256 public discountMintPrice;  // Discounted price in payment tokens
    uint256 public nativeFullMintPrice;    // Full price in native token (EDU)
    uint256 public nativeDiscountMintPrice; // Discounted price in native token (EDU)

    Counters.Counter private _tokenIdCounter;
    string private _baseTokenURI;

    // Metadata management - allows dynamic metadata changes
    mapping(uint256 => string) private _customTokenURIs;
    mapping(uint256 => bool) private _hasCustomURI;

    // Minting tracking
    mapping(bytes => bool) private _usedSignatures;
    mapping(address => uint256) private _nonces;
    mapping(address => uint256[]) private _ownedTokens;

    // Events
    event BarabotMinted(address indexed user, uint256 indexed tokenId, uint256 mintType, uint256 price);
    event MetadataUpdated(uint256 indexed tokenId, string newTokenURI);
    event BarabotBurned(uint256 indexed tokenId, address indexed owner);
    event MintPriceUpdated(uint256 newFullPrice, uint256 newDiscountPrice);
    event NativeMintPriceUpdated(uint256 newNativeFullPrice, uint256 newNativeDiscountPrice);
    event BaseURIChanged(string newBaseURI);
    event SignerUpdated(address newSigner);
    event PaymentTokenUpdated(address newPaymentToken);
    event FundsWithdrawn(address to, uint256 amount);
    event NativeFundsWithdrawn(address to, uint256 amount);

    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI,
        address paymentTokenAddress,
        uint256 initialFullMintPrice,
        uint256 initialDiscountMintPrice,
        uint256 initialNativeFullMintPrice,
        uint256 initialNativeDiscountMintPrice,
        address signer
    ) ERC721(name, symbol) {
        _baseTokenURI = baseURI;
        paymentToken = IERC20(paymentTokenAddress);
        fullMintPrice = initialFullMintPrice;
        discountMintPrice = initialDiscountMintPrice;
        nativeFullMintPrice = initialNativeFullMintPrice;
        nativeDiscountMintPrice = initialNativeDiscountMintPrice;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(SIGNER_ROLE, signer);
    }

    // Minting functions

    /**
     * @dev Free mint for whitelisted users
     * @param signature Server signature authorizing free mint
     */
    function mintFree(bytes memory signature) public nonReentrant returns (uint256) {
        require(!_usedSignatures[signature], "Signature already used");

        bytes32 messageHash = keccak256(abi.encodePacked(
            msg.sender,
            "FREE_MINT",
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
        _ownedTokens[msg.sender].push(tokenId);

        emit BarabotMinted(msg.sender, tokenId, 0, 0); // 0 = free mint
        return tokenId;
    }

    /**
     * @dev Discounted mint for whitelisted users (pays with native EDU)
     * @param signature Server signature authorizing discount mint
     */
    function mintDiscount(bytes memory signature) public payable nonReentrant returns (uint256) {
        require(!_usedSignatures[signature], "Signature already used");

        bytes32 messageHash = keccak256(abi.encodePacked(
            msg.sender,
            "DISCOUNT_MINT",
            _nonces[msg.sender],
            address(this)
        ));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

        address recoveredSigner = ethSignedMessageHash.recover(signature);
        require(hasRole(SIGNER_ROLE, recoveredSigner), "Invalid signature");

        require(msg.value >= nativeDiscountMintPrice, "Insufficient native token sent");

        _usedSignatures[signature] = true;
        _nonces[msg.sender]++;

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
        _ownedTokens[msg.sender].push(tokenId);

        emit BarabotMinted(msg.sender, tokenId, 1, nativeDiscountMintPrice); // 1 = discount mint
        return tokenId;
    }

    /**
     * @dev Full price mint for anyone (pays with native EDU)
     */
    function mintFullPrice() public payable nonReentrant returns (uint256) {
        require(msg.value >= nativeFullMintPrice, "Insufficient native token sent");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
        _ownedTokens[msg.sender].push(tokenId);

        emit BarabotMinted(msg.sender, tokenId, 2, nativeFullMintPrice); // 2 = full price mint
        return tokenId;
    }

    /**
     * @dev Burn function to destroy tokens (up to 5 at once)
     * @param tokenIds Array of token IDs to burn
     */
    function burn(uint256[] memory tokenIds) public {
        require(tokenIds.length > 0 && tokenIds.length <= 5, "Can burn 1-5 tokens at once");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(ownerOf(tokenId) == msg.sender, "Not token owner");

            _burn(tokenId);

            // Remove from owned tokens array
            uint256[] storage owned = _ownedTokens[msg.sender];
            for (uint256 j = 0; j < owned.length; j++) {
                if (owned[j] == tokenId) {
                    owned[j] = owned[owned.length - 1];
                    owned.pop();
                    break;
                }
            }

            // Clear custom URI if set
            if (_hasCustomURI[tokenId]) {
                delete _customTokenURIs[tokenId];
                delete _hasCustomURI[tokenId];
            }

            emit BarabotBurned(tokenId, msg.sender);
        }
    }

    // Dynamic metadata management
    function setCustomTokenURI(uint256 tokenId, string memory newTokenURI) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Only admin can update metadata");
        require(_exists(tokenId), "Token does not exist");

        _customTokenURIs[tokenId] = newTokenURI;
        _hasCustomURI[tokenId] = true;

        emit MetadataUpdated(tokenId, newTokenURI);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        if (_hasCustomURI[tokenId]) {
            return _customTokenURIs[tokenId];
        }

        return string(abi.encodePacked(_baseTokenURI, Strings.toString(tokenId), ".json"));
    }

    // Admin functions
    function setMintPrices(uint256 newFullPrice, uint256 newDiscountPrice) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Only admin can set prices");
        fullMintPrice = newFullPrice;
        discountMintPrice = newDiscountPrice;
        emit MintPriceUpdated(newFullPrice, newDiscountPrice);
    }

    function setNativeMintPrices(uint256 newNativeFullPrice, uint256 newNativeDiscountPrice) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Only admin can set prices");
        nativeFullMintPrice = newNativeFullPrice;
        nativeDiscountMintPrice = newNativeDiscountPrice;
        emit NativeMintPriceUpdated(newNativeFullPrice, newNativeDiscountPrice);
    }

    function setBaseURI(string memory newBaseURI) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Only admin can set base URI");
        _baseTokenURI = newBaseURI;
        emit BaseURIChanged(newBaseURI);
    }

    function setPaymentToken(address newPaymentToken) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Only admin can set payment token");
        paymentToken = IERC20(newPaymentToken);
        emit PaymentTokenUpdated(newPaymentToken);
    }

    function setSigner(address newSigner) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Only admin can set signer");
        _grantRole(SIGNER_ROLE, newSigner);
        emit SignerUpdated(newSigner);
    }

    function withdrawFunds(address to, uint256 amount) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Only admin can withdraw");
        require(paymentToken.transfer(to, amount), "Transfer failed");
        emit FundsWithdrawn(to, amount);
    }

    function withdrawNativeFunds(address payable to, uint256 amount) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Only admin can withdraw");
        (bool success,) = to.call{value: amount}("");
        require(success, "Native transfer failed");
        emit NativeFundsWithdrawn(to, amount);
    }

    // View functions
    function getNonce(address user) public view returns (uint256) {
        return _nonces[user];
    }

    function getOwnedTokens(address owner) public view returns (uint256[] memory) {
        return _ownedTokens[owner];
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}