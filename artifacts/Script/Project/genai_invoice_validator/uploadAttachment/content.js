// API: POST /attachments
// Body:    { claimNo, fileName, file }   file = base64 data URI (PNG, JPEG, GIF, WebP or PDF, max 10 MB)
// Returns: { attachment: { id, claimNo, fileName, mediaType, sizeBytes, uploadedAt, uploadedBy, canDelete, lastValidation } }

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'];
const MAX_BYTES = 10 * 1024 * 1024;

const fail = (statusCode, error) => {
    result.statusCode = statusCode;
    result.data = { error };
    complete();
};

const { claimNo, fileName, file } = req.body || {};

const match = typeof file === 'string' ? file.match(/^data:([^;]+);base64,(.+)$/) : null;
if (typeof claimNo !== 'string' || !claimNo || !match) {
    return fail(400, 'claimNo and file (base64 data URI) are required');
}
const mediaType = match[1].toLowerCase();
if (!ALLOWED_TYPES.includes(mediaType)) {
    return fail(415, `Unsupported file type ${mediaType}. Allowed: PNG, JPEG, GIF, WebP, PDF.`);
}
const buffer = Buffer.from(match[2], 'base64');
if (buffer.length === 0 || buffer.length > MAX_BYTES) {
    return fail(413, `File must be between 1 byte and ${MAX_BYTES / 1024 / 1024} MB`);
}

const claim = await entities.genai_claim.findOne({ where: { claimNo } });
if (!claim) {
    return fail(404, `Claim ${claimNo} not found`);
}

// Keep only a safe display name (no paths, no control characters)
const safeName = String(fileName || 'invoice')
    .split(/[\\/]/).pop()
    .replace(/[\u0000-\u001f<>:"|?*]/g, '_')
    .slice(0, 200) || 'invoice';

const digest = await crypto.subtle.digest('SHA-256', buffer);

const saved = await entities.genai_claim_attachment.save({
    claimNo,
    fileName: safeName,
    mediaType,
    sizeBytes: buffer.length,
    fileHash: Buffer.from(digest).toString('hex'),
    fileData: match[2]
});

// Re-read without the file contents to get the server-set createdAt / createdBy
const stored = await entities.genai_claim_attachment.findOne({
    select: ['id', 'createdAt', 'createdBy'],
    where: { id: saved.id }
});

log.info(`Attachment uploaded: ${saved.id}, claim ${claimNo}, ${mediaType}, ${buffer.length} bytes`);

result.statusCode = 201;
result.data = {
    attachment: {
        id: saved.id,
        claimNo,
        fileName: safeName,
        mediaType,
        sizeBytes: buffer.length,
        uploadedAt: Number(stored.createdAt),
        uploadedBy: stored.createdBy,
        canDelete: true,
        lastValidation: null
    }
};
complete();
