// GlobalFunctions for genai_claim_invoice_validator

function getInfoLabelScheme(type, value) {
    if (type === 'status') {
        if (value === 'Approved') return 8;
        if (value === 'In review') return 1;
        if (value === 'Rejected') return 3;
        return 6;
    }
    if (type === 'similarity') {
        if (value == null) return 10;
        if (value >= 0.7) return 8;
        if (value >= 0.3) return 1;
        return 3;
    }
    if (type === 'confidence') {
        if (value == null) return 10;
        var v = value <= 1 ? value * 100 : value;
        if (v >= 80) return 8;
        if (v >= 50) return 1;
        return 3;
    }
    if (type === 'quality') {
        if (value == null) return 10;
        var q = value <= 1 ? value * 100 : value;
        if (q >= 80) return 8;
        if (q >= 50) return 1;
        return 3;
    }
    if (type === 'redFlags') {
        return value > 0 ? 3 : 8;
    }
    return 10;
}

function formatClaimItem(claim) {
    if (!claim) return;

    claim.statusColorScheme = getInfoLabelScheme('status', claim.status);

    var lv = claim.lastValidation;
    if (lv && lv.similarity != null) {
        var sim = lv.similarity;
        var simPct = Math.round(sim * 100);
        claim.similarityInfoText = simPct + ' % match';
        claim.similarityInfoIcon = 'sap-icon://accept';
        claim.similarityColorScheme = getInfoLabelScheme('similarity', sim);

        var rfCount = lv.redFlagCount != null ? lv.redFlagCount : (lv.extraction && lv.extraction.redFlags ? lv.extraction.redFlags.length : 0);
        if (rfCount > 0) {
            claim.hasRedFlags = true;
            claim.redFlagsInfoText = rfCount + ' red flag' + (rfCount > 1 ? 's' : '');
            claim.redFlagsColorScheme = getInfoLabelScheme('redFlags', rfCount);
        } else {
            claim.hasRedFlags = false;
            claim.redFlagsInfoText = 'No red flags';
            claim.redFlagsColorScheme = getInfoLabelScheme('redFlags', 0);
        }
    } else {
        claim.similarityInfoText = 'Not validated';
        claim.similarityInfoIcon = '';
        claim.similarityColorScheme = getInfoLabelScheme('similarity', null);
        claim.hasRedFlags = false;
        claim.redFlagsInfoText = '';
        claim.redFlagsColorScheme = 10;
    }
}

function getDefaultClaims() {
    return [
        {
            claimNo: "CLM-2025-001",
            claimDate: "2025-02-15",
            status: "Submitted",
            statusState: "Information",
            vehicle: "2023 Toyota Hilux 2.8D",
            vehicleMake: "Toyota",
            vehicleModel: "Hilux 2.8D",
            vin: "MR0HA3CD501234567",
            customer: "Metro Transport Fleet",
            customerName: "Metro Transport Fleet",
            dealer: "Sydney Toyota Service",
            dealerName: "Sydney Toyota Service",
            causalPart: "Turbocharger Assembly",
            defectCode: "TB-8841-FAIL",
            amount: 2850.00,
            claimAmount: 2850.00,
            currency: "AUD",
            amountFormatted: "$2,850.00",
            lastValidation: { similarity: 0.94, redFlagCount: 0 }
        },
        {
            claimNo: "CLM-2025-002",
            claimDate: "2025-02-14",
            status: "In review",
            statusState: "Warning",
            vehicle: "2022 Ford Ranger 3.2",
            vehicleMake: "Ford",
            vehicleModel: "Ranger 3.2",
            vin: "MNBXXG4D309876543",
            customer: "Apex Logistics Pty Ltd",
            customerName: "Apex Logistics Pty Ltd",
            dealer: "Melbourne Ford Center",
            dealerName: "Melbourne Ford Center",
            causalPart: "Fuel Injection Pump",
            defectCode: "FP-1022-LEAK",
            amount: 1980.50,
            claimAmount: 1980.50,
            currency: "AUD",
            amountFormatted: "$1,980.50",
            lastValidation: { similarity: 0.65, redFlagCount: 2 }
        },
        {
            claimNo: "CLM-2025-003",
            claimDate: "2025-02-12",
            status: "Approved",
            statusState: "Success",
            vehicle: "2024 Isuzu D-Max 3.0",
            vehicleMake: "Isuzu",
            vehicleModel: "D-Max 3.0",
            vin: "MPAT883D905432109",
            customer: "Outback Equipment Hire",
            customerName: "Outback Equipment Hire",
            dealer: "Brisbane Isuzu Service",
            dealerName: "Brisbane Isuzu Service",
            causalPart: "Automatic Transmission Valve Body",
            defectCode: "AT-3390-SLIP",
            amount: 4120.00,
            claimAmount: 4120.00,
            currency: "AUD",
            amountFormatted: "$4,120.00",
            lastValidation: { similarity: 0.98, redFlagCount: 0 }
        },
        {
            claimNo: "CLM-2025-004",
            claimDate: "2025-02-10",
            status: "Rejected",
            statusState: "Error",
            vehicle: "2021 Mitsubishi Triton 2.4",
            vehicleMake: "Mitsubishi",
            vehicleModel: "Triton 2.4",
            vin: "MMA39281093847561",
            customer: "Coastal Civil Contractors",
            customerName: "Coastal Civil Contractors",
            dealer: "Perth Mitsubishi Motors",
            dealerName: "Perth Mitsubishi Motors",
            causalPart: "EGR Valve & Cooler",
            defectCode: "EGR-7721-CLOG",
            amount: 1450.00,
            claimAmount: 1450.00,
            currency: "AUD",
            amountFormatted: "$1,450.00",
            lastValidation: { similarity: 0.22, redFlagCount: 4 }
        }
    ];
}

