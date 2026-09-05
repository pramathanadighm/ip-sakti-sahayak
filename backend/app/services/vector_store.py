import uuid
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient, models
from app.core.config import settings
from app.services.embeddings import embedding_service

class QdrantVectorStore:
    def __init__(self):
        self.collection_name = settings.QDRANT_COLLECTION
        self.client = self._init_client()
        self._ensure_collection()

    def _init_client(self) -> QdrantClient:
        """
        Initializes Qdrant client with automatic fallback.
        Attempts remote Docker Qdrant (localhost:6333) first;
        if unavailable, seamlessly initializes local disk-persisted storage.
        """
        if settings.USE_REMOTE_QDRANT:
            try:
                client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT, timeout=2.0)
                client.get_collections()
                print(f"Connected to remote Qdrant at {settings.QDRANT_HOST}:{settings.QDRANT_PORT}")
                return client
            except Exception as e:
                print(f"Remote Qdrant unavailable ({e}). Falling back to local embedded Qdrant.")

        # Local embedded persistent Qdrant
        print(f"Using local embedded Qdrant storage at {settings.QDRANT_LOCAL_PATH}")
        return QdrantClient(path=str(settings.QDRANT_LOCAL_PATH))

    def _ensure_collection(self):
        """Creates collection with both Dense (BGE-Large) and Sparse (BM25) vector support."""
        try:
            collections = [c.name for c in self.client.get_collections().collections]
            if self.collection_name not in collections:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config={
                        "dense": models.VectorParams(
                            size=settings.DENSE_VECTOR_SIZE,
                            distance=models.Distance.COSINE
                        )
                    },
                    sparse_vectors_config={
                        "sparse": models.SparseVectorParams()
                    }
                )
                print(f"Created Qdrant collection: {self.collection_name} (Dense + Sparse)")
        except Exception as e:
            print(f"Error ensuring collection: {e}")

    def upsert_chunks(self, document_id: str, source_document: str, chunks: List[Dict[str, Any]]) -> int:
        """
        Upserts extracted PDF chunks with Dense & Sparse vectors and complete bbox metadata.
        """
        if not chunks:
            return 0

        texts = [c["content"] for c in chunks]
        dense_vectors = embedding_service.embed_documents(texts)
        points: List[models.PointStruct] = []

        for i, chunk in enumerate(chunks):
            dense_vec = dense_vectors[i]
            sparse_dict = embedding_service.compute_sparse_bm25(chunk["content"])
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{document_id}_{chunk['chunk_index']}"))

            payload = {
                "document_id": document_id,
                "source_document": source_document,
                "chunk_index": chunk["chunk_index"],
                "page_number": chunk["page_number"],
                "bbox": chunk["bbox"],
                "bbox_normalized": chunk.get("bbox_normalized", []),
                "content": chunk["content"],
                "section_title": chunk.get("section_title", ""),
                "token_count": chunk.get("token_count", 0),
                "page_width": chunk.get("page_width", 0),
                "page_height": chunk.get("page_height", 0)
            }

            point = models.PointStruct(
                id=point_id,
                vector={
                    "dense": dense_vec,
                    "sparse": models.SparseVector(
                        indices=sparse_dict["indices"],
                        values=sparse_dict["values"]
                    )
                },
                payload=payload
            )
            points.append(point)

        self.client.upsert(
            collection_name=self.collection_name,
            points=points,
            wait=True
        )
        return len(points)

    def hybrid_search(
        self,
        query: str,
        top_k: int = 5,
        document_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Executes Hybrid Search combining Dense Cosine similarity + Sparse BM25 lexical similarity
        using Reciprocal Rank Fusion (RRF) for legal search accuracy.
        """
        query_dense = embedding_service.embed_query(query)
        query_sparse = embedding_service.compute_sparse_bm25(query)

        query_filter = None
        if document_id:
            query_filter = models.Filter(
                must=[
                    models.FieldCondition(
                        key="document_id",
                        match=models.MatchValue(value=document_id)
                    )
                ]
            )

        # 1. Dense Search
        dense_results = []
        try:
            dense_res = self.client.query_points(
                collection_name=self.collection_name,
                query=query_dense,
                using="dense",
                limit=top_k * 3,
                query_filter=query_filter,
                with_payload=True
            )
            dense_results = dense_res.points
        except Exception as e:
            print(f"Dense search warning: {e}")

        # 2. Sparse (BM25) Search
        sparse_results = []
        try:
            sparse_vector = models.SparseVector(
                indices=query_sparse["indices"],
                values=query_sparse["values"]
            )
            sparse_res = self.client.query_points(
                collection_name=self.collection_name,
                query=sparse_vector,
                using="sparse",
                limit=top_k * 3,
                query_filter=query_filter,
                with_payload=True
            )
            sparse_results = sparse_res.points
        except Exception as e:
            print(f"Sparse search warning: {e}")

        # 3. Reciprocal Rank Fusion (RRF)
        rrf_k = 60
        scores: Dict[str, float] = {}
        payloads: Dict[str, Dict[str, Any]] = {}

        for rank, res in enumerate(dense_results):
            pid = str(res.id)
            scores[pid] = scores.get(pid, 0.0) + (1.0 / (rrf_k + rank + 1))
            payloads[pid] = res.payload

        for rank, res in enumerate(sparse_results):
            pid = str(res.id)
            scores[pid] = scores.get(pid, 0.0) + (1.2 / (rrf_k + rank + 1))  # slight lexical legal boost
            payloads[pid] = res.payload

        # Sort by fused score
        sorted_pids = sorted(scores.keys(), key=lambda pid: scores[pid], reverse=True)
        top_pids = sorted_pids[:top_k]

        results = []
        for pid in top_pids:
            item = dict(payloads[pid])
            item["score"] = round(scores[pid], 4)
            results.append(item)

        return results

vector_store = QdrantVectorStore()
