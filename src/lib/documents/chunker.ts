import type { DocumentChunk } from "../types";
import { generateId } from "../utils";

const DEFAULT_CHUNK_SIZE = 500; // characters
const DEFAULT_OVERLAP = 100; // characters

export function chunkText(
  text: string,
  documentId: string,
  documentName: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_OVERLAP
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];

  // Split by paragraphs first, then by size
  const paragraphs = text.split(/\n\s*\n/);
  let currentChunk = "";
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;

    if (currentChunk.length + trimmedParagraph.length > chunkSize && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        id: generateId(),
        documentId,
        documentName,
        content: currentChunk.trim(),
        index: chunkIndex++,
      });

      // Keep overlap
      if (overlap > 0 && currentChunk.length > overlap) {
        currentChunk = currentChunk.slice(-overlap) + "\n\n" + trimmedParagraph;
      } else {
        currentChunk = trimmedParagraph;
      }
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + trimmedParagraph;
    }

    // If single paragraph is too large, split it
    if (currentChunk.length > chunkSize * 1.5) {
      const sentences = currentChunk.split(/(?<=[.!?])\s+/);
      let subChunk = "";

      for (const sentence of sentences) {
        if (subChunk.length + sentence.length > chunkSize && subChunk.length > 0) {
          chunks.push({
            id: generateId(),
            documentId,
            documentName,
            content: subChunk.trim(),
            index: chunkIndex++,
          });
          subChunk = sentence;
        } else {
          subChunk += (subChunk ? " " : "") + sentence;
        }
      }
      currentChunk = subChunk;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push({
      id: generateId(),
      documentId,
      documentName,
      content: currentChunk.trim(),
      index: chunkIndex,
    });
  }

  return chunks;
}
