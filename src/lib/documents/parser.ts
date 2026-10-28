import * as pdfjsLib from "pdfjs-dist";

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export async function parsePDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n\n";
  }

  return fullText.trim();
}

export async function parseDOCX(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export async function parseTXT(file: File): Promise<string> {
  return await file.text();
}

export async function parseDocument(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "pdf":
      return parsePDF(file);
    case "docx":
      return parseDOCX(file);
    case "txt":
      return parseTXT(file);
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}
