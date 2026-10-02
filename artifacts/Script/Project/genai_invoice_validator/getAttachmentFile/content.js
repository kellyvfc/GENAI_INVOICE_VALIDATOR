// API: GET /attachments/file?id=XXX
// Returns: { id, fileName, mediaType, file }   file = data URI

const id = req.query?.id;
if (typeof id !== 'string' || !id) {
    result.statusCode = 400;
    result.data = { error: 'id is required' };
    return complete();
}

const attachment = await entities.genai_claim_attachment.findOne({ where: { id } });
if (!attachment) {
    result.statusCode = 404;
    result.data = { error: 'Attachment not found' };
    return complete();
}

result.data = {
    id: attachment.id,
    fileName: attachment.fileName,
    mediaType: attachment.mediaType,
    file: `data:${attachment.mediaType};base64,${attachment.fileData}`
};
complete();