function initFilterBarLayout() {
    if (sfClaimsSearch && sfClaimsSearch.setLayoutData) {
        sfClaimsSearch.setLayoutData(new sap.m.FlexItemData({
            growFactor: 1,
            maxWidth: '28rem'
        }));
    }
    if (sbStatusFilter && sbStatusFilter.setLayoutData) {
        sbStatusFilter.setLayoutData(new sap.m.FlexItemData({
            shrinkFactor: 0
        }));
    }
}

function initApp() {
    sap.ui.getCore().setModel(modelClaims, 'Claims');
    sap.ui.getCore().setModel(modelDetail, 'Detail');
    initFilterBarLayout();
    bindFileInputListener();
    loadClaimsList();
}

function bindFileInputListener() {
    var input = document.getElementById('fileInputAttachment');
    if (input && !input._hasListener) {
        input._hasListener = true;
        input.addEventListener('change', function(e) {
            if (e.target.files && e.target.files.length > 0) {
                uploadSelectedAttachment(e.target.files[0]);
            }
        });
    }
}

function loadClaimsList() {
    if (tabClaims && tabClaims.setBusy) {
        tabClaims.setBusy(true);
    }
    apigetClaims({ parameters: {} });
}

function updateSegmentedButtonCounts(claims) {
    if (!claims) claims = [];

    var total = claims.length;
    var submitted = 0, inReview = 0, approved = 0, rejected = 0;

    claims.forEach(function(c) {
        var st = c.status || '';
        if (st === 'Submitted') submitted++;
        else if (st === 'In review') inReview++;
        else if (st === 'Approved') approved++;
        else if (st === 'Rejected') rejected++;
    });

    if (sbiAll) sbiAll.setText('All (' + total + ')');
    if (sbiSubmitted) sbiSubmitted.setText('Submitted (' + submitted + ')');
    if (sbiInReview) sbiInReview.setText('In review (' + inReview + ')');
    if (sbiApproved) sbiApproved.setText('Approved (' + approved + ')');
    if (sbiRejected) sbiRejected.setText('Rejected (' + rejected + ')');
}

function onGetClaimsSuccess(xhr) {
    if (tabClaims && tabClaims.setBusy) {
        tabClaims.setBusy(false);
    }

    var response = xhr ? xhr.responseJSON : null;
    var claims = [];

    if (response) {
        if (response.claim) {
            onGetClaimDetailSuccess(response);
            return;
        } else if (Array.isArray(response.claims)) {
            claims = response.claims;
        } else if (Array.isArray(response)) {
            claims = response;
        } else if (response.result && Array.isArray(response.result)) {
            claims = response.result;
        } else if (response.data && Array.isArray(response.data)) {
            claims = response.data;
        }
    }

    if (!claims || claims.length === 0) {
        claims = getDefaultClaims();
    }

    claims.forEach(function(c) {
        formatClaimItem(c);
    });

    if (modelClaims) {
        modelClaims.setData({ claims: claims });
    }

    updateSegmentedButtonCounts(claims);
    filterClaims();
}

function onGetClaimsError(xhr) {
    if (tabClaims && tabClaims.setBusy) {
        tabClaims.setBusy(false);
    }

    var claims = getDefaultClaims();
    claims.forEach(function(c) {
        formatClaimItem(c);
    });

    if (modelClaims) {
        modelClaims.setData({ claims: claims });
    }

    updateSegmentedButtonCounts(claims);
    filterClaims();
}

function onSearchClaims(oEvent) {
    filterClaims();
}

function onFilterStatusChange(oEvent) {
    filterClaims();
}

function filterClaims() {
    var Filter = sap.ui.model.Filter, FilterOperator = sap.ui.model.FilterOperator;
    var filters = [];
    var status = sbStatusFilter ? sbStatusFilter.getSelectedKey() : 'All';
    if (status && status !== 'All') {
        filters.push(new Filter('status', FilterOperator.EQ, status));
    }
    var query = (sfClaimsSearch && sfClaimsSearch.getValue ? sfClaimsSearch.getValue() : '').trim();
    if (query) {
        filters.push(new Filter({
            filters: ['claimNo', 'customerName', 'dealerName', 'vin', 'vehicleMake',
                      'vehicleModel', 'causalPart', 'defectCode']
                .map(function (f) { return new Filter(f, FilterOperator.Contains, query); }),
            and: false
        }));
    }

    if (tabClaims) {
        var binding = tabClaims.getBinding('items');
        if (binding) {
            binding.filter(filters.length ? new Filter({ filters: filters, and: true }) : [], 'Application');
        }
    }
}

function onClaimPress(oEvent) {
    var oItem = oEvent.getParameter('listItem') || oEvent.getSource();
    if (!oItem) return;
    var ctx = oItem.getBindingContext('Claims');
    if (!ctx) return;
    var claim = ctx.getObject();
    if (claim && claim.claimNo) {
        loadClaimDetail(claim.claimNo);
    }
}

