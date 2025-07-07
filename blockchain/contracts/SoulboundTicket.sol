// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Soulbound Ticket
/// @notice Mint 후에는 전송·승인 불가, 관리자는 얼굴 인증·입장 처리 가능
contract SoulboundTicket is ERC721, Ownable {
    /// @notice 수수료 비율 (0.1% = 1 / 1 000)
    uint256 public constant FEE_NUMERATOR   = 1;
    uint256 public constant FEE_DENOMINATOR = 1000;

    /// @notice 티켓 정보 구조체
    struct Ticket {
        bytes32 concertId;
        string  seatNumber;
        uint256 issuedAt;
        uint256 price;           // 실제 보관된 금액 (msg.value - fee)
        bool    isUsed;
        bool    isFaceVerified;
        bytes32 faceHash;
    }

    /// @notice 토큰ID → Ticket
    mapping(uint256 => Ticket) public tickets;
    /// @notice (사용자 주소, 공연ID) 쌍으로 중복 mint 방지
    mapping(address => mapping(bytes32 => bool)) public hasMintedForConcert;
    /// @notice 토큰ID → tokenURI
    mapping(uint256 => string) private _tokenURIs;

    /// @notice 토큰이 취소되었는지 여부 (영구 상태)
    mapping(uint256 => bool) public isCancelled;

    mapping(uint256 => bool) private _minted;  // 중복 방지

    /// @param _admin 배포 시점에 지정할 관리자 지갑주소
    constructor(address _admin) ERC721("SBTicket", "SBT") Ownable(_admin) {
        transferOwnership(_admin);
    }

    event TicketMinted(address indexed to, uint256 indexed tokenId, string uri);

    /// @notice 새 티켓 민팅 (예매)
    /// @param tokenId     백엔드에서 생성한 16자리 숫자 tokenId
    /// @param concertId   공연 식별자
    /// @param seatNumber  좌석번호 (예: "A-01")
    /// @param uri         메타데이터 URI
    /// @param price       백엔드에서 전달한 티켓 가격 (msg.value 와 동일해야 함)
    function mintTicket(
        uint256    tokenId,
        bytes32 concertId,
        string calldata seatNumber,
        string calldata uri,
        uint256 price
    ) external payable {
        require(msg.value == price, unicode"💸 정확한 금액을 전송하세요");
        require(
            !hasMintedForConcert[msg.sender][concertId],
            unicode"⛔ 이미 해당 공연을 mint했습니다"
        );
        require(!_minted[tokenId], unicode"⛔ Duplicate tokenId");
        _minted[tokenId] = true;
        hasMintedForConcert[msg.sender][concertId] = true;

        _safeMint(msg.sender, tokenId);
        _tokenURIs[tokenId] = uri;

        // 수수료 계산 및 관리자에게 전송
        uint256 fee = (price * FEE_NUMERATOR) / FEE_DENOMINATOR;
        (bool sent, ) = payable(owner()).call{ value: fee }("");
        require(sent, unicode"수수료 전송 실패");

         // 티켓 정보 저장 (net price 저장)
         tickets[tokenId] = Ticket({
             concertId:     concertId,
             seatNumber:    seatNumber,
             issuedAt:      block.timestamp,
             price:         price - fee,
             isUsed:        false,
             isFaceVerified:false,
             faceHash:      bytes32(0)
         });

        hasMintedForConcert[msg.sender][concertId] = true;

        emit TicketMinted(msg.sender, tokenId, uri);

    }

    /// @notice tokenURI 조회
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

    /// @notice 얼굴 해시 등록 (관리자 전용)
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

    /// @notice 얼굴 인증 통과 표시 (관리자 전용)
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

    /// @notice 입장 처리 (관리자 전용)
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

    /// @notice 티켓이 취소될 때 발생시키는 이벤트
    /// @param tokenId     취소된 토큰 ID
    /// @param reopenTime  다시 오픈 가능한 Unix timestamp
    event TicketCancelled(uint256 indexed tokenId, uint256 reopenTime);

    /// @notice 티켓 취소 (관리자 전용), 12시간 이내 랜덤 재오픈
    function cancelTicket(uint256 tokenId) external onlyOwner {
        require(tickets[tokenId].issuedAt != 0, unicode"❌ 존재하지 않는 티켓");
        require(!isCancelled[tokenId], unicode"⛔ 이미 취소된 티켓");
        // 1) 상태 변경
        isCancelled[tokenId] = true;

         // 2) 0 ~ 12시간(43 200초) 내 랜덤 offset 계산
        uint256 maxDelay = 12 hours; // solidity 단위 사용 가능 (12 * 3600)
        // keccak256(블록타임, 토큰ID, 블록난이도) → uint256 해시 → 모듈러
        uint256 randOffset = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    tokenId,
                    block.prevrandao,
                    blockhash(block.number - 1)
                )
            )
        ) % maxDelay;

        // 3) 재오픈 시점
        uint256 reopenTime = block.timestamp + randOffset;

        // 4) 이벤트 발행
        emit TicketCancelled(tokenId, reopenTime);
    }

    /// @notice 티켓 재오픈 (관리자 전용)
    function reopenTicket(uint256 tokenId) external onlyOwner {
        require(tickets[tokenId].issuedAt != 0, unicode"❌ 존재하지 않는 티켓");
        require(isCancelled[tokenId], unicode"⛔ 취소된 티켓이 아닙니다");
        isCancelled[tokenId] = false;
    }

    // ────────────────────────────────────────────
    // 소울바운드: 승인·전송 관련 public/external 함수만 override
    // ────────────────────────────────────────────

    function approve(address, uint256) public pure override {
        revert("SBT: approval disabled");
    }

    function setApprovalForAll(address, bool) public pure override {
        revert("SBT: approval disabled");
    }

    function transferFrom(address, address, uint256) public pure override {
        revert("SBT: transfer disabled");
    }

    function safeTransferFrom(
        address,
        address,
        uint256,
        bytes memory
    ) public pure override {
        revert("SBT: transfer disabled");
    }
}
