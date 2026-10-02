"""
Test script for vector embeddings.
Tests embedding generation for text chunks.
"""

import sys
import os
import json
from pathlib import Path
from datetime import datetime
import numpy as np

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.nlp.extract import extract_document
from app.nlp.chunk import chunk_pages
from app.nlp.embed import embed_texts, embed_query, get_model
from app.logging_system import log_embedding

# Test directory
TEST_DIR = Path(__file__).parent
SAMPLE_DIR = TEST_DIR / "sample_files"
LOG_DIR = TEST_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)


def test_model_loading():
    """Test embedding model loading."""
    print("\n" + "="*60)
    print("Testing Model Loading")
    print("="*60)
    
    try:
        print("🔄 Loading embedding model...")
        model = get_model()
        
        print(f"✅ Model loaded successfully!")
        print(f"📊 Model name: {model[0].auto_model.config._name_or_path}")
        print(f"📏 Embedding dimension: {model[1].sentence_embedding_dimension}")
        
        return model
        
    except Exception as e:
        print(f"❌ Model loading failed: {str(e)}")
        return None


def test_text_embedding():
    """Test embedding generation for text."""
    print("\n" + "="*60)
    print("Testing Text Embedding")
    print("="*60)
    
    # Test with sample texts
    sample_texts = [
        "This is a test sentence about machine learning.",
        "Artificial intelligence is transforming the world.",
        "Natural language processing helps computers understand human language.",
        "Deep learning models require large amounts of training data.",
        "Vector embeddings represent text as numerical vectors."
    ]
    
    try:
        print(f"📝 Generating embeddings for {len(sample_texts)} sample texts...")
        
        embeddings = embed_texts(sample_texts)
        
        print(f"✅ Embeddings generated successfully!")
        print(f"📊 Number of embeddings: {len(embeddings)}")
        print(f"📏 Embedding dimension: {len(embeddings[0])}")
        
        # Show statistics
        embeddings_array = np.array(embeddings)
        print(f"\n📈 Embedding statistics:")
        print(f"   Mean: {embeddings_array.mean():.6f}")
        print(f"   Std: {embeddings_array.std():.6f}")
        print(f"   Min: {embeddings_array.min():.6f}")
        print(f"   Max: {embeddings_array.max():.6f}")
        
        # Calculate cosine similarities
        print(f"\n🔍 Cosine similarities:")
        for i in range(len(sample_texts)):
            for j in range(i+1, len(sample_texts)):
                similarity = np.dot(embeddings[i], embeddings[j]) / (
                    np.linalg.norm(embeddings[i]) * np.linalg.norm(embeddings[j])
                )
                print(f"   Text {i+1} vs Text {j+1}: {similarity:.4f}")
        
        # Save log
        log_file = LOG_DIR / f"embedding_text_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump({
                "test_type": "sample_texts",
                "text_count": len(sample_texts),
                "embedding_dim": len(embeddings[0]),
                "texts": sample_texts,
                "embeddings_preview": [
                    {
                        "text": text[:100],
                        "embedding_preview": emb[:10].tolist(),
                        "embedding_norm": float(np.linalg.norm(emb))
                    }
                    for text, emb in zip(sample_texts, embeddings)
                ]
            }, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Detailed log saved to: {log_file}")
        
        return embeddings
        
    except Exception as e:
        print(f"❌ Text embedding failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


def test_query_embedding():
    """Test query embedding generation."""
    print("\n" + "="*60)
    print("Testing Query Embedding")
    print("="*60)
    
    sample_queries = [
        "What is machine learning?",
        "How does natural language processing work?",
        "Explain deep learning algorithms."
    ]
    
    try:
        print(f"📝 Generating embeddings for {len(sample_queries)} queries...")
        
        embeddings = []
        for i, query in enumerate(sample_queries):
            print(f"\n   Query {i+1}: {query}")
            embedding = embed_query(query)
            embeddings.append(embedding)
            print(f"   ✅ Embedding dimension: {len(embedding)}")
            print(f"   📏 Norm: {np.linalg.norm(embedding):.4f}")
        
        print(f"\n✅ All query embeddings generated successfully!")
        
        # Save log
        log_file = LOG_DIR / f"embedding_query_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump({
                "test_type": "queries",
                "query_count": len(sample_queries),
                "embedding_dim": len(embeddings[0]),
                "queries": [
                    {
                        "query": query,
                        "embedding_preview": emb[:10].tolist(),
                        "embedding_norm": float(np.linalg.norm(emb))
                    }
                    for query, emb in zip(sample_queries, embeddings)
                ]
            }, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Detailed log saved to: {log_file}")
        
        return embeddings
        
    except Exception as e:
        print(f"❌ Query embedding failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


def test_document_embedding(file_type: str = "pdf"):
    """Test embedding generation for document chunks."""
    print("\n" + "="*60)
    print(f"Testing Document Embedding - {file_type.upper()}")
    print("="*60)
    
    file_path = SAMPLE_DIR / f"sample.{file_type}"
    if not file_path.exists():
        print(f"❌ Sample file not found: {file_path}")
        return None
    
    try:
        # Extract and chunk
        print(f"📄 Extracting and chunking: {file_path.name}")
        with open(file_path, 'rb') as f:
            file_content = f.read()
        
        pages = extract_document(file_content, file_type)
        if not pages:
            print("❌ No text extracted")
            return None
        
        chunks = chunk_pages(pages)
        if not chunks:
            print("❌ No chunks created")
            return None
        
        print(f"✅ Created {len(chunks)} chunks")
        
        # Generate embeddings
        print(f"\n🔄 Generating embeddings for {len(chunks)} chunks...")
        chunk_texts = [chunk["text"] for chunk in chunks]
        embeddings = embed_texts(chunk_texts)
        
        print(f"✅ Embeddings generated successfully!")
        print(f"📊 Number of embeddings: {len(embeddings)}")
        print(f"📏 Embedding dimension: {len(embeddings[0])}")
        
        # Statistics
        embeddings_array = np.array(embeddings)
        print(f"\n📈 Embedding statistics:")
        print(f"   Mean: {embeddings_array.mean():.6f}")
        print(f"   Std: {embeddings_array.std():.6f}")
        print(f"   Min: {embeddings_array.min():.6f}")
        print(f"   Max: {embeddings_array.max():.6f}")
        
        # Log embedding
        from app.config import settings
        log_embedding(
            document_id=f"test_{file_type}",
            chunk_count=len(chunks),
            embedding_dim=len(embeddings[0]),
            model_name=settings.EMBEDDING_MODEL
        )
        
        # Save detailed log
        log_file = LOG_DIR / f"embedding_document_{file_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump({
                "file": file_path.name,
                "file_type": file_type,
                "chunk_count": len(chunks),
                "embedding_dim": len(embeddings[0]),
                "statistics": {
                    "mean": float(embeddings_array.mean()),
                    "std": float(embeddings_array.std()),
                    "min": float(embeddings_array.min()),
                    "max": float(embeddings_array.max())
                },
                "chunks_preview": [
                    {
                        "chunk_index": chunk.get("chunk_index"),
                        "page_number": chunk.get("page_number"),
                        "text_preview": chunk.get("text", "")[:200],
                        "embedding_preview": emb[:10].tolist(),
                        "embedding_norm": float(np.linalg.norm(emb))
                    }
                    for chunk, emb in zip(chunks, embeddings)
                ]
            }, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Detailed log saved to: {log_file}")
        
        return embeddings
        
    except Exception as e:
        print(f"❌ Document embedding failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


def main():
    """Run all embedding tests."""
    print("\n" + "="*60)
    print("DocuChat NLP Pipeline - Embedding Tests")
    print("="*60)
    print(f"Test directory: {TEST_DIR}")
    print(f"Sample files: {SAMPLE_DIR}")
    print(f"Log directory: {LOG_DIR}")
    
    # Test model loading
    model = test_model_loading()
    if not model:
        print("\n❌ Cannot proceed without model")
        return
    
    # Test text embedding
    test_text_embedding()
    
    # Test query embedding
    test_query_embedding()
    
    # Test document embedding for each file type
    for file_type in ["pdf", "docx", "txt"]:
        test_document_embedding(file_type)
    
    print("\n" + "="*60)
    print("Embedding tests completed!")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
