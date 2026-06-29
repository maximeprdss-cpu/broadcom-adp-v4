const PDFDocument = require('pdfkit');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { deal, account, versions, landscape, narrative, phases, checkpoints } = req.body;
  const produit = deal.produit || 'VMware';

  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="ADP_${(account.name || 'export').replace(/\s+/g,'_')}.pdf"`);
  doc.pipe(res);

  const RED = '#CC0000';
  const DARK = '#1A1A2E';
  const GREY = '#4A4A4A';
  const LIGHTGREY = '#F5F5F5';
  const MIDGREY = '#CCCCCC';
  const WHITE = '#FFFFFF';
  const W = 595 - 100;

  const sectionTitle = (text) => {
    doc.moveDown(0.8);
    doc.rect(50, doc.y, W, 22).fill(DARK);
    doc.fontSize(11).fillColor(WHITE).font('Helvetica-Bold')
       .text(text.toUpperCase(), 58, doc.y - 18, { width: W - 16 });
    doc.moveDown(0.6);
    doc.fillColor(GREY).font('Helvetica').fontSize(10);
  };

  const fieldRow = (label, value) => {
    const y = doc.y;
    doc.fontSize(9).fillColor(GREY).font('Helvetica-Bold').text(label, 50, y, { width: 180, continued: false });
    doc.fontSize(9).fillColor(DARK).font('Helvetica').text(value || '—', 235, y, { width: W - 185 });
    doc.moveDown(0.3);
  };

  const italic = (text) => {
    doc.fontSize(9).fillColor('#888888').font('Helvetica-Oblique').text(text, { width: W });
    doc.moveDown(0.4);
  };

  const bodyText = (text) => {
    if (!text) return;
    doc.fontSize(10).fillColor(DARK).font('Helvetica').text(text, { width: W });
    doc.moveDown(0.5);
  };

  const drawTable = (headers, rows, colWidths) => {
    const rowH = 20;
    const tableX = 50;
    let y = doc.y;
    let x = tableX;
    doc.rect(tableX, y, W, rowH).fill(DARK);
    headers.forEach((h, i) => {
      doc.fontSize(8).fillColor(WHITE).font('Helvetica-Bold')
         .text(h, x + 4, y + 6, { width: colWidths[i] - 8 });
      x += colWidths[i];
    });
    y += rowH;
    rows.forEach((row, ri) => {
      if (y + rowH > doc.page.height - 80) { doc.addPage(); y = 50; }
      const bg = ri % 2 === 0 ? WHITE : LIGHTGREY;
      doc.rect(tableX, y, W, rowH).fill(bg).stroke(MIDGREY);
      x = tableX;
      row.forEach((cell, i) => {
        doc.fontSize(8).fillColor(DARK).font('Helvetica')
           .text(cell || '—', x + 4, y + 6, { width: colWidths[i] - 8 });
        x += colWidths[i];
      });
      y += rowH;
    });
    doc.y = y + 8;
    doc.x = 50;
  };

  doc.rect(0, 0, 595, 140).fill(DARK);
  doc.fontSize(22).fillColor(WHITE).font('Helvetica-Bold')
     .text(`${produit} Adoption Plan`, 50, 45, { width: 495, align: 'center' });
  doc.fontSize(12).fillColor(RED).font('Helvetica')
     .text('Broadcom Limited — Confidential', 50, 80, { width: 495, align: 'center' });
  doc.fontSize(10).fillColor('#AAAAAA')
     .text(`Account: ${account.name || '—'}   |   Date: ${new Date().toLocaleDateString('fr-FR')}`, 50, 105, { width: 495, align: 'center' });
  doc.moveDown(2);
  doc.fillColor(GREY).font('Helvetica').fontSize(10);

  sectionTitle('Instruction For Use');
  ['Please make sure you provide the account details along with the current licenses.',
   'Please provide SPOC for the customer and partner.',
   'Please provide as much information as possible.',
   'Please ensure the details are updated.',
   'Please ensure the timelines are true, as AD checkpoints need to be scheduled.'
  ].forEach(i => {
    doc.fontSize(9).fillColor(DARK).font('Helvetica').text(`• ${i}`, 58, doc.y, { width: W - 8 });
    doc.moveDown(0.2);
  });

  sectionTitle('Account Details');
  fieldRow('Account Name:', account.name);
  fieldRow('ERP Number / Customer Site ID:', account.erp);
  fieldRow('Customer Contact:', account.contactClient);
  fieldRow('Partner Name:', account.partnerName);
  fieldRow('Partner Contact:', account.contactPartner);
  fieldRow('Partner Escalation Contact:', account.contactEscalade);
  fieldRow('Broadcom Contact 1:', account.broadcom1);
  fieldRow('Broadcom Contact 2:', account.broadcom2);
  fieldRow('Broadcom Contact 3:', account.broadcom3);
  fieldRow('Current Licenses:', account.licences);

  sectionTitle('Current State Architecture');
  italic('Please provide the most up-to-date information regarding the customer, including the number of sites, the status of VMware license usage, and current deployment details.');
  bodyText(narrative.currentState);
  drawTable(['Product', 'Deployed Version'],
    [['vSphere', versions.vsphere],['vSAN', versions.vsan],['NSX', versions.nsx],
     ['VCF Operations', versions.vcfops],['VCF Automation', versions.vcfauto],
     ['Container Runtime', versions.container],['vDefend / ATP', versions.vdefend]],
    [220, W - 220]);

  sectionTitle(`${produit === 'VCF' || produit === 'VVF' ? 'Competitive' : 'Ecosystem'} Landscape`);
  italic('Please share the latest view of the competitive landscape.');
  const lsRows = (landscape || []).filter(r => r.tech).map(r => [r.tech, r.vendor, r.remarks]);
  drawTable(['Technology', 'Competitive Vendor', 'Remarks/Comments'],
    lsRows.length ? lsRows : [['—','—','—']], [140, 160, W - 300]);

  sectionTitle(`${produit} Adoption Initiative`);
  italic('Please outline the initiatives within the account, regardless of whether they are ultimately pursued.');
  bodyText(narrative.adoptionInit);

  sectionTitle(`${produit} Collateral`);
  italic('Any collateral related to the account, initiatives, or activities would be valuable.');
  bodyText(narrative.collateral);

  sectionTitle(`${produit} Activities and Timeline`);
  italic('Please provide a high-level overview of the activities planned for this account to support adoption.');
  const phRows = (phases || []).map(p => [p.phase, p.component, p.activities, p.duration, p.timeline]);
  drawTable(['Phase', 'Project Component', 'Main Activities', 'Duration', 'Timeline'],
    phRows.length ? phRows : [['—','—','—','—','—']], [65, 110, 170, 65, W - 410]);

  sectionTitle('Commitment');
  italic('Please provide details on any upcoming commitments.');
  bodyText(narrative.commitment);

  sectionTitle('Checkpoints');
  italic('These checkpoints are mandatory with the Broadcom Account Director.');
  drawTable(['Phase', 'Timeslot', 'Current Status', 'Checked by AD', 'Checked by SE'],
    (checkpoints || []).map(c => [c.phase, c.timeslot, c.status, c.ad, c.se]),
    [65, 100, 100, 130, W - 395]);

  sectionTitle('Comments / Remarks (Optional)');
  italic('Please share any comments or insights you may have.');
  bodyText(narrative.comments);

  doc.moveDown(1);
  doc.fontSize(8).fillColor('#AAAAAA').font('Helvetica')
     .text('Broadcom Limited Confidential — Version 1.0', 50, doc.page.height - 40, { width: 495, align: 'center' });

  doc.end();
};
