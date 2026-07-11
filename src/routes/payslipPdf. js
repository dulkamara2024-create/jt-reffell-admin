const PDFDocument = require('pdfkit');

// Streams a real PDF pay slip directly to an HTTP response.
function streamPayslipPdf(res, slip) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="payslip-${slip.staff_name.replace(/\s+/g, '_')}-${slip.month}-${slip.year}.pdf"`);
  doc.pipe(res);

  doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f2f52')
    .text('J.T. Reffell Memorial French Friendship Primary', { align: 'left' });
  doc.font('Helvetica').fontSize(10).fillColor('#555')
    .text('Tower Hill, Freetown, Sierra Leone')
    .text(`Pay slip — ${slip.month} ${slip.year}`);
  doc.moveDown(1);

  doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f2f52').text(slip.staff_name);
  doc.font('Helvetica').fontSize(10).fillColor('#333').text(slip.role);
  doc.fontSize(9).fillColor('#888').text(`Slip ID: ${slip.id}`);
  doc.moveDown(1);

  const rows = [
    ['Basic salary', slip.basic, 'NASSIT (5%)', slip.nassit],
    ['Housing allowance', slip.housing, 'Income tax (PAYE)', slip.tax],
    ['Transport allowance', slip.transport, 'Other deduction', slip.other_deduction],
    ['Other allowance', slip.other, '', ''],
  ];

  const fmt = (n) => 'Le ' + Number(n).toLocaleString('en-US');
  const startY = doc.y;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f2f52');
  doc.text('Earnings', 50, startY);
  doc.text('Deductions', 320, startY);
  doc.moveDown(0.5);
  doc.font('Helvetica').fontSize(10).fillColor('#222');

  rows.forEach(([label1, amt1, label2, amt2]) => {
    const y = doc.y;
    if (label1) doc.text(`${label1}: ${fmt(amt1)}`, 50, y);
    if (label2) doc.text(`${label2}: ${fmt(amt2)}`, 320, y);
    doc.moveDown(0.7);
  });

  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(10)
    .text(`Gross pay: ${fmt(slip.gross)}`, 50)
    .text(`Total deductions: ${fmt(Number(slip.nassit) + Number(slip.tax) + Number(slip.other_deduction))}`, 320, doc.y - doc.currentLineHeight());

  doc.moveDown(1.5);
  doc.rect(50, doc.y, 495, 40).fill('#f3f0ea');
  doc.fillColor('#0f2f52').font('Helvetica-Bold').fontSize(13)
    .text(`NET PAY: ${fmt(slip.net)}`, 60, doc.y - 30);

  doc.moveDown(3);
  doc.font('Helvetica').fontSize(8).fillColor('#888')
    .text(`Generated ${new Date(slip.generated_date).toDateString()} by ${slip.generated_by}`);
  doc.font('Helvetica-Oblique').fontSize(9).fillColor('#555')
    .text('"Labour Conquers All" — Le travail vainc tout');

  doc.end();
}

module.exports = { streamPayslipPdf };
