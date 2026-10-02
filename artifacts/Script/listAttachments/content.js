// API: GET /attachments?claimNo=XXX
// Returns: { attachments: [ { id, claimNo, fileName, mediaType, sizeBytes, uploadedAt, uploadedBy, canDelete, lastValidation } ] }  newest first
// File contents are never returned here (see GET /attachments/file).

const claimNo = req.query?.claimNo;
if (typeof claimNo !== 'string' || !claimNo) {
    result.statusCode = 400;
    result.data = { error: 'claimNo is required' };
    return complete();
}

const parseJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);
const currentUser = req.user?.username;

const attachments = await entities.genai_claim_attachment.find({
    select: ['id', 'claimNo', 'fileName', 'mediaType', 'sizeBytes', 'createdAt', 'createdBy'],
    where: { claimNo },
    order: { createdAt: 'DESC' }
});

// Latest validation per attachment (results for this claim, newest first)
const results = await entities.genai_invoice_result.find({ where: { claimNo }, order: { createdAt: 'DESC' } });
const latest = {};
for (const r of results) {
    if (r.attachmentId && !latest[r.attachmentId]) {
        const extraction = parseJson(r.extraction) || {};
        latest[r.attachmentId] = {
            requestId: r.requestId,
            validatedAt: Number(r.createdAt),
            similarity: Number(r.similarity),
            redFlagCount: (extraction.redFlags || []).length,
            vendor: extraction.vendor ?? null
        };
    }
}

result.data = {
    attachments: attachments.map(a => ({
        id: a.id,
        claimNo: a.claimNo,
        fileName: a.fileName,
        mediaType: a.mediaType,
        sizeBytes: a.sizeBytes,
        uploadedAt: Number(a.createdAt),
        uploadedBy: a.createdBy,
        canDelete: !!currentUser && a.createdBy === currentUser,
        lastValidation: latest[a.id] || null
    }))
};
complete();