function loadClaimDetail(claimNo) {
    var claims = (modelClaims && modelClaims.getData()) ? (modelClaims.getData().claims || []) : getDefaultClaims();
    var match = claims.find(function(c) { return c.claimNo === claimNo; });
    if (match) {
        onGetClaimDetailSuccess({ claim: match });
    }
    apigetClaims({
        parameters: { claimNo: claimNo }
    });
}

function updateHeaderLastValidation() {
    var detailData = modelDetail.getData() || {};

    if (detailData.claim) {
        detailData.claimStatusText = detailData.claim.status || 'Submitted';
        detailData.claimStatusScheme = getInfoLabelScheme('status', detailData.claim.status);

        var rawAmt = detailData.claim.claimAmount != null ? detailData.claim.claimAmount : (detailData.claim.amount != null ? detailData.claim.amount : 0);
        var amt = typeof rawAmt === 'number' ? rawAmt : parseFloat(rawAmt) || 0;
        detailData.claimAmountValue = amt.toFixed(2);
        detailData.claimAmountCurrency = detailData.claim.currency || 'AUD';
    }

    var attachments = detailData.attachments || [];
    var validatedAtts = attachments.filter(function(a) {
        return a.lastValidation && a.lastValidation.validatedAt;
    });

    validatedAtts.sort(function(a, b) {
        return new Date(b.lastValidation.validatedAt) - new Date(a.lastValidation.validatedAt);
    });

    if (validatedAtts.length > 0) {
        var newest = validatedAtts[0];
        var bestVal = newest.lastValidation;
        var sim = bestVal.similarity != null ? bestVal.similarity : 0;
        var simPct = Math.round(sim * 100);

        detailData.lastValSimText = simPct + ' % match';
        detailData.lastValSimIcon = 'sap-icon://accept';
        detailData.lastValSimScheme = getInfoLabelScheme('similarity', sim);

        var rfCount = bestVal.redFlagCount != null ? bestVal.redFlagCount : (bestVal.extraction && bestVal.extraction.redFlags ? bestVal.extraction.redFlags.length : 0);
        if (rfCount > 0) {
            detailData.hasLastValRedFlags = true;
            detailData.lastValRedFlagsText = rfCount + ' red flag' + (rfCount > 1 ? 's' : '');
            detailData.lastValRedFlagsScheme = getInfoLabelScheme('redFlags', rfCount);
        } else {
            detailData.hasLastValRedFlags = true;
            detailData.lastValRedFlagsText = 'No red flags';
            detailData.lastValRedFlagsScheme = getInfoLabelScheme('redFlags', 0);
        }
    } else {
        detailData.lastValSimText = 'Not validated';
        detailData.lastValSimIcon = '';
        detailData.lastValSimScheme = getInfoLabelScheme('similarity', null);
        detailData.hasLastValRedFlags = false;
        detailData.lastValRedFlagsText = '';
        detailData.lastValRedFlagsScheme = 10;
    }

    modelDetail.refresh(true);
}

function onGetClaimDetailSuccess(response) {
    var claim = response.claim;
    if (!claim) return;

    var detailObj = {
        claim: claim,
        attachments: [],
        selectedAttachment: null,
        attachmentValidations: []
    };

    modelDetail.setData(detailObj);
    updateHeaderLastValidation();

    if (pageClaimDetail) {
        App.to(pageClaimDetail);
    }

    loadAttachments(claim.claimNo);
}

function loadAttachments(claimNo) {
    if (!claimNo) return;
    apigetAttachments({
        parameters: { claimNo: claimNo }
    });
}

function formatAttachmentRow(att) {
    if (!att) return;

    att.running = !!att.running;
    att.runningStepText = att.runningStepText || '';
    att.isNotRunning = !att.running;
    att.isValidated = !att.running && !!att.lastValidation;
    att.isNotValidated = !att.running && !att.lastValidation;
    att.canDelete = att.canDelete !== false;

    var parts = [];
    var sz = att.sizeBytes || att.size;
    if (sz) {
        if (sz > 1024 * 1024) parts.push((sz / (1024 * 1024)).toFixed(1) + ' MB');
        else if (sz > 1024) parts.push(Math.round(sz / 1024) + ' KB');
        else parts.push(sz + ' B');
    } else if (att.fileSizeFormatted) {
        parts.push(att.fileSizeFormatted);
    }
    var dt = att.uploadedAt ? new Date(att.uploadedAt).toLocaleDateString() : (att.createdAt ? new Date(att.createdAt).toLocaleDateString() : '');
    if (dt) parts.push(dt);
    if (att.uploadedBy) parts.push('By ' + att.uploadedBy);
    att.metaText = parts.join(' • ') || 'No file details';

    if (att.lastValidation) {
        var sim = att.lastValidation.similarity != null ? att.lastValidation.similarity : 0;
        var simPct = Math.round(sim * 100);
        att.similarityInfoText = simPct + ' % match';
        att.similarityInfoIcon = 'sap-icon://accept';
        att.similarityColorScheme = getInfoLabelScheme('similarity', sim);

        var rfCount = att.lastValidation.redFlagCount != null ? att.lastValidation.redFlagCount : (att.lastValidation.extraction && att.lastValidation.extraction.redFlags ? att.lastValidation.extraction.redFlags.length : 0);
        att.redFlagCount = rfCount;
        if (rfCount > 0) {
            att.redFlagsInfoText = rfCount + ' red flag' + (rfCount > 1 ? 's' : '');
            att.redFlagsColorScheme = getInfoLabelScheme('redFlags', rfCount);
        } else {
            att.redFlagsInfoText = 'No red flags';
            att.redFlagsColorScheme = getInfoLabelScheme('redFlags', 0);
        }
    } else {
        att.similarityInfoText = 'Not validated';
        att.similarityInfoIcon = '';
        att.similarityColorScheme = getInfoLabelScheme('similarity', null);
        att.redFlagsInfoText = '';
        att.redFlagsColorScheme = 10;
    }
}

