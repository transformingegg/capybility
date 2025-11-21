// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC721/ERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/access/AccessControl.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/security/ReentrancyGuard.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/security/Pausable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/utils/Counters.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/utils/Strings.sol"; // needed for tokenURI
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/utils/cryptography/ECDSA.sol";

contract BarabotsNFTv2 is ERC721, AccessControl, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;
    using ECDSA for bytes32;
    using Strings for uint256;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

    uint256 public nativeFullMintPrice;
    uint256 public nativeDiscountMintPrice;
    uint256 public assemblyPrice;

    Counters.Counter private _tokenIdCounter;
    string private _baseTokenURI;

    // Metadata
    mapping(uint256 => string) private _customTokenURIs;
    mapping(uint256 => bool) private _hasCustomURI;

    // Minting security
    mapping(bytes => bool) private _usedSignatures;
    mapping(address => uint256) private _nonces;

    // On-chain enumeration (kept exactly as you wanted)
    mapping(address => uint256[]) private _ownedTokens;

    // Assembly
    mapping(uint256 => bool) private _assembledTokens;

    // Events
    event BarabotMinted(address indexed user, uint256 indexed tokenId, uint256 mintType, uint256 price);
    event BarabotAssembled(address indexed user, uint256 indexed tokenId, uint256 price);
    event MetadataUpdated(uint256 indexed tokenId, string newTokenURI);
    event BarabotBurned(uint256 indexed tokenId, address indexed owner);
    event NativeMintPriceUpdated(uint256 newNativeFullPrice, uint256 newNativeDiscountPrice);
    event AssemblyPriceUpdated(uint256 newAssemblyPrice);
    event BaseURIChanged(string newBaseURI);
    event SignerUpdated(address newSigner);
    event NativeFundsWithdrawn(address to, uint256 amount);

    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI,
        uint256 initialNativeFullMintPrice,
        uint256 initialNativeDiscountMintPrice,
        uint256 initialAssemblyPrice,
        address signer
    ) ERC721(name, symbol) {
        _baseTokenURI = baseURI;
        nativeFullMintPrice = initialNativeFullMintPrice;
        nativeDiscountMintPrice = initialNativeDiscountMintPrice;
        assemblyPrice = initialAssemblyPrice;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(SIGNER_ROLE, signer);
    }

    // ========== MINTING ==========

    function mintFree(bytes memory signature) public nonReentrant whenNotPaused returns (uint256) {
        require(!_usedSignatures[signature], "Signature already used");

        bytes32 messageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encode(msg.sender, "FREE_MINT", _nonces[msg.sender], block.chainid, address(this)))
        ));

        (address recoveredSigner, ECDSA.RecoverError error) = messageHash.tryRecover(signature);
        require(error == ECDSA.RecoverError.NoError && recoveredSigner != address(0), "Invalid signature");
        require(hasRole(SIGNER_ROLE, recoveredSigner), "Unauthorized signer");

        _usedSignatures[signature] = true;
        _nonces[msg.sender]++;

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId); // _beforeTokenTransfer will add to _ownedTokens

        emit BarabotMinted(msg.sender, tokenId, 0, 0);
        return tokenId;
    }

    function mintDiscount(bytes memory signature) public payable nonReentrant whenNotPaused returns (uint256) {
        require(!_usedSignatures[signature], "Signature already used");
        require(msg.value == nativeDiscountMintPrice, "Incorrect payment");

        bytes32 messageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encode(msg.sender, "DISCOUNT_MINT", _nonces[msg.sender], block.chainid, address(this)))
        ));

        (address recoveredSigner, ECDSA.RecoverError error) = messageHash.tryRecover(signature);
        require(error == ECDSA.RecoverError.NoError && recoveredSigner != address(0), "Invalid signature");
        require(hasRole(SIGNER_ROLE, recoveredSigner), "Unauthorized signer");

        _usedSignatures[signature] = true;
        _nonces[msg.sender]++;

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);

        emit BarabotMinted(msg.sender, tokenId, 1, nativeDiscountMintPrice);
        return tokenId;
    }

    function mintFullPrice() public payable nonReentrant whenNotPaused returns (uint256) {
        require(msg.value == nativeFullMintPrice, "Incorrect payment");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);

        emit BarabotMinted(msg.sender, tokenId, 2, nativeFullMintPrice);
        return tokenId;
    }

    // ========== ASSEMBLY & BURN ==========

    function assembleBarabot(uint256 tokenId) public payable nonReentrant whenNotPaused {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(!_assembledTokens[tokenId], "Already assembled");
        require(msg.value == assemblyPrice, "Incorrect payment");

        _assembledTokens[tokenId] = true;
        emit BarabotAssembled(msg.sender, tokenId, assemblyPrice);
    }

    function burn(uint256[] memory tokenIds) public whenNotPaused {
        require(tokenIds.length > 0 && tokenIds.length <= 5, "1-5 tokens");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(ownerOf(tokenId) == msg.sender, "Not owner");

            _burn(tokenId); // _beforeTokenTransfer will remove from _ownedTokens

            if (_hasCustomURI[tokenId]) {
                delete _customTokenURIs[tokenId];
                delete _hasCustomURI[tokenId];
            }
            delete _assembledTokens[tokenId];

            emit BarabotBurned(tokenId, msg.sender);
        }
    }

    // ========== CORE HOOK (keeps _ownedTokens perfect) ==========

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);

        // Remove from old owner (skip on mint)
        if (from != address(0)) {
            uint256[] storage oldOwnerTokens = _ownedTokens[from];
            for (uint256 i = 0; i < oldOwnerTokens.length; i++) {
                if (oldOwnerTokens[i] == tokenId) {
                    oldOwnerTokens[i] = oldOwnerTokens[oldOwnerTokens.length - 1];
                    oldOwnerTokens.pop();
                    break;
                }
            }
        }

        // Add to new owner (skip on burn)
        if (to != address(0)) {
            _ownedTokens[to].push(tokenId);
        }
    }

    // ========== METADATA ==========

    function setCustomTokenURI(uint256 tokenId, string memory newTokenURI) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Only admin");
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
        return string(abi.encodePacked(_baseTokenURI, tokenId.toString(), ".json"));
    }

    // ========== ADMIN ==========

    function setNativeMintPrices(uint256 newFull, uint256 newDiscount) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Only admin");
        nativeFullMintPrice = newFull;
        nativeDiscountMintPrice = newDiscount;
        emit NativeMintPriceUpdated(newFull, newDiscount);
    }

    function setAssemblyPrice(uint256 newPrice) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Only admin");
        assemblyPrice = newPrice;
        emit AssemblyPriceUpdated(newPrice);
    }

    function setBaseURI(string memory newURI) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Only admin");
        _baseTokenURI = newURI;
        emit BaseURIChanged(newURI);
    }

    function setSigner(address newSigner) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Only admin");
        _grantRole(SIGNER_ROLE, newSigner);
        emit SignerUpdated(newSigner);
    }

    function withdrawNativeFunds(address payable to, uint256 amount) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Only admin");
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
        emit NativeFundsWithdrawn(to, amount);
    }

    function pause() public { require(hasRole(ADMIN_ROLE, msg.sender)); _pause(); }
    function unpause() public { require(hasRole(ADMIN_ROLE, msg.sender)); _unpause(); }

    // ========== VIEWS ==========

    function getNonce(address user) public view returns (uint256) { return _nonces[user]; }
    function getOwnedTokens(address owner) public view returns (uint256[] memory) { return _ownedTokens[owner]; }
    function isAssembled(uint256 tokenId) public view returns (bool) { return _assembledTokens[tokenId]; }
    function getAssemblyPrice() public view returns (uint256) { return assemblyPrice; }
    function totalSupply() public view returns (uint256) { return _tokenIdCounter.current(); }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}