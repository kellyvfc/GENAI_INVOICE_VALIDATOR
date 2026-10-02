// API: start genai_invoice_extraction_flow_withoutAgentNode
// Body: { image, mediaType, claimNo, claimData }  (same shape as the test-data files)

const FLOW_ID = 'C2BB34C0-D0BC-F111-A6A9-7C1E52210563'; // genai_invoice_extraction_flow_withoutAgentNode

const POLL_INTERVAL_MS = 2000;
const TIMEOUT_MS = 90000;

const body = req.body || {};
const { image, claimNo, claimData } = body;

// --- Validate input ---
const errors = [];
if (!image || typeof image !== 'string') {
    errors.push('image is required (data URI, e.g. data:image/png;base64,...)');
} else if (!/^data:(image\/\w+|application\/pdf);base64,/.test(image)) {
    errors.push('image must be a base64 data URI of an image or a PDF');
}
if (claimData && typeof claimData !== 'object') {
    errors.push('claimData must be an object');
}

if (errors.length) {
    result.statusCode = 400;
    result.data = { success: false, errors };
    return complete();
}

// Derive mediaType from the data URI if the caller didn't send it
const mediaType = body.mediaType || image.match(/^data:([^;]+);base64,/)[1];
const requestId = crypto.randomUUID();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Start the process flow ---
try {
    const flowRun = await p9.processFlow.run(FLOW_ID, {
        interfaceData: {
            image,
            mediaType,
            claimNo: claimNo || claimData?.claimNo || '',
            claimData: claimData || {}
        }
    });

    log.info(`Invoice extraction started: requestId=${requestId} executionId=${flowRun.executionId}`);

    // --- Wait for the flow to save its result ---
    let row = null;
    const deadline = Date.now() + TIMEOUT_MS;
    while (!row && Date.now() < deadline) {
        await sleep(POLL_INTERVAL_MS);
        row = await entities.genai_invoice_result.findOne({ where: { requestId } });
    }

    if (row) {
        result.statusCode = 200;
        result.data = {
            status: 'done',
            requestId,
            executionId: flowRun.executionId,
            success: row.success,
            flowType: row.flowType,
            confidence: Number(row.confidence),
            qualityScore: row.qualityScore,
            similarity: Number(row.similarity),
            extraction: typeof row.extraction === 'string' ? JSON.parse(row.extraction) : row.extraction
        };
    } else {
        // Still running: the app can check later via the table API with this requestId
        result.statusCode = 202;
        result.data = { status: 'running', requestId, executionId: flowRun.executionId };
    }


} catch (e) {
    log.error('Failed to start invoice extraction flow:', e.message);

    result.statusCode = e.name === 'NoAccessError' ? 403 : 500;
    result.data = { success: false, error: e.message };
}

complete();