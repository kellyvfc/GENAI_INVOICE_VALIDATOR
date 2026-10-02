// API: DELETE /attachments?id=XXX
// Only the user who uploaded the attachment can delete it.
// Also deletes the attachment's validation results and requests.
// Returns: { deleted: true, id }

const id = req.query?.id;
if (typeof id !== 'string' || !id) {
    result.statusCode = 400;
    result.data = { error: 'id is required' };
    return complete();
}

const attachment = await entities.genai_claim_attachment.findOne({
    select: ['id', 'claimNo', 'fileName', 'createdBy'],
    where: { id }
});
if (!attachment) {
    result.statusCode = 404;
    result.data = { error: 'Attachment not found' };
    return complete();
}

const currentUser = req.user?.username;
if (!currentUser || attachment.createdBy !== currentUser) {
    result.statusCode = 403;
    result.data = { error: 'Only the user who uploaded this attachment can delete it' };
    return complete();
}

const running = await entities.genai_invoice_request.findOne({ where: { attachmentId: id, status: 'processing' } });
if (running) {
    result.statusCode = 409;
    result.data = { error: 'This attachment is being validated right now. Try again when it has finished.' };
    return complete();
}

await entities.genai_invoice_result.delete({ attachmentId: id });
await entities.genai_invoice_request.delete({ attachmentId: id });
await entities.genai_claim_attachment.delete({ id });

log.info(`Attachment deleted: ${id} (${attachment.fileName}), claim ${attachment.claimNo}, by ${currentUser}`);
result.data = { deleted: true, id };
complete();
