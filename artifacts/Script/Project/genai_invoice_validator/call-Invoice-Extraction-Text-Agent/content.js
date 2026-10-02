// Call the text agent with the prompt built by PrepareTextRequest
const { globals, outputs } = p9.processFlow.getData();

const { userPrompt } = outputs.Activity_8oe0nde;   // PrepareTextRequest output

const response = await agents.genai_invoiceExtractionText({
    input: userPrompt
});

log.info('Text agent response:', response);

// The agent uses a JSON schema, so the answer is its structured output
const raw = response?.output ?? response?.text ?? response;
result.data = raw?.structuredOutput;

// requestId for the Table Interaction: the run's own, or a new one (designer tests don't send one)
result.data.requestId = globals.requestId || crypto.randomUUID();
