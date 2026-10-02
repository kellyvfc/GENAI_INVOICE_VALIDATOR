// API: GET /attachments/validations?id=XXX
// Returns: { validations: [ { requestId, validatedAt, validatedBy, success, confidence, qualityScore, similarity, redFlagCount, extraction } ] }  newest first

const id = req.query?.id;
if (typeof id !== 'string' || !id) {
    result.statusCode = 400;
    result.data = { error: 'id is required' };
    return complete();
}

const parseJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

const rows = await entities.genai_invoice_result.find({ where: { attachmentId: id }, order: { createdAt: 'DESC' } });

result.data = {
    validations: rows.map(r => {
        const extraction = parseJson(r.extraction) || {};
        return {
            requestId: r.requestId,
            validatedAt: Number(r.createdAt),
            validatedBy: r.createdBy,
            success: r.success,
            confidence: Number(r.confidence),
            qualityScore: r.qualityScore,
            similarity: Number(r.similarity),
            redFlagCount: (extraction.redFlags || []).length,
            extraction
        };
    })
};
complete();
