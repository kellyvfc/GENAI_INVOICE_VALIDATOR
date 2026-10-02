// API: GET /claims
//   no query        -> { claims: [ ...claim, lastValidation ] }
//   ?claimNo=XXXX   -> { claim, validations: [ newest first ] }
// Only validations that belong to an attachment that still exists are returned
// (older results without an attachment, or of deleted attachments, are ignored).
// Timestamps (createdAt / updatedAt / validatedAt) are returned as epoch milliseconds (numbers).

const parseJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);
const toMs = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

const toClaim = (c) => ({
    ...c,
    createdAt: toMs(c.createdAt),
    updatedAt: toMs(c.updatedAt),
    claimAmount: Number(c.claimAmount)
});

const toValidation = (row) => {
    const extraction = parseJson(row.extraction) || {};
    return {
        requestId: row.requestId,
        attachmentId: row.attachmentId,
        validatedAt: toMs(row.createdAt),
        validatedBy: row.createdBy,
        success: row.success,
        confidence: Number(row.confidence),
        qualityScore: row.qualityScore,
        similarity: Number(row.similarity),
        redFlagCount: (extraction.redFlags || []).length,
        extraction
    };
};

// Ids of attachments that still exist (no file contents loaded)
const existingAttachmentIds = async (where) => {
    const rows = await entities.genai_claim_attachment.find({ select: ['id'], where });
    return new Set(rows.map(r => String(r.id).toUpperCase()));
};
const belongsToExisting = (ids) => (row) => row.attachmentId && ids.has(String(row.attachmentId).toUpperCase());

const claimNo = req.query?.claimNo;

if (claimNo) {
    const claim = await entities.genai_claim.findOne({ where: { claimNo } });
    if (!claim) {
        result.statusCode = 404;
        result.data = { error: `Claim ${claimNo} not found` };
        return complete();
    }
    const ids = await existingAttachmentIds({ claimNo });
    const rows = await entities.genai_invoice_result.find({ where: { claimNo }, order: { createdAt: 'DESC' } });
    result.data = { claim: toClaim(claim), validations: rows.filter(belongsToExisting(ids)).map(toValidation) };
    return complete();
}

const claims = await entities.genai_claim.find({ order: { claimNo: 'ASC' } });
const ids = await existingAttachmentIds({});
const results = await entities.genai_invoice_result.find({ order: { createdAt: 'DESC' } });

// Latest validation per claim (results are newest first)
const latest = {};
for (const row of results.filter(belongsToExisting(ids))) {
    if (row.claimNo && !latest[row.claimNo]) latest[row.claimNo] = toValidation(row);
}

result.data = {
    claims: claims.map(c => {
        const v = latest[c.claimNo];
        return {
            ...toClaim(c),
            lastValidation: v ? {
                validatedAt: v.validatedAt,
                similarity: v.similarity,
                redFlagCount: v.redFlagCount,
                vendor: v.extraction.vendor
            } : null
        };
    })
};
complete();