function onGetAttachmentsSuccess(xhr) {
    var response = xhr ? xhr.responseJSON : null;
    var attachments = (response && response.attachments) ? response.attachments : [];

    attachments.forEach(function(att) {
        formatAttachmentRow(att);
    });

    var current = modelDetail.getData() || {};
    current.attachments = attachments;
    modelDetail.setData(current);

    bindFileInputListener();
    updateHeaderLastValidation();
}

function onGetAttachmentsError(xhr) {
    var errorMsg = 'Failed to load attachments.';
    if (xhr && xhr.responseJSON) {
        errorMsg = xhr.responseJSON.message || xhr.responseJSON.error || errorMsg;
    }
    sap.m.MessageToast.show(errorMsg);
}

function onTriggerAttachmentUpload() {
    bindFileInputListener();
    var input = document.getElementById('fileInputAttachment');
    if (input) {
        input.click();
    } else {
        sap.m.MessageToast.show('Upload input not available.');
    }
}

function uploadSelectedAttachment(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
        sap.m.MessageBox.error('File size exceeds maximum allowed limit of 10 MB.');
        return;
    }

    var detailData = modelDetail.getData();
    var claimNo = (detailData && detailData.claim) ? detailData.claim.claimNo : '';
    if (!claimNo) {
        sap.m.MessageToast.show('No active claim found.');
        return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
        var dataUri = e.target.result;
        apipostAttachments({
            data: {
                claimNo: claimNo,
                fileName: file.name,
                file: dataUri
            }
        });
    };
    reader.onerror = function() {
        sap.m.MessageToast.show('Failed to read attachment file.');
    };
    reader.readAsDataURL(file);
}

function onPostAttachmentsSuccess(xhr) {
    sap.m.MessageToast.show('Attachment uploaded successfully!');

    var input = document.getElementById('fileInputAttachment');
    if (input) input.value = '';

    var detailData = modelDetail.getData() || {};
    var claimNo = (detailData.claim) ? detailData.claim.claimNo : '';
    if (claimNo) {
        loadAttachments(claimNo);
    }
}

function onPostAttachmentsError(xhr) {
    var errorMsg = 'Failed to upload attachment.';
    if (xhr && xhr.responseJSON) {
        if (xhr.responseJSON.message) errorMsg = xhr.responseJSON.message;
        else if (xhr.responseJSON.error) {
            errorMsg = typeof xhr.responseJSON.error === 'string' ? xhr.responseJSON.error : (xhr.responseJSON.error.message || errorMsg);
        }
    }
    sap.m.MessageBox.error(errorMsg);
}

function onValidateRow(oEvent) {
    if (oEvent && oEvent.stopPropagation) oEvent.stopPropagation();
    if (oEvent && oEvent.preventDefault) oEvent.preventDefault();

    var oSrc = oEvent.getSource();
    var ctx = oSrc ? oSrc.getBindingContext('Detail') : null;
    if (!ctx) return;
    var att = ctx.getObject();
    startAttachmentValidation(att);
}

function startAttachmentValidation(att) {
    if (!att || !att.id) return;

    att.running = true;
    att.runningStepText = 'Reading document…';
    formatAttachmentRow(att);
    modelDetail.checkUpdate(true);

    window._validatingAttMap = window._validatingAttMap || {};
    window._validatingAttMap[att.id] = att;

    apipreparePDF({
        data: {
            attachmentId: att.id
        }
    });
}

function onPreparePDFSuccess(xhr) {
    var response = xhr ? xhr.responseJSON : null;
    if (!response || !response.requestId) {
        onPreparePDFError(xhr);
        return;
    }

    var attId = response.attachmentId;
    var att = null;
    if (attId && window._validatingAttMap) {
        att = window._validatingAttMap[attId];
    }
    if (!att) {
        var detailData = modelDetail.getData() || {};
        var atts = detailData.attachments || [];
        att = atts.find(function(a) { return a.running; });
    }

    if (att) {
        att.runningStepText = 'Analysing with AI…';
        modelDetail.checkUpdate(true);
        window._requestIdToAttMap = window._requestIdToAttMap || {};
        window._requestIdToAttMap[response.requestId] = att;
    }

    apipostExtractData({
        data: {
            requestId: response.requestId
        }
    });
}

function onPreparePDFError(xhr) {
    var errorMsg = 'Failed to prepare document.';
    if (xhr && xhr.responseJSON) {
        if (xhr.responseJSON.message) errorMsg = xhr.responseJSON.message;
        else if (xhr.responseJSON.error) {
            errorMsg = typeof xhr.responseJSON.error === 'string' ? xhr.responseJSON.error : (xhr.responseJSON.error.message || errorMsg);
        }
    }

    var detailData = modelDetail.getData() || {};
    var atts = detailData.attachments || [];
    atts.forEach(function(a) {
        if (a.running) {
            a.running = false;
            formatAttachmentRow(a);
        }
    });
    modelDetail.checkUpdate(true);

    sap.m.MessageBox.error(errorMsg);
}

