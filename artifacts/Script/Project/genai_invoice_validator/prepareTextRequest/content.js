//Prepare Image request
const { metadata, globals, outputs } = p9.processFlow.getData();

const { image, claimNo } = globals;

const decoded = outputs.Activity_9s1fv5v.json;   // Decode PDF output
const extracted = outputs.Activity_zbqdr5i.json; // Extract PDF Text

const claimData = decoded.claimData;
const extractedText = extracted.extractedText;

const currency = claimData?.currency || '';
const causalPart = claimData?.causalPart || '';
const troubleCode = claimData?.troubleCode || '';
const faultDescription = claimData?.faultDescription || '';
const defectCode = claimData?.defectCode || '';
const vin = claimData?.vin || '';
const today = new Date().toISOString().split('T')[0];

const userContent = `Invoice text content to analyse
${extractedText}

Today's date: ${today}

Claim context:
Claim Number: ${claimNo || 'Not provided'}
VIN: ${vin || 'Not provided'}
Expected Currency: ${currency}
Causal Part: ${causalPart || 'Not provided'}
Fault/Complaint: ${faultDescription || 'Not provided'}
Defect Code: ${defectCode || 'Not provided'}
Trouble Code: ${troubleCode || 'Not provided'}

IMPORTANT: Compare the invoice line items against the Causal Part and Fault/Complaint to determine similarity. If the invoice is for unrelated services/parts, similarity must be very low (0.0-0.1).
`;

result.data = {
    userPrompt: userContent,
    content:
    {
        type: 'text',
        text: userContent
    }
}
