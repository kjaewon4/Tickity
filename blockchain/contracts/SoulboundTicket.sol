// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SoulboundTicket is ERC721URIStorage, Ownable {
    uint256 public constant TICKET_PRICE = 0.1 ether;
    uint256 public nextTokenId = 1;

    struct Ticket {
        uint256 concertId;     // 공연 고유 ID
        string seatNumber;     // 좌석 번호 (예: A12)
        uint256 issuedAt;      // 발급 시각 (timestamp)
        uint256 price;         // 발급가 (wei)
        bool isUsed;           // 입장 완료 여부
    }

    mapping(uint256 => Ticket) public tickets;
    mapping(address => mapping(uint256 => bool)) public hasMintedForConcert; // 👤 사용자별 공연당 1매 제한

    constructor() ERC721("SBTicket", "SBT") {}

    function mintTicket(
        uint256 concertId,
        string memory seatNumber,
        string memory tokenURI
    ) external payable {
        require(msg.value == TICKET_PRICE, "💸 정확한 금액을 전송하세요");
        require(!hasMintedForConcert[msg.sender][concertId], "⛔ 해당 공연에 이미 티켓을 발급받았습니다");

        uint256 tokenId = nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        tickets[tokenId] = Ticket({
            concertId: concertId,
            seatNumber: seatNumber,
            issuedAt: block.timestamp,
            price: msg.value,
            isUsed: false
        });

        hasMintedForConcert[msg.sender][concertId] = true;
    }

    // 입장 시 사용 처리 (오프체인 AI 검증 후 호출)
    function markAsUsed(uint256 tokenId) external onlyOwner {
        require(_exists(tokenId), "❌ 존재하지 않는 티켓입니다");
        require(!tickets[tokenId].isUsed, "⛔ 이미 입장 처리된 티켓입니다");
        tickets[tokenId].isUsed = true;
    }

    // Soulbound: 양도 금지
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override
    {
        require(from == address(0), "SBT: 양도 불가 티켓입니다");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function approve(address to, uint256 tokenId) public pure override {
        revert("SBT: 승인 불가");
    }

    function setApprovalForAll(address operator, bool approved) public pure override {
        revert("SBT: 전체 승인 불가");
    }

    function transferFrom(address from, address to, uint256 tokenId) public pure override {
        revert("SBT: 전송 불가");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public pure override {
        revert("SBT: 안전 전송 불가");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public pure override {
        revert("SBT: 안전 전송 불가");
    }
}
