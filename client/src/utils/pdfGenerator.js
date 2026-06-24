import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateStatementPDF = (transactions, user, startDate, endDate) => {
  const doc = new jsPDF();

  // Colors
  const gold = [212, 175, 55]; // #D4AF37
  const darkBlue = [11, 18, 33]; // #0B1221
  const gray = [100, 100, 100];

  // --- HEADER ---
  doc.setFontSize(22);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text('Krevon', 14, 20);
  
  doc.setFontSize(16);
  doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.text('Bank Account Statement', 45, 20);

  // --- PERIOD & USER INFO ---
  doc.setFontSize(10);
  doc.setTextColor(gray[0], gray[1], gray[2]);
  
  const periodText = `Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`;
  doc.text(periodText, 14, 32);

  doc.text(`Account Name: ${user.fullName || user.full_name || 'N/A'}`, 14, 38);
  doc.text(`Email: ${user.email || 'N/A'}`, 14, 44);

  // --- SUMMARY ---
  const totalTransactions = transactions.length;
  const totalAmount = transactions.reduce((sum, tx) => {
    const isPositive = tx.type === 'deposit' || tx.type === 'bank_funding' || tx.amount > 0;
    return isPositive ? sum + parseFloat(tx.amount || 0) : sum - parseFloat(tx.amount || 0);
  }, 0);

  doc.text(`Total Transactions: ${totalTransactions}`, 120, 32);
  doc.text(`Net Amount: ${totalAmount >= 0 ? '+' : ''}${totalAmount.toFixed(2)}`, 120, 38);

  // --- TABLE ---
  const tableData = transactions.map(tx => {
    const isPositive = tx.type === 'deposit' || tx.type === 'bank_funding' || tx.amount > 0;
    const amountStr = `${isPositive ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)} ${tx.currency_code || ''}`;
    
    return [
      new Date(tx.created_at || tx.createdAt).toLocaleDateString(),
      tx.description || tx.type || 'Transaction',
      tx.type || 'Transfer',
      tx.status || 'Completed',
      amountStr
    ];
  });

  autoTable(doc, {
    startY: 55,
    head: [['Date', 'Description', 'Type', 'Status', 'Amount']],
    body: tableData,
    headStyles: { fillColor: darkBlue, textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 9, cellPadding: 4 },
  });

  // --- FOOTER ---
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(gray[0], gray[1], gray[2]);
    const footerText = `Generated on ${new Date().toLocaleDateString()} | Krevon International Bank London`;
    doc.text(footerText, 14, doc.internal.pageSize.height - 10);
  }

  // SAVE
  doc.save(`Krevon_Statement_${startDate || 'all'}_to_${endDate || 'all'}.pdf`);
};
