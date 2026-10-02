//Prepare Image request
const { metadata, globals, outputs } = p9.processFlow.getData();

const { image, claimNo, claimData } = globals;

const currency =  claimData?.currency || '';
const causalPart =  claimData?.causalPart || '';
const troubleCode =  claimData?.troubleCode || '';
const faultDescription = claimData?.faultDescription || '';
const defectCode = claimData?.defectCode || '';
const vin = claimData?.vin || '';
const today = new Date().toISOString().split('T')[0];

let base64Only = image.replace(/^data:image\/\w+;base64,/, '');
let mediaType = 'image/jpeg';
const dataUriMatch = image.match(/^data:(image\/\w+);base64,/);
if (dataUriMatch) {
    mediaType = dataUriMatch[1];
}

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

Extract invoice data from the attached image.`;

result.data = {
    userPrompt: userContent,
    content:
    {
        type: 'image',
        source: {
            type: 'base64',
            media_type: mediaType,
            data: base64Only
        }

    }
}

// return {
//     json: {
//         contentType: 'image',
//         apiPayload: {
//             model: 'claude-sonnet-4-5-20250929',
//             max_tokens: 2048,
//             system: systemPrompt,
//             messages: [
//                 {
//                     role: 'user',
//                     content: [
//                         {
//                             type: 'image',
//                             source: {
//                                 type: 'base64',
//                                 media_type: mediaType,
//                                 data: base64Only
//                             }
//                         },
//                         {
//                             type: 'text',
//                             text: userContent
//                         }
//                     ]
//                 }
//             ]
//         }
//     }
// };