function onExtractDataSuccess(xhr) {
    var response = xhr ? xhr.responseJSON : null;
    if (!response) {
        onExtractDataError(xhr);
        return;
    }

    var reqId = response.requestId;
    var att = null;
    if (reqId && window._requestIdToAttMap) {
        att = window._requestIdToAttMap[reqId];
    }
    if (!att) {
        var detailData = modelDetail.getData() || {};
        var atts = detailData.attachments || [];
        att = atts.find(function(a) { return a.running; });
    }

    if (att) {
        att.lastValidation = response;
        att.running = false;
        formatAttachmentRow(att);
        updateHeaderLastValidation();

        var simPct = att.lastValidation.similarity != null ? Math.round(att.lastValidation.similarity * 100) : 0;
        sap.m.MessageToast.show('Validated ' + (att.fileName || 'document') + ': ' + simPct + '%');
    } else {
        sap.m.MessageToast.show('Validation completed successfully!');
    }

    var currentData = modelDetail.getData() || {};
    var claimNo = (currentData.claim) ? currentData.claim.claimNo : '';
    if (claimNo) {
        loadAttachments(claimNo);
    }
}

function onExtractDataError(xhr) {
    var errorMsg = 'AI validation failed.';
    if (xhr && xhr.responseJSON) {
        if (xhr.responseJSON.message) errorMsg = xhr.responseJSON.message;
        else if (xhr.responseJSON.error) {
            errorMsg = typeof xhr.responseJSON.error === 'string' ? xhr.responseJSON.error : (xhr.responseJSON.error.message || errorMsg);
        }
    }

    var detailData = modelDetail.getData() || {};
    var atts = detailData.attachments || [];
    atts.forEach(function(a) {
        if (a.running) {
            a.running = false;
            formatAttachmentRow(a);
        }
    });
    modelDetail.checkUpdate(true);

    sap.m.MessageBox.error(errorMsg);
}

function onPreviewAttachmentRow(oEvent) {
    if (oEvent && oEvent.stopPropagation) oEvent.stopPropagation();
    if (oEvent && oEvent.preventDefault) oEvent.preventDefault();

    var oSrc = oEvent.getSource();
    var ctx = oSrc ? oSrc.getBindingContext('Detail') : null;
    if (!ctx) return;
    var att = ctx.getObject();
    previewAttachmentObject(att);
}

function previewAttachmentObject(att) {
    if (!att || !att.id) {
        sap.m.MessageToast.show('No attachment selected.');
        return;
    }

    var url = '/api/serverscript/genai_invoice_extraction_api/attachmentContent?id=' + encodeURIComponent(att.id);
    var fileName = att.fileName || 'Attachment Preview';
    var mediaType = (att.mediaType || '').toLowerCase();

    if (mediaType === 'application/pdf' || mediaType.indexOf('pdf') >= 0 || (att.fileName && att.fileName.toLowerCase().endsWith('.pdf'))) {
        var pdfViewer = new sap.m.PDFViewer({
            title: fileName,
            source: url,
            isTrustedSource: true,
            showDownloadButton: true
        });

        if (typeof pdfViewer.open === 'function') {
            pdfViewer.open();
        } else {
            var dlgPdf = new sap.m.Dialog({
                title: fileName,
                contentWidth: '85%',
                contentHeight: '85%',
                stretch: (sap.ui.Device && sap.ui.Device.system) ? sap.ui.Device.system.phone : false,
                content: [pdfViewer],
                endButton: new sap.m.Button({
                    text: 'Close',
                    press: function() {
                        dlgPdf.close();
                    }
                }),
                afterClose: function() {
                    dlgPdf.destroy();
                }
            });
            dlgPdf.open();
        }
    } else {
        var img = new sap.m.Image({
            src: url,
            width: '100%',
            densityAware: false
        });

        var dlgImg = new sap.m.Dialog({
            title: fileName,
            contentWidth: '80%',
            stretch: (sap.ui.Device && sap.ui.Device.system) ? sap.ui.Device.system.phone : false,
            content: [img],
            endButton: new sap.m.Button({
                text: 'Close',
                press: function() {
                    dlgImg.close();
                }
            }),
            afterClose: function() {
                dlgImg.destroy();
            }
        });

        dlgImg.open();
    }
}

function onDeleteAttachment(oEvent) {
    if (oEvent && oEvent.stopPropagation) oEvent.stopPropagation();
    if (oEvent && oEvent.preventDefault) oEvent.preventDefault();

    var oSrc = oEvent.getSource();
    var ctx = oSrc ? oSrc.getBindingContext('Detail') : null;
    if (!ctx) return;
    var att = ctx.getObject();
    if (!att || !att.id) return;

    sap.m.MessageBox.confirm('Delete ' + (att.fileName || 'attachment') + '? Its validation results will be deleted too.', {
        title: 'Delete Attachment',
        onClose: function(oAction) {
            if (oAction === 'OK' || oAction === sap.m.MessageBox.Action.OK) {
                apideleteAttachments({
                    parameters: { id: att.id }
                });
            }
        }
    });
}

function onDeleteAttachmentsSuccess(xhr) {
    sap.m.MessageToast.show('Attachment deleted.');
    var detailData = modelDetail.getData() || {};
    var claimNo = (detailData.claim) ? detailData.claim.claimNo : '';
    if (claimNo) {
        loadAttachments(claimNo);
    } else {
        updateHeaderLastValidation();
    }
}

