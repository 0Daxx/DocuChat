"""
Test script for Semantic Search and Citation Retrieval.
Tests the ability to find relevant chunks and return page numbers.
"""
import sys
from pathlib import Path
import numpy as np

# Setup paths
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.nlp.vector_store import get_vector_store
from app.nlp.model_manager import get_embedding_model
from app.config import settings

def test_semantic_search():
    """Test searching the vector store with a sample query."""
    print("\n" + "="*60)
    print("🔍 Testing Semantic Search & Citations")
    print("="*60)

    try:
        # 1. Initialize Components
        vs = get_vector_store()
        model = get_embedding_model()
        
        # 2. Define a Test Query
        # Use a question you know is answered in one of your PDFs
        query = "What are the main topics covered in the 5th semester?" 
        print(f"\n❓ User Query: '{query}'")
        
        # 3. Generate Query Embedding
        print("⏳ Generating query embedding...")
        query_embedding = model.encode([query])[0].tolist()
        
        # 4. Perform Search
        # We can search all docs or filter by a specific document ID (filename stem)
        results = vs.search(query_embedding=query_embedding, top_k=3)
        
        if not results:
            print("⚠️ No results found. Ensure you have run the pipeline to index files first.")
            return

        # 5. Display Results with Citations
        print(f"\n📊 Found {len(results)} relevant chunks:\n")
        for i, res in enumerate(results):
            print(f"   --- Result {i+1} ---")
            print(f"   📄 Source: {res['document_id']} | Page: {res['page_number']}")
            print(f"   📏 Relevance Score (Distance): {res['distance']:.4f}")
            print(f"   📝 Content: {res['text'][:200]}...")
            print()

    except Exception as e:
        print(f"❌ Critical Search Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_semantic_search()