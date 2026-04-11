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
        const invoiceId = payout.id;
        const filename = `invoice_${invoiceId}.pdf`;
        const filePath = path.join(__dirname, 'invoices', filename);
        
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // --- Header ---
        doc.fillColor('#000000')
           .fontSize(20)
           .text('FACTURE / INVOICE', { align: 'right' });
        
        doc.fontSize(10)
           .text(`N°: ${invoiceId}`, { align: 'right' })
           .text(`Date: ${new Date(payout.processedAt || Date.now()).toLocaleDateString()}`, { align: 'right' });

        doc.moveDown(2);

        // --- Parties ---
        const startY = doc.y;
        
        // From (Model)
        doc.fontSize(12).font('Helvetica-Bold').text('ÉMETTEUR / FROM:', 50, startY);
        doc.fontSize(10).font('Helvetica')
           .text(billingInfo.name || billingInfo.entity || payout.modelEmail)
           .text(billingInfo.address || '')
           .text(billingInfo.country || '');
        
        // To (Platform)
        doc.fontSize(12).font('Helvetica-Bold').text('DESTINATAIRE / TO:', 300, startY);
        doc.fontSize(10).font('Helvetica')
           .text(PLATFORM_INFO.name)
           .text(PLATFORM_INFO.address)
           .text(`TVA: ${PLATFORM_INFO.tva}`);

        doc.moveDown(4);

        // --- Table Header ---
        const tableTop = doc.y;
        doc.rect(50, tableTop, 500, 20).fill('#f0f0f0');
        doc.fillColor('#000000').font('Helvetica-Bold');
        doc.text('DESCRIPTION', 60, tableTop + 5);
        doc.text('AMOUNT (USD)', 450, tableTop + 5, { width: 90, align: 'right' });

        // --- Table Body ---
        doc.font('Helvetica').fontSize(10);
        const itemY = tableTop + 30;
        doc.text(`Prestation de création de contenu numérique / Digital content creation services`, 60, itemY);
        doc.text(`$${parseFloat(payout.amount).toFixed(2)}`, 450, itemY, { width: 90, align: 'right' });

        doc.moveTo(50, itemY + 20).lineTo(550, itemY + 20).stroke('#eeeeee');

        // --- Totals ---
        doc.moveDown(2);
        const totalY = doc.y;
        doc.fontSize(12).font('Helvetica-Bold').text('TOTAL À PAYER / TOTAL DUE:', 300, totalY);
        doc.fontSize(14).text(`$${parseFloat(payout.amount).toFixed(2)}`, 450, totalY, { width: 90, align: 'right' });

        doc.moveDown(2);
        doc.fontSize(8).font('Helvetica-Oblique').fillColor('#666666')
           .text('TVA non applicable, art. 259-1 du CGI (exportation de services). / VAT not applicable (export of services).', 50, doc.y + 20);

        // --- Footer ---
        doc.end();

        stream.on('finish', () => resolve(filename));
        stream.on('error', reject);
    });
}

module.exports = { generateInvoice };