function onDeleteAttachmentsError(xhr) {
    var errorMsg = 'Failed to delete attachment.';
    if (xhr && xhr.responseJSON) {
        if (xhr.responseJSON.message) errorMsg = xhr.responseJSON.message;
        else if (xhr.responseJSON.error) {
            errorMsg = typeof xhr.responseJSON.error === 'string' ? xhr.responseJSON.error : (xhr.responseJSON.error.message || errorMsg);
        }
    }
    sap.m.MessageBox.error(errorMsg);
}

function onSelectAttachmentRow(oEvent) {
    var oItem = oEvent.getParameter('listItem') || oEvent.getSource();
    if (!oItem) return;
    var ctx = oItem.getBindingContext('Detail');
    if (!ctx) return;
    var att = ctx.getObject();
    if (att) {
        openValidationDialog(att);
    }
}

function openValidationDialog(att) {
    if (!att) return;

    var isVal = !!att.lastValidation;
    var dlgContent = [];

    if (!isVal) {
        var vboxNotVal = new sap.m.VBox({
            alignItems: 'Center',
            justifyContent: 'Center'
        });
        vboxNotVal.addStyleClass('sapUiMediumMargin');

        var iconNotVal = new sap.ui.core.Icon({
            src: 'sap-icon://ai',
            size: '3rem',
            color: '#1b6ec2'
        });
        iconNotVal.addStyleClass('sapUiMediumMarginBottom');

        var titleNotVal = new sap.m.Title({
            text: 'Not Validated Yet',
            level: 'H3'
        });
        titleNotVal.addStyleClass('sapUiSmallMarginBottom');

        var textNotVal = new sap.m.Text({
            text: 'Run AI extraction and validation to compare this invoice against claim details.'
        });
        textNotVal.addStyleClass('sapUiMediumMarginBottom');

        var btnNotVal = new sap.m.Button({
            text: 'Validate Document',
            icon: 'sap-icon://ai',
            type: 'Emphasized',
            press: function() {
                if (window._activeValDialog) {
                    window._activeValDialog.close();
                }
                startAttachmentValidation(att);
            }
        });

        vboxNotVal.addItem(iconNotVal);
        vboxNotVal.addItem(titleNotVal);
        vboxNotVal.addItem(textNotVal);
        vboxNotVal.addItem(btnNotVal);

        dlgContent.push(vboxNotVal);
    } else {
        var vboxContainer = new sap.m.VBox({
            alignItems: 'Center',
            justifyContent: 'Center'
        });
        vboxContainer.addStyleClass('sapUiMediumMargin');

        var busy = new sap.m.BusyIndicator({ size: '32px' });
        busy.addStyleClass('sapUiSmallMarginBottom');
        var busyText = new sap.m.Text({ text: 'Loading full validation details…' });

        vboxContainer.addItem(busy);
        vboxContainer.addItem(busyText);

        window._activeValDialogContainer = vboxContainer;
        window._activeValDialogAtt = att;

        apigetAttachmentsValidations({
            parameters: { id: att.id }
        });

        dlgContent.push(vboxContainer);
    }

    var dlg = new sap.m.Dialog({
        title: att.fileName || 'Validation Result',
        contentWidth: '900px',
        stretch: (sap.ui.Device && sap.ui.Device.system) ? sap.ui.Device.system.phone : false,
        content: dlgContent,
        beginButton: new sap.m.Button({
            text: 'Preview',
            icon: 'sap-icon://show',
            press: function() {
                previewAttachmentObject(att);
            }
        }),
        endButton: new sap.m.Button({
            text: 'Close',
            press: function() {
                dlg.close();
            }
        }),
        afterClose: function() {
            window._activeValDialogContainer = null;
            window._activeValDialogAtt = null;
            window._activeValDialog = null;
            dlg.destroy();
        }
    });

    window._activeValDialog = dlg;
    dlg.open();
}

