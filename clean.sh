#!/usr/bin/env bash
set -eux

echo "🧹 전체 캐시 및 아티팩트 삭제 시작…"

# 1) Hardhat 캐시/아티팩트
rm -rf cache            # Hardhat cache
rm -rf artifacts        # Hardhat artifacts

# 2) TypeChain typings
rm -rf blockchain/typechain/dist
rm -rf blockchain/typechain/cache

# 3) 백엔드 빌드 결과
rm -rf backend/dist

# 4) TS Node/dev 및 일반 Node 캐시
rm -rf backend/node_modules/.cache

# 5) Next.js (또는 Vite) 빌드 캐시
rm -rf frontend/.next
rm -rf frontend/node_modules/.vite

# 6) 기타 untracked 파일 싹 정리 (주의: untracked 전부 삭제)
#    git clean -fdx

echo "✅ 캐시 및 아티팩트 삭제 완료."
