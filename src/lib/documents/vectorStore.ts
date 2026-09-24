import type { DocumentChunk, ChunkSource } from "../types";

/**
 * Simple TF-IDF based vector store for MVP.
 * Uses term frequency with cosine similarity for retrieval.
 * This avoids the need for external embedding APIs.
 */

interface TermFrequency {
  [term: string]: number;
}

// Simple tokenizer
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2); // Filter short words
}

// Compute term frequency for a document
function computeTF(tokens: string[]): TermFrequency {
  const tf: TermFrequency = {};
  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1;
  }
  // Normalize
  const maxFreq = Math.max(...Object.values(tf));
  for (const term in tf) {
    tf[term] = tf[term] / maxFreq;
  }
  return tf;
}

// Compute IDF across all documents
function computeIDF(documents: string[][]): { [term: string]: number } {
  const idf: { [term: string]: number } = {};
  const N = documents.length;

  // Count document frequency
  const docFreq: { [term: string]: number } = {};
  for (const doc of documents) {
    const uniqueTerms = new Set(doc);
    for (const term of uniqueTerms) {
      docFreq[term] = (docFreq[term] || 0) + 1;
    }
  }

  // Compute IDF
  for (const term in docFreq) {
    idf[term] = Math.log(N / docFreq[term]) + 1; // Add 1 for smoothing
  }

  return idf;
}

// Compute TF-IDF vector
function computeTFIDF(tf: TermFrequency, idf: { [term: string]: number }): Map<string, number> {
  const vector = new Map<string, number>();
  for (const term in tf) {
    const tfidf = tf[term] * (idf[term] || 1);
    if (tfidf > 0) {
      vector.set(term, tfidf);
    }
  }
  return vector;
}

// Cosine similarity between two sparse vectors
function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const [term, value] of a) {
    normA += value * value;
    if (b.has(term)) {
      dotProduct += value * b.get(term)!;
    }
  }

  for (const [, value] of b) {
    normB += value * value;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class VectorStore {
  private vectors: Map<string, Map<string, number>> = new Map();
  private idf: { [term: string]: number } = {};
  private chunks: DocumentChunk[] = [];

  buildIndex(chunks: DocumentChunk[]): void {
    this.chunks = chunks;
    this.vectors.clear();

    // Tokenize all chunks
    const allTokens = chunks.map(chunk => tokenize(chunk.content));

    // Compute IDF
    this.idf = computeIDF(allTokens);

    // Compute TF-IDF vectors for each chunk
    for (let i = 0; i < chunks.length; i++) {
      const tf = computeTF(allTokens[i]);
      const vector = computeTFIDF(tf, this.idf);
      this.vectors.set(chunks[i].id, vector);
    }
  }

  search(query: string, topK: number = 5, documentIds?: string[]): ChunkSource[] {
    if (this.chunks.length === 0) return [];

    // Tokenize query
    const queryTokens = tokenize(query);
    const queryTF = computeTF(queryTokens);
    const queryVector = computeTFIDF(queryTF, this.idf);

    // Compute similarity with all chunks
    const results: ChunkSource[] = [];

    for (const chunk of this.chunks) {
      // Filter by document if specified
      if (documentIds && documentIds.length > 0 && !documentIds.includes(chunk.documentId)) {
        continue;
      }

      const chunkVector = this.vectors.get(chunk.id);
      if (!chunkVector) continue;

      const score = cosineSimilarity(queryVector, chunkVector);
      if (score > 0.01) { // Minimum threshold
        results.push({
          chunkId: chunk.id,
          documentName: chunk.documentName,
          content: chunk.content,
          score,
        });
      }
    }

    // Sort by score descending and return top K
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  getChunkCount(): number {
    return this.chunks.length;
  }
}

// Singleton instance
export const vectorStore = new VectorStore();
