# NLP Pipeline Testing Tools

This folder contains tools for testing the DocuChat NLP pipeline step by step.

## Structure

```
nlp_tests/
├── test_extraction.py      # Test document text extraction
├── test_chunking.py        # Test text chunking
├── test_embedding.py       # Test vector embeddings
├── test_full_pipeline.py   # Test complete pipeline
├── sample_files/           # Sample documents for testing
│   ├── sample.pdf
│   ├── sample.docx
│   └── sample.txt
└── logs/                   # Test output logs
```

## Usage

### 1. Test Extraction
```bash
python test_extraction.py
```
Tests text extraction from PDF, DOCX, and TXT files.

### 2. Test Chunking
```bash
python test_chunking.py
```
Tests semantic chunking of extracted text.

### 3. Test Embedding
```bash
python test_embedding.py
```
Tests vector embedding generation.

### 4. Test Full Pipeline
```bash
python test_full_pipeline.py
```
Tests the complete NLP pipeline end-to-end.

## Sample Files

Add your test documents to the `sample_files/` folder:
- `sample.pdf` - A sample PDF document
- `sample.docx` - A sample DOCX document
- `sample.txt` - A sample TXT document

## Logs

All test outputs are logged to the `logs/` folder with timestamps for inspection.
