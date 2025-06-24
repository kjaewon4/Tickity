// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Soulbound Ticket
/// @notice Mint 후에는 전송·승인 불가, 관리자는 얼굴 인증·입장 처리 가능
contract SoulboundTicket is ERC721, Ownable {
    uint256 public constant TICKET_PRICE = 0.1 ether;  // 추후에 동적으로 바꿔야 함
    uint256 public nextTokenId = 1;

    struct Ticket {
        uint256 concertId;
        string  seatNumber;
        uint256 issuedAt;
        uint256 price;
        bool    isUsed;
        bool    isFaceVerified;
        bytes32 faceHash;
    }

    mapping(uint256 => Ticket) public tickets;
    mapping(address => mapping(uint256 => bool)) public hasMintedForConcert;
    mapping(uint256 => string) private _tokenURIs;

    constructor() ERC721("SBTicket", "SBT") Ownable(msg.sender) {}

    function mintTicket(
        uint256 concertId,
        string memory seatNumber,
        string memory uri
    ) external payable {
        require(msg.value == TICKET_PRICE, unicode"💸 정확한 금액을 전송하세요");
        require(
            !hasMintedForConcert[msg.sender][concertId],
            unicode"⛔ 이미 해당 공연을 mint했습니다"
        );

        uint256 id = nextTokenId++;
        _safeMint(msg.sender, id);
        _tokenURIs[id] = uri;
        tickets[id] = Ticket({
            concertId:     concertId,
            seatNumber:    seatNumber,
            issuedAt:      block.timestamp,
            price:         msg.value,
            isUsed:        false,
            isFaceVerified:false,
            faceHash:      bytes32(0)
        });
        hasMintedForConcert[msg.sender][concertId] = true;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(
            tickets[tokenId].issuedAt != 0,
            unicode"❌ 존재하지 않는 티켓입니다"
        );
        return _tokenURIs[tokenId];
    }

    function registerFaceHash(uint256 tokenId, bytes32 hash) external onlyOwner {
        require(
            tickets[tokenId].issuedAt != 0,
            unicode"❌ 존재하지 않는 티켓입니다"
        );
        require(
            tickets[tokenId].faceHash == bytes32(0),
            unicode"⛔ 이미 등록된 해시입니다"
        );
        tickets[tokenId].faceHash = hash;
    }

    function markFaceVerified(uint256 tokenId) external onlyOwner {
        require(
            tickets[tokenId].issuedAt != 0,
            unicode"❌ 존재하지 않는 티켓입니다"
        );
        require(
            tickets[tokenId].faceHash != bytes32(0),
            unicode"🚫 얼굴 해시가 먼저 등록되어야 합니다"
        );
        tickets[tokenId].isFaceVerified = true;
    }

    function markAsUsed(uint256 tokenId) external onlyOwner {
        require(
            tickets[tokenId].issuedAt != 0,
            unicode"❌ 존재하지 않는 티켓입니다"
        );
        require(
            !tickets[tokenId].isUsed,
            unicode"⛔ 이미 사용된 티켓입니다"
        );
        require(
            tickets[tokenId].isFaceVerified,
            unicode"🧑‍💻 얼굴 인증이 필요합니다"
        );
        tickets[tokenId].isUsed = true;
    }

    // ────────────────────────────────────────────
    // 소울바운드: 승인·전송 관련 public/external 함수만 override
    // ────────────────────────────────────────────

    function approve(address, uint256) public pure override {
        revert(unicode"SBT: 승인 불가");
    }

    function setApprovalForAll(address, bool) public pure override {
        revert(unicode"SBT: 전체 승인 불가");
    }

    function transferFrom(address, address, uint256) public pure override {
        revert(unicode"SBT: 전송 불가");
    }

    /// 4-인자 version만 virtual이므로 이걸 막습니다
    function safeTransferFrom(
        address,
        address,
        uint256,
        bytes memory
    ) public pure override {
        revert(unicode"SBT: 안전 전송 불가");
    }
}
