# Sample Files for NLP Pipeline Testing

This directory contains sample documents for testing the DocuChat NLP pipeline.

## Required Files

### 1. sample.txt ✅
A sample text file is already provided. It contains content about AI and machine learning.

### 2. sample.pdf
You need to create this file. Options:

**Option A: Convert from sample.txt**
```bash
# Using pandoc (install with: brew install pandoc or apt-get install pandoc)
pandoc sample.txt -o sample.pdf

# Or using Python with reportlab
pip install reportlab
python create_sample_pdf.py
```

**Option B: Use any PDF document**
- Download any academic paper or document
- Rename it to `sample.pdf`
- Place it in this directory

**Option C: Create from Word/LibreOffice**
- Open sample.txt in Word or LibreOffice
- Export/Save as PDF
- Name it `sample.pdf`

### 3. sample.docx
You need to create this file. Options:

**Option A: Convert from sample.txt**
```bash
# Using pandoc
pandoc sample.txt -o sample.docx

# Or using Python with python-docx
pip install python-docx
python create_sample_docx.py
```

**Option B: Use any DOCX document**
- Open sample.txt in Word or LibreOffice
- Save as .docx format
- Name it `sample.docx`

## Quick Setup Script

Run this to create all sample files:

```bash
cd backend/tests/nlp_tests/sample_files

# Create DOCX from TXT (requires python-docx)
pip install python-docx
python3 << 'EOF'
from docx import Document

# Read the text file
with open('sample.txt', 'r') as f:
    content = f.read()

# Create a new Document
doc = Document()

# Split content by lines and add paragraphs
for line in content.split('\n'):
    if line.strip():
        # Check if it's a heading
        if line.startswith('# '):
            doc.add_heading(line[2:], level=1)
        elif line.startswith('## '):
            doc.add_heading(line[3:], level=2)
        elif line.startswith('### '):
            doc.add_heading(line[4:], level=3)
        else:
            doc.add_paragraph(line)

# Save the document
doc.save('sample.docx')
print("✅ Created sample.docx")
EOF

# Create PDF from TXT (requires reportlab)
pip install reportlab
python3 << 'EOF'
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

# Read the text file
with open('sample.txt', 'r') as f:
    content = f.read()

# Create PDF
doc = SimpleDocTemplate("sample.pdf", pagesize=letter)
styles = getSampleStyleSheet()
story = []

for line in content.split('\n'):
    if line.strip():
        if line.startswith('# '):
            story.append(Paragraph(line[2:], styles['Heading1']))
        elif line.startswith('## '):
            story.append(Paragraph(line[3:], styles['Heading2']))
        elif line.startswith('### '):
            story.append(Paragraph(line[4:], styles['Heading3']))
        else:
            story.append(Paragraph(line, styles['Normal']))
        story.append(Spacer(1, 12))

doc.build(story)
print("✅ Created sample.pdf")
EOF
```

## Testing

After creating the sample files, run the tests:

```bash
# Test extraction
python test_extraction.py

# Test chunking
python test_chunking.py

# Test embedding
python test_embedding.py

# Test full pipeline
python test_full_pipeline.py
```

## Expected Output

All test logs will be saved in the `logs/` directory with timestamps for inspection.
