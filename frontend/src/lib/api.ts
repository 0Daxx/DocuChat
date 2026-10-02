/**
 * API client for DocuChat backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Types matching backend responses
export interface UploadResponse {
  document_id: string;
  message: string;
  chunk_count: number;
}

export interface Source {
  page_number: number;
  chunk_index: number;
  text: string;
}

export interface AskResponse {
  answer: string;
  sources: Source[];
  provider: string;
}

export interface Document {
  id: string;
  name: string;
  file_type: string;
  chunk_count: number;
  created_at: string;
}

/**
 * Upload a document to the backend
 */
export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload document');
  }

  return response.json();
}

/**
 * Ask a question about uploaded document(s)
 */
export async function askQuestion(
  question: string,
  documentId?: string
): Promise<AskResponse> {
  const response = await fetch(`${API_BASE_URL}/api/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      document_id: documentId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get answer');
  }

  return response.json();
}

/**
 * List all uploaded documents
 */
export async function listDocuments(): Promise<Document[]> {
  const response = await fetch(`${API_BASE_URL}/api/documents`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to list documents');
  }

  return response.json();
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete document');
  }
}
