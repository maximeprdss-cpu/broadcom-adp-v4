const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType } = require('docx');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { deal, account, versions, landscape, narrative, phases, checkpoints } = req.body;

  const produit = deal.produit || 'VMware';
  const titre = `${produit} Adoption Plan`;

  const bold = (text, size = 22) => new TextRun({ text, bold: true, size });
  const normal = (text, size = 22) => new TextRun({ text, size });
  const h = (text, level = HeadingLevel.HEADING_1) => new Paragraph({ text, heading: level, spacing: { before: 300, after: 100 } });
  const p = (text = '', opts = {}) => new Paragraph({ children: [new TextRun({ text, size: 22, ...opts })], spacing: { before: 80, after: 80 } });
  const blank = () => new Paragraph({ text: '' });

  const cellBold = (text, bg = null) => new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20 })] })],
    shading: bg ? { fill: bg, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 }
  });

  const cell = (text) => new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text: text || '', size: 20 })] })],
    margins: { top: 80, bottom: 80, left: 120, right: 120 }
  });

  const headerRow = (cols) => new TableRow({
    children: cols.map(c => cellBold(c, 'D0D0D0')),
    tableHeader: true
  });

  const dataRow = (cols) => new TableRow({ children: cols.map(c => cell(c)) });

  const versionsRows = [
    headerRow(['Product', 'Version']),
    dataRow(['vSphere', versions.vsphere || 'Not deployed']),
    dataRow(['vSAN', versions.vsan || 'Not deployed']),
    dataRow(['NSX', versions.nsx || 'Not deployed']),
    dataRow(['VCF Operations', versions.vcfops || 'Not deployed']),
    dataRow(['VCF Automation', versions.vcfauto || 'Not deployed']),
    dataRow(['Container Runtime', versions.container || 'Not deployed']),
    dataRow(['vDefend / ATP', versions.vdefend || 'Not deployed']),
  ];

  const versionsTable = new Table({ rows: versionsRows, width: { size: 100, type: WidthType.PERCENTAGE } });

  const lsRows = [headerRow(['Technology', 'Competitive Vendor', 'Remarks/Comments'])];
  (landscape || []).forEach(row => lsRows.push(dataRow([row.tech, row.vendor, row.remarks])));
  if (lsRows.length === 1) lsRows.push(dataRow(['—', '—', '—']));
  const landscapeTable = new Table({ rows: lsRows, width: { size: 100, type: WidthType.PERCENTAGE } });

  const phRows = [headerRow(['Phase', 'Project Component', 'Main Activities', 'Duration', 'Timeline'])];
  (phases || []).forEach(ph => phRows.push(dataRow([ph.phase, ph.component, ph.activities, ph.duration, ph.timeline])));
  const phasesTable = new Table({ rows: phRows, width: { size: 100, type: WidthType.PERCENTAGE } });

  const cpRows = [headerRow(['Phase', 'Timeslot', 'Current Status', 'Checked by Broadcom AD', 'Checked by Broadcom SE'])];
  (checkpoints || []).forEach(cp => cpRows.push(dataRow([cp.phase, cp.timeslot, cp.status, cp.ad, cp.se])));
  const checkpointsTable = new Table({ rows: cpRows, width: { size: 100, type: WidthType.PERCENTAGE } });

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ children: [new TextRun({ text: titre, bold: true, size: 36, color: '1F2937' })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 200 } }),
        h('Instruction For Use', HeadingLevel.HEADING_2),
        new Paragraph({ children: [new TextRun({ text: '• Please make sure you provide the account details along with the current licenses.', size: 20 })] }),
        new Paragraph({ children: [new TextRun({ text: '• Please provide SPOC for the customer and partner.', size: 20 })] }),
        new Paragraph({ children: [new TextRun({ text: '• Please provide as much information as possible.', size: 20 })] }),
        new Paragraph({ children: [new TextRun({ text: '• Please ensure the details are updated.', size: 20 })] }),
        new Paragraph({ children: [new TextRun({ text: '• Please ensure the timelines are true, as AD checkpoints need to be scheduled.', size: 20 })] }),
        blank(),
        h('Account Details'),
        new Paragraph({ children: [bold('Account Name: '), normal(account.name || '')] }),
        new Paragraph({ children: [bold('ERP Number / Customer Site ID: '), normal(account.erp || '')] }),
        new Paragraph({ children: [bold('Customer Contact (Name and Email): '), normal(account.contactClient || '')] }),
        new Paragraph({ children: [bold('Partner Name: '), normal(account.partnerName || '')] }),
        new Paragraph({ children: [bold('Partner Contact (Name and Email): '), normal(account.contactPartner || '')] }),
        new Paragraph({ children: [bold('Partner Escalation Contact (Name and Email): '), normal(account.contactEscalade || '')] }),
        new Paragraph({ children: [bold('Broadcom Contact 1 (Name and Email): '), normal(account.broadcom1 || '')] }),
        new Paragraph({ children: [bold('Broadcom Contact 2 (Name and Email): '), normal(account.broadcom2 || '')] }),
        new Paragraph({ children: [bold('Broadcom Contact 3 (Name and Email): '), normal(account.broadcom3 || '')] }),
        new Paragraph({ children: [bold('Current Licenses (product and quantity): '), normal(account.licences || '')] }),
        blank(),
        h('Current State Architecture'),
        new Paragraph({ children: [new TextRun({ text: 'Please provide the most up-to-date information regarding the customer.', size: 20, italics: true, color: '6B7280' })] }),
        blank(),
        p(narrative.currentState || ''),
        blank(),
        versionsTable,
        blank(),
        h(`${produit === 'VCF' || produit === 'VVF' ? 'Competitive' : 'Ecosystem'} Landscape`),
        new Paragraph({ children: [new TextRun({ text: 'Please share the latest view of the competitive landscape.', size: 20, italics: true, color: '6B7280' })] }),
        blank(),
        landscapeTable,
        blank(),
        h(`${produit} Adoption Initiative`),
        new Paragraph({ children: [new TextRun({ text: 'Please outline the initiatives within the account.', size: 20, italics: true, color: '6B7280' })] }),
        blank(),
        p(narrative.adoptionInit || ''),
        blank(),
        h(`${produit} Collateral`),
        new Paragraph({ children: [new TextRun({ text: 'Any collateral related to the account, initiatives, or activities would be valuable.', size: 20, italics: true, color: '6B7280' })] }),
        blank(),
        p(narrative.collateral || ''),
        blank(),
        h(`${produit} Activities and Timeline`),
        new Paragraph({ children: [new TextRun({ text: 'Please provide a high-level overview of the activities planned.', size: 20, italics: true, color: '6B7280' })] }),
        blank(),
        phasesTable,
        blank(),
        h('Commitment'),
        new Paragraph({ children: [new TextRun({ text: 'Please provide details on any upcoming commitments.', size: 20, italics: true, color: '6B7280' })] }),
        blank(),
        p(narrative.commitment || ''),
        blank(),
        h('Checkpoints'),
        new Paragraph({ children: [new TextRun({ text: 'These checkpoints are mandatory with the Broadcom Account Director.', size: 20, italics: true, color: '6B7280' })] }),
        blank(),
        checkpointsTable,
        blank(),
        h('Comments/Remarks (Optional)'),
        blank(),
        p(narrative.comments || ''),
        blank(),
        blank(),
        new Paragraph({ children: [new TextRun({ text: 'Broadcom Limited Confidential', size: 18, color: '9CA3AF' })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: 'Version 1.0 | Broadcom Limited Confidential', size: 18, color: '9CA3AF' })], alignment: AlignmentType.CENTER }),
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', 'attachment; filename="adoption-plan.docx"');
  res.send(buffer);
};
