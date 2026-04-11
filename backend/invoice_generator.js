const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const PLATFORM_INFO = {
    name: "MV CAPITAL",
    address: "50 avenue des Champs Elysées, 75008 Paris",
    tva: "FR22820511913"
};

/**
 * Generates a minimal diagnostic invoice PDF.
 */
async function generateInvoice(payout, billingInfo) {
    return new Promise((resolve, reject) => {
        const invoiceId = payout.id.replace(/[^a-z0-2-]/gi, '_');
        const filename = `invoice_${invoiceId}.pdf`;
        const invoicesDir = '/tmp/lively_invoices';
        
        console.log('[Invoice Generator] Diagnostic mode starting for', payout.id);
        
        if (!fs.existsSync(invoicesDir)) {
            try {
                fs.mkdirSync(invoicesDir, { recursive: true });
            } catch (err) {
                console.error('[Invoice Generator] Folder fail:', err);
                return reject(err);
            }
        }

        const filePath = path.join(invoicesDir, filename);
        
        try {
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);
            doc.fontSize(25).text('DIAGNOSTIC INVOICE', 100, 100);
            doc.fontSize(12).text(`Payout ID: ${payout.id}`, 100, 150);
            doc.text(`Model: ${payout.modelEmail}`, 100, 170);
            doc.text(`Amount: $${payout.amount}`, 100, 190);
            doc.end();

            stream.on('finish', () => {
                console.log('[Invoice Generator] Diagnostic PDF success');
                resolve(filename);
            });
            stream.on('error', (err) => {
                console.error('[Invoice Generator] PDF stream fail:', err);
                reject(err);
            });
        } catch (docErr) {
            console.error('[Invoice Generator] PDF init fail:', docErr);
            reject(docErr);
        }
    });
}

module.exports = { generateInvoice };
