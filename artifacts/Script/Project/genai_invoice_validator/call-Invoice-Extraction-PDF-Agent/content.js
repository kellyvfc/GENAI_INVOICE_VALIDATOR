// Call the PDF agent with the scanned PDF attached as a real file
const { globals, outputs } = p9.processFlow.getData();

const { userPrompt, content } = outputs.Activity_46mdqal;   // PreparePDFRequest output

const response = await agents.genai_invoiceExtractionPDF({
    input: userPrompt,
    files: [{
        mimetype: 'application/pdf',
        data: Buffer.from(content.source.data, 'base64')
    }]
});

log.info('PDF agent response:', response);

// The agent uses a JSON schema, so the answer is its structured output
const raw = response?.output ?? response?.text ?? response;
result.data = raw?.structuredOutput;

// requestId for the Table Interaction: the run's own, or a new one (designer tests don't send one)
result.data.requestId = globals.requestId || crypto.randomUUID();
