const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const PLATFORM_INFO = {
    name: "MV CAPITAL",
    address: "50 avenue des Champs Elysées, 75008 Paris",
    tva: "FR22820511913"
};

/**
 * Generates an invoice PDF for a payout.
 * @param {Object} payout - The payout object including model info.
 * @param {Object} billingInfo - The model's billing info.
 * @returns {Promise<string>} - The filename of the generated PDF.
 */
async function generateInvoice(payout, billingInfo) {
    return new Promise((resolve, reject) => {
        const invoiceId = payout.id.replace(/[^a-z0-2-]/gi, '_'); // Sanitize for filename
        const filename = `invoice_${invoiceId}.pdf`;
        // Use /tmp for broader compatibility on Render Free tier
        const invoicesDir = '/tmp/lively_invoices';
        
        console.log('[Invoice Generator] Starting for', payout.id);
        
        // Ensure directory exists
        if (!fs.existsSync(invoicesDir)) {
            try {
                fs.mkdirSync(invoicesDir, { recursive: true });
            } catch (err) {
                console.error('[Invoice Generator] Failed to create directory:', err);
                return reject(err);
            }
        }

        const filePath = path.join(invoicesDir, filename);
        console.log('[Invoice Generator] Writing to', filePath);
        
        try {
            console.log('[Invoice Generator] Initializing PDF Kit doc...');
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);
            doc.fontSize(25).text('TEST INVOICE', 100, 100);
            doc.fontSize(12).text(`ID: ${payout.id}`, 100, 150);
            doc.text(`Amount: $${payout.amount}`, 100, 170);
            doc.end();

            stream.on('finish', () => {
                console.log('[Invoice Generator] Stream finished successfully');
                resolve(filename);
            });
            stream.on('error', (err) => {
                console.error('[Invoice Generator] Stream error:', err);
                reject(err);
            });
        } catch (docErr) {
            console.error('[Invoice Generator] Catch block error:', docErr);
            reject(docErr);
        }
    });
}
    });
}

module.exports = { generateInvoice };
