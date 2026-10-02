const { metadata, globals, outputs } = p9.processFlow.getData();

// Extract base64 PDF data and convert to buffer
const dataUrl = globals.image;
// Base64 PDF -> buffer
const base64Data = outputs.Activity_9s1fv5v.json.pdfBase64;
const buffer = Buffer.from(base64Data, 'base64');

//Pass through claim data and original base64
const claimData = globals.claimData || {};

// Extract text with pdf-parse v2
let extractedText = '';
let extractError = null;
try {
    const { PDFParse } = modules.pdfparse;
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy();
    extractedText = (parsed.text || '').trim();
} catch (e) {
    extractError = e.message;
}

// Scanned PDFs return little or no text
const hasText = extractedText.length > 50;

result.data = {
    json: {
        claimData,
        pdfBase64: base64Data,
        extractedText,
        hasText,
        extractError
    }
};