function renderFullValidationContent(validation, validationsList, container) {
    if (!container || !validation) return;
    container.removeAllItems();

    var extraction = validation.extraction || {};
    var simPct = validation.similarity != null ? Math.round(validation.similarity * 100) : 0;
    var confPct = validation.confidence != null ? Math.round(validation.confidence * 100) : 0;
    var qualScore = validation.qualityScore != null ? validation.qualityScore : 0;
    var redFlags = extraction.redFlags || [];
    var sim = validation.similarity != null ? validation.similarity : 0;

    var verdictType = 'Information';
    var verdictText = '';
    if (sim >= 0.7 && redFlags.length === 0) {
        verdictType = 'Success';
        verdictText = 'PASSED — High similarity (' + simPct + '%) with no red flags identified.';
    } else if (redFlags.length > 0) {
        verdictType = 'Warning';
        verdictText = 'REVIEW REQUIRED — Identified ' + redFlags.length + ' potential red flag(s) / discrepancies.';
    } else {
        verdictType = 'Error';
        verdictText = 'FAIL / MISMATCH — Low similarity (' + simPct + '%). Invoice details differ significantly from claim.';
    }

    var stripVerdict = new sap.m.MessageStrip({
        text: verdictText,
        type: verdictType,
        showIcon: true
    });
    stripVerdict.addStyleClass('sapUiSmallMarginBottom');

    // KPI Row
    var hboxKpis = new sap.m.HBox({
        wrap: 'Wrap',
        alignItems: 'Center'
    });
    hboxKpis.addStyleClass('sapUiSmallMarginBottom');

    // Similarity KPI
    var vboxSim = new sap.m.VBox();
    vboxSim.addStyleClass('genai_claim_invoice_validator_sapUiMediumMarginEnd');
    var lblSim = new sap.m.Label({ text: 'Claim similarity' });
    lblSim.addStyleClass('genai_claim_invoice_validator_fieldLabel');
    var infoSim = new sap.tnt.InfoLabel({
        displayOnly: false,
        text: simPct + ' % match',
        icon: 'sap-icon://accept',
        colorScheme: getInfoLabelScheme('similarity', sim)
    });
    vboxSim.addItem(lblSim);
    vboxSim.addItem(infoSim);

    // Confidence KPI
    var vboxConf = new sap.m.VBox();
    vboxConf.addStyleClass('genai_claim_invoice_validator_sapUiMediumMarginEnd');
    var lblConf = new sap.m.Label({ text: 'AI confidence' });
    lblConf.addStyleClass('genai_claim_invoice_validator_fieldLabel');
    var infoConf = new sap.tnt.InfoLabel({
        displayOnly: false,
        text: confPct + ' %',
        colorScheme: getInfoLabelScheme('confidence', validation.confidence != null ? validation.confidence : confPct)
    });
    vboxConf.addItem(lblConf);
    vboxConf.addItem(infoConf);

    // Quality KPI
    var vboxQual = new sap.m.VBox();
    vboxQual.addStyleClass('genai_claim_invoice_validator_sapUiMediumMarginEnd');
    var lblQual = new sap.m.Label({ text: 'Doc quality' });
    lblQual.addStyleClass('genai_claim_invoice_validator_fieldLabel');
    var infoQual = new sap.tnt.InfoLabel({
        displayOnly: false,
        text: qualScore + '/100',
        colorScheme: getInfoLabelScheme('quality', qualScore)
    });
    vboxQual.addItem(lblQual);
    vboxQual.addItem(infoQual);

    hboxKpis.addItem(vboxSim);
    hboxKpis.addItem(vboxConf);
    hboxKpis.addItem(vboxQual);

    // Facts Panel
    var pnlFacts = new sap.m.Panel({
        headerText: 'Extracted Invoice Facts',
        expandable: false
    });
    var vboxFacts = new sap.m.VBox();
    vboxFacts.addItem(new sap.m.HBox({
        justifyContent: 'SpaceBetween',
        items: [
            new sap.m.Label({ text: 'Vendor:' }),
            new sap.m.Text({ text: extraction.vendor || 'N/A' })
        ]
    }));
    vboxFacts.addItem(new sap.m.HBox({
        justifyContent: 'SpaceBetween',
        items: [
            new sap.m.Label({ text: 'Invoice No:' }),
            new sap.m.Text({ text: extraction.invoiceNumber || 'N/A' })
        ]
    }));
    vboxFacts.addItem(new sap.m.HBox({
        justifyContent: 'SpaceBetween',
        items: [
            new sap.m.Label({ text: 'Invoice Date:' }),
            new sap.m.Text({ text: extraction.date || 'N/A' })
        ]
    }));
    vboxFacts.addItem(new sap.m.HBox({
        justifyContent: 'SpaceBetween',
        items: [
            new sap.m.Label({ text: 'Subtotal & Tax:' }),
            new sap.m.Text({ text: (extraction.currency || '') + ' ' + (extraction.subtotal || 0) + ' (Tax: ' + (extraction.tax || 0) + ')' })
        ]
    }));
    vboxFacts.addItem(new sap.m.HBox({
        justifyContent: 'SpaceBetween',
        items: [
            new sap.m.Label({ text: 'Total Amount:' }),
            new sap.m.Text({ text: (extraction.currency || '') + ' ' + (extraction.total || 0) })
        ]
    }));
    vboxFacts.addItem(new sap.m.HBox({
        justifyContent: 'SpaceBetween',
        items: [
            new sap.m.Label({ text: 'VAT ID & Type:' }),
            new sap.m.Text({ text: 'VAT ID: ' + (extraction.vatId || extraction.abn || 'N/A') + ' (' + (extraction.documentType || 'Invoice') + ')' })
        ]
    }));
    pnlFacts.addContent(vboxFacts);

    // Line Items Table
    var tabLineItems = new sap.m.Table({
        headerText: 'Line Items',
        columns: [
            new sap.m.Column({ header: new sap.m.Text({ text: 'Description' }) }),
            new sap.m.Column({ header: new sap.m.Text({ text: 'Qty' }) }),
            new sap.m.Column({ header: new sap.m.Text({ text: 'Unit Price' }) }),
            new sap.m.Column({ header: new sap.m.Text({ text: 'Amount' }) })
        ]
    });
    var lineItems = extraction.lineItems || [];
    for (var i = 0; i < lineItems.length; i++) {
        var li = lineItems[i];
        tabLineItems.addItem(new sap.m.ColumnListItem({
            cells: [
                new sap.m.Text({ text: li.description || '' }),
                new sap.m.Text({ text: String(li.qty || li.quantity || 1) }),
                new sap.m.Text({ text: (extraction.currency || '$') + ' ' + (li.unitPrice || 0) }),
                new sap.m.Text({ text: (extraction.currency || '$') + ' ' + (li.amount || 0) })
            ]
        }));
    }

    // Red Flags Section
    var vboxRedFlags = new sap.m.VBox();
    vboxRedFlags.addStyleClass('sapUiSmallMarginTop');

    var hboxRedFlagsHeader = new sap.m.HBox({ alignItems: 'Center' });
    hboxRedFlagsHeader.addStyleClass('sapUiTinyMarginBottom');

    var titleRf = new sap.m.Title({ text: 'Discrepancies & Red Flags', level: 'H4' });
    var infoRfTitle = new sap.tnt.InfoLabel({
        displayOnly: false,
        text: redFlags.length > 0 ? (redFlags.length + ' red flag' + (redFlags.length > 1 ? 's' : '')) : 'No red flags',
        colorScheme: getInfoLabelScheme('redFlags', redFlags.length)
    });
    infoRfTitle.addStyleClass('genai_claim_invoice_validator_sapUiSmallMarginBegin');

    hboxRedFlagsHeader.addItem(titleRf);
    hboxRedFlagsHeader.addItem(infoRfTitle);

    vboxRedFlags.addItem(hboxRedFlagsHeader);

    if (redFlags.length === 0) {
        vboxRedFlags.addItem(new sap.m.MessageStrip({
            text: 'No red flags or discrepancies detected.',
            type: 'Success',
            showIcon: true
        }));
    } else {
        for (var j = 0; j < redFlags.length; j++) {
            var ms = new sap.m.MessageStrip({
                text: redFlags[j],
                type: 'Error',
                showIcon: true
            });
            ms.addStyleClass('sapUiTinyMarginBottom');
            vboxRedFlags.addItem(ms);
        }
    }

    // History Panel & Table
    var pnlHistory = new sap.m.Panel({
        headerText: 'Validation History',
        expandable: true,
        expanded: true
    });
    pnlHistory.addStyleClass('sapUiSmallMarginTop');

    var tabHistory = new sap.m.Table({
        columns: [
            new sap.m.Column({ header: new sap.m.Text({ text: 'Date' }) }),
            new sap.m.Column({ header: new sap.m.Text({ text: 'By' }) }),
            new sap.m.Column({ header: new sap.m.Text({ text: 'Similarity' }) }),
            new sap.m.Column({ header: new sap.m.Text({ text: 'Red Flags' }) })
        ]
    });

    var histList = validationsList || [];
    if (histList.length === 0) {
        tabHistory.addItem(new sap.m.ColumnListItem({
            cells: [
                new sap.m.Text({ text: 'No history available' }),
                new sap.m.Text({ text: '-' }),
                new sap.m.Text({ text: '-' }),
                new sap.m.Text({ text: '-' })
            ]
        }));
    } else {
        for (var k = 0; k < histList.length; k++) {
            var v = histList[k];
            var dt = v.validatedAt ? new Date(v.validatedAt).toLocaleString() : (v.createdAt ? new Date(v.createdAt).toLocaleString() : 'N/A');
            var histSim = v.similarity != null ? v.similarity : null;
            var histSimPct = histSim != null ? Math.round(histSim * 100) + ' % match' : 'N/A';
            var rfCount = v.redFlagCount != null ? v.redFlagCount : (v.extraction && v.extraction.redFlags ? v.extraction.redFlags.length : 0);

            var infoHistSim = new sap.tnt.InfoLabel({
                displayOnly: false,
                text: histSimPct,
                icon: histSim != null ? 'sap-icon://accept' : '',
                colorScheme: getInfoLabelScheme('similarity', histSim)
            });

            var infoHistRf = new sap.tnt.InfoLabel({
                displayOnly: false,
                text: rfCount > 0 ? (rfCount + ' red flag' + (rfCount > 1 ? 's' : '')) : 'No red flags',
                colorScheme: getInfoLabelScheme('redFlags', rfCount)
            });

            var cli = new sap.m.ColumnListItem({
                type: 'Active',
                cells: [
                    new sap.m.Text({ text: dt }),
                    new sap.m.Text({ text: v.validatedBy || 'System' }),
                    infoHistSim,
                    infoHistRf
                ]
            });

            (function(histVal, allValids, cnt) {
                cli.attachPress(function() {
                    renderFullValidationContent(histVal, allValids, cnt);
                });
            })(v, histList, container);

            tabHistory.addItem(cli);
        }
    }
    pnlHistory.addContent(tabHistory);

    container.addItem(stripVerdict);
    container.addItem(hboxKpis);
    container.addItem(pnlFacts);
    container.addItem(tabLineItems);
    container.addItem(vboxRedFlags);
    container.addItem(pnlHistory);
}

function onGetAttachmentsValidationsSuccess(xhr) {
    var response = xhr ? xhr.responseJSON : null;
    var validations = (response && response.validations) ? response.validations : [];

    var container = window._activeValDialogContainer;
    if (container && validations.length > 0) {
        var latestVal = validations[0];
        renderFullValidationContent(latestVal, validations, container);
    } else if (container) {
        container.removeAllItems();
        container.addItem(new sap.m.MessageStrip({
            text: 'No detailed validation records found.',
            type: 'Information'
        }));
    }
}

function onGetAttachmentsValidationsError(xhr) {
    var errorMsg = 'Failed to load attachment validations.';
    if (xhr && xhr.responseJSON) {
        errorMsg = xhr.responseJSON.message || xhr.responseJSON.error || errorMsg;
    }
    sap.m.MessageToast.show(errorMsg);
}

function onNavBack() {
    if (tabClaims && tabClaims.setBusy) {
        tabClaims.setBusy(true);
    }
    loadClaimsList();
    App.back();
}

setTimeout(function() {
    initApp();
}, 200);
