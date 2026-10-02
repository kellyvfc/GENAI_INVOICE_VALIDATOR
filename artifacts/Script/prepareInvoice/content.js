// API: POST /prepare
// Body:    { attachmentId }
// Returns: { requestId, attachmentId, claimNo, path, mediaType, textPreview }
//   path = 'image' | 'text' (PDF with text) | 'scanned' (PDF without text)
//
// SECURITY (agents): the file is read from the stored attachment, never from the client,
// and this endpoint never builds or returns the agent prompt. /extract rebuilds it server-side.

const MIN_TEXT_LENGTH = 50; // below this, a PDF is treated as scanned

const fail = (statusCode, error) => {
    result.statusCode = statusCode;
    result.data = { error };
    complete();
};

const { attachmentId } = req.body || {};
if (typeof attachmentId !== 'string' || !attachmentId) {
    return fail(400, 'attachmentId is required (upload the file with POST /attachments first)');
}

const attachment = await entities.genai_claim_attachment.findOne({ where: { id: attachmentId } });
if (!attachment) {
    return fail(404, 'Attachment not found');
}
const claim = await entities.genai_claim.findOne({ where: { claimNo: attachment.claimNo } });
if (!claim) {
    return fail(404, `Claim ${attachment.claimNo} not found`);
}

const busy = await entities.genai_invoice_request.findOne({ where: { attachmentId, status: 'processing' } });
if (busy) {
    return fail(409, 'This attachment is already being validated');
}

// --- Decide the path ---
let path = 'image';
let extractedText = '';
if (attachment.mediaType === 'application/pdf') {
    try {
        const { PDFParse } = modules.pdfparse;
        const parser = new PDFParse({ data: Buffer.from(attachment.fileData, 'base64') });
        const parsed = await parser.getText();
        await parser.destroy();
        extractedText = (parsed.text || '').trim();
    } catch (e) {
        log.warn(`PDF text extraction failed (attachment ${attachmentId}): ${e.message}`);
    }
    path = extractedText.length > MIN_TEXT_LENGTH ? 'text' : 'scanned';
}

// --- Store the request server-side ---
const requestId = crypto.randomUUID();
await entities.genai_invoice_request.save({
    requestId,
    attachmentId,
    claimNo: claim.claimNo,
    path,
    mediaType: attachment.mediaType,
    fileHash: attachment.fileHash,
    extractedText: path === 'text' ? extractedText : null,
    status: 'prepared'
});

log.info(`Invoice validation prepared: request ${requestId}, attachment ${attachmentId}, claim ${claim.claimNo}, path ${path}`);

result.data = {
    requestId,
    attachmentId,
    claimNo: claim.claimNo,
    path,
    mediaType: attachment.mediaType,
    textPreview: extractedText.slice(0, 300)
};
complete();
