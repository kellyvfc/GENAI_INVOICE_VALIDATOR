const { metadata, globals, outputs } = p9.processFlow.getData();

// Extract base64 PDF data and convert to buffer
const dataUrl = globals.image;
const base64Data = dataUrl.replace(/^data:application\/pdf;base64,/,'');
const buffer = Buffer.from(base64Data, 'base64');

//Pass through claim data and original base64
const claimData =  globals.claimData || {};

result.data = {
    json: {
        claimData,
        pdfBase64: base64Data
    },
    binary: {
        data: {
            data: buffer.toString('base64'),
            //data: buffer, // Pasa el Buffer directamente si requiere binario real
            mimeType: 'application/pdf',
            fileName: 'invoice.pdf'
        }
    }
}