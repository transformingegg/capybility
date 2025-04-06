// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC721/ERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/access/AccessControl.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/utils/Counters.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/utils/Strings.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/utils/cryptography/ECDSA.sol";

contract QuizNFT is ERC721, AccessControl {
    using Counters for Counters.Counter;
    using Strings for uint256;
    using ECDSA for bytes32;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    Counters.Counter private _tokenIdCounter;
    mapping(uint256 => string) private _quizIds;
    mapping(string => address[]) private _quizOwners;
    mapping(address => uint256) private _nonces; // Nonce for each user to prevent replay attacks
    string private _baseTokenURI;
    address public signer; // Address authorized to sign minting requests

    event Minted(address indexed to, uint256 indexed tokenId, string quizId);
    event BaseURIChanged(string newBaseURI);
    event BurnAttempted(uint256 tokenId);
    event SignerChanged(address indexed newSigner);

    constructor(string memory baseURI, address _signer) ERC721("QuizNFT", "QNFT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _baseTokenURI = baseURI;
        _tokenIdCounter.increment(); // Start IDs at 1
        signer = _signer;
        emit SignerChanged(_signer);
    }

    function mint(address to, string memory quizId, bytes memory signature) public returns (uint256) {
        require(to != address(0), "Invalid recipient address");
        require(msg.sender == to, "Cannot mint for another address");

        // Generate the message hash
        uint256 nonce = _nonces[to];
        bytes32 messageHash = keccak256(abi.encodePacked(to, quizId, nonce, address(this)));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

        // Verify the signature
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        require(recoveredSigner == signer, "Invalid signature");

        // Increment nonce to prevent replay
        _nonces[to]++;

        // Mint the NFT
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _quizIds[tokenId] = quizId;

        // Add owner to the quizId mapping (if not already recorded)
        bool exists = false;
        for (uint256 i = 0; i < _quizOwners[quizId].length; i++) {
            if (_quizOwners[quizId][i] == to) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            _quizOwners[quizId].push(to);
        }

        emit Minted(to, tokenId, quizId);
        return tokenId;
    }

    function getOwnersByQuizId(string memory quizId) public view returns (address[] memory) {
        return _quizOwners[quizId];
    }

    function getQuizId(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _quizIds[tokenId];
    }

    function getNonce(address user) public view returns (uint256) {
        return _nonces[user];
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0
            ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json"))
            : "";
    }

    function setBaseURI(string memory newBaseURI) public onlyRole(ADMIN_ROLE) {
        _baseTokenURI = newBaseURI;
        emit BaseURIChanged(newBaseURI);
    }

    function setSigner(address newSigner) public onlyRole(ADMIN_ROLE) {
        require(newSigner != address(0), "Invalid signer address");
        signer = newSigner;
        emit SignerChanged(newSigner);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override {
        require(from == address(0), "QuizNFT: Token is soulbound and cannot be transferred");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override {
        emit BurnAttempted(tokenId);
        revert("QuizNFT: Token is soulbound and cannot be burned");
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current() - 1;
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}