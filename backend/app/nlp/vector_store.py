"""
Vector Store Module using ChromaDB.
Handles indexing of document chunks and semantic search.
"""
import chromadb
from chromadb.config import Settings as ChromaSettings
from pathlib import Path
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class AcademicVectorStore:
    def __init__(self, persist_directory: str = "./chroma_db"):
        """
        Initialize the ChromaDB client.
        
        Args:
            persist_directory: Where to store the vector database on disk.
        """
        self.persist_directory = persist_directory
        Path(persist_directory).mkdir(parents=True, exist_ok=True)
        
        # Use PersistentClient to save data between runs
        self.client = chromadb.PersistentClient(path=persist_directory)
        
        # We'll create collections dynamically per document or use one global one
        # For this student project, let's use one global collection named "academic_docs"
        self.collection_name = "academic_docs"
        
        try:
            self.collection = self.client.get_collection(name=self.collection_name)
            logger.info(f"✅ Loaded existing collection: {self.collection_name}")
        except ValueError:
            self.collection = self.client.create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"} # Use cosine similarity for embeddings
            )
            logger.info(f"🆕 Created new collection: {self.collection_name}")

    def add_chunks(self, document_id: str, chunks: List[Dict[str, Any]], embeddings: List[List[float]]):
        """
        Add processed chunks to the vector store.
        
        Args:
            document_id: Unique ID for the document (e.g., '5th_sem_pdf').
            chunks: List of chunk dicts containing 'text', 'page_number', etc.
            embeddings: List of vector embeddings corresponding to the chunks.
        """
        if not chunks or not embeddings:
            return

        ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
        documents = [chunk['text'] for chunk in chunks]
        
        # Metadata is crucial for citations!
        metadatas = [
            {
                "document_id": document_id,
                "page_number": chunk.get('page_number', 0),
                "chunk_index": chunk.get('chunk_index', 0),
                "source": chunk.get('source', 'unknown')
            } 
            for chunk in chunks
        ]

        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )
        logger.info(f"📥 Indexed {len(chunks)} chunks for document: {document_id}")

    def search(self, query_embedding: List[float], top_k: int = 3, filter_doc_id: str = None) -> List[Dict[str, Any]]:
        """
        Search for relevant chunks using a query embedding.
        
        Args:
            query_embedding: The vector representation of the user's question.
            top_k: Number of results to return.
            filter_doc_id: Optional. Only search within a specific document.
            
        Returns:
            List of results with text, page number, and distance score.
        """
        try:
            if not query_embedding:
                raise ValueError("Query embedding cannot be empty.")

            where_filter = {"document_id": filter_doc_id} if filter_doc_id else None
            
            logger.info(f"🔍 Searching for top {top_k} results...")
            
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=where_filter,
                include=['documents', 'metadatas', 'distances']
            )
            
            formatted_results = []
            # Chroma returns lists of lists, so we check the first index
            if results['ids'] and results['ids'][0]:
                for i in range(len(results['ids'][0])):
                    formatted_results.append({
                        "text": results['documents'][0][i],
                        "page_number": results['metadatas'][0][i].get('page_number', 'N/A'),
                        "distance": results['distances'][0][i],
                        "document_id": results['metadatas'][0][i].get('document_id', 'unknown')
                    })
                    
            logger.info(f"✅ Found {len(formatted_results)} relevant chunks.")
            return formatted_results

        except Exception as e:
            logger.error(f"❌ Search failed: {str(e)}")
            return []

# Singleton instance for easy access
_vector_store_instance = None

def get_vector_store() -> AcademicVectorStore:
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = AcademicVectorStore()
    return _vector_store_instance