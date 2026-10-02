//Prepare PDF request (scanned PDF, no extractable text)
const { metadata, globals, outputs } = p9.processFlow.getData();

const decoded = outputs.Activity_9s1fv5v.json;   // Decode PDF output
const claimData = decoded.claimData || globals.claimData || {};
const pdfBase64 = decoded.pdfBase64;

const claimNo = globals.claimNo || claimData.claimNo || '';
const vin = claimData.vin || '';
const currency = claimData.currency || 'AUD';
const causalPart = claimData.causalPartDescription || claimData.causalPart || '';
const faultDescription = claimData.complaint || claimData.faultDescription || '';
const defectCode = claimData.defectCode || '';
const troubleCode = claimData.troubleCode || '';
const today = new Date().toISOString().split('T')[0];

const userContent = `Today's date: ${today}
Claim context:
Claim Number: ${claimNo || 'Not provided'}
VIN: ${vin || 'Not provided'}
Expected Currency: ${currency}
Causal Part: ${causalPart || 'Not provided'}
Fault/Complaint: ${faultDescription || 'Not provided'}
Defect Code: ${defectCode || 'Not provided'}
Trouble Code: ${troubleCode || 'Not provided'}

IMPORTANT: Compare the invoice line items against the Causal Part and Fault/Complaint to determine similarity. If the invoice is for unrelated services/parts, similarity must be very low (0.0-0.1).

Extract invoice data from the attached PDF document.`;

result.data = {
    userPrompt: userContent,
    content:
    {
        type: 'document',
        source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: pdfBase64
        }
    }
}