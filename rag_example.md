# 🤖 실제 RAG 구현 예시

## 1. 데이터 준비 및 벡터화

```python
# 1단계: 콘서트 정보를 문서로 변환
documents = [
    "아이유 콘서트 2024년 12월 KSPO DOME에서 개최. 발라드와 댄스곡 혼합 공연",
    "BTS 월드투어 서울 콘서트 잠실 올림픽 주경기장 2024년 11월",
    "뉴진스 팬미팅 올림픽공원 체조경기장에서 진행"
]

# 2단계: 임베딩 모델로 벡터화
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('all-MiniLM-L6-v2')
embeddings = model.encode(documents)

# 3단계: 벡터 DB에 저장
import pinecone
pinecone.init(api_key="your-key")
index = pinecone.Index("tickity-concerts")

for i, (doc, emb) in enumerate(zip(documents, embeddings)):
    index.upsert([(f"doc-{i}", emb.tolist(), {"text": doc})])
```

## 2. 검색 및 응답 생성

```python
def rag_chatbot(user_query):
    # 사용자 질문 벡터화
    query_embedding = model.encode([user_query])
    
    # 유사도 검색으로 관련 문서 찾기
    results = index.query(
        vector=query_embedding[0].tolist(),
        top_k=3,
        include_metadata=True
    )
    
    # 관련 문서들을 컨텍스트로 조합
    context = "\n".join([match['metadata']['text'] for match in results['matches']])
    
    # LLM에게 컨텍스트와 질문 전달
    prompt = f"""
    다음 정보를 바탕으로 답변하세요:
    {context}
    
    질문: {user_query}
    """
    
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    
    return response.choices[0].message.content

# 사용 예시
answer = rag_chatbot("12월에 있는 발라드 콘서트 알려줘")
# → "아이유 콘서트가 2024년 12월 KSPO DOME에서..."
```

## 3. 현재 Tickity 방식 vs RAG 비교

### 현재 방식 (데이터 주입)
```typescript
// 1. 의도 분석
if (message.includes('콘서트')) intent = 'concert_inquiry';

// 2. DB에서 모든 데이터 조회
const concerts = await getConcerts();

// 3. HTML 테이블로 포맷팅
const tableHTML = concerts.map(c => `<tr><td>${c.title}</td></tr>`).join('');

// 4. 프롬프트에 모든 데이터 포함
const prompt = `콘서트 목록: ${tableHTML}\n질문: ${message}`;
```

### RAG 방식
```typescript
// 1. 사용자 질문 벡터화
const queryEmbedding = await embedQuery(message);

// 2. 유사도 검색으로 관련 문서만 찾기
const relevantDocs = await vectorDB.search(queryEmbedding, topK: 3);

// 3. 찾은 문서들만 컨텍스트로 사용
const context = relevantDocs.map(doc => doc.content).join('\n');

// 4. 효율적인 프롬프트
const prompt = `관련 정보: ${context}\n질문: ${message}`;
```

## 4. 각 방식의 장단점

### 현재 방식 장점:
- ✅ 구현 간단
- ✅ DB와 직접 연결
- ✅ 실시간 데이터 반영
- ✅ 정확한 정보 제공

### RAG 방식 장점:
- ✅ 대용량 문서 처리 가능
- ✅ 의미적 유사도 검색
- ✅ 프롬프트 길이 효율화
- ✅ 확장성 좋음

### 현재 방식 단점:
- ❌ 프롬프트 길이 제한
- ❌ 대용량 데이터 시 비효율
- ❌ 단순 키워드 매칭

### RAG 방식 단점:
- ❌ 복잡한 인프라 필요
- ❌ 임베딩 업데이트 지연
- ❌ 벡터 DB 관리 비용
- ❌ 할루시네이션 가능성 