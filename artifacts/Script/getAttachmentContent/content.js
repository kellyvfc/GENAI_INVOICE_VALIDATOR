// API: GET /attachmentContent?id=XXX
// Returns the attachment as binary with its own Content-Type, shown inline.
// Use the URL directly as the source of sap.m.PDFViewer (PDF) or sap.m.Image (images).

const id = req.query?.id;
if (typeof id !== 'string' || !id) {
    result.statusCode = 400;
    result.data = { error: 'id is required' };
    return complete();
}

const attachment = await entities.genai_claim_attachment.findOne({ where: { id } });
if (!attachment) {
    result.statusCode = 404;
    result.data = { error: 'Attachment not found' };
    return complete();
}

const safeName = String(attachment.fileName || 'attachment').replace(/["\\\r\n]/g, '_');

result.contentType = attachment.mediaType;
result.headers = {
    'Content-Disposition': `inline; filename="${safeName}"`,
    'Cache-Control': 'private, max-age=300',
    'X-Content-Type-Options': 'nosniff'
};
result.data = Buffer.from(attachment.fileData, 'base64');
complete();
