export function exportToCSV(filename, rows, headers) {
  let csvContent = '\uFEFF'; // UTF-8 BOM para acentos corretos no Excel
  if (headers && headers.length > 0) {
    csvContent += headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(';') + '\r\n';
  }
  rows.forEach(row => {
    const line = row.map(cell => {
      const val = cell === null || cell === undefined ? '' : String(cell);
      return `"${val.replace(/"/g, '""')}"`;
    }).join(';');
    csvContent += line + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(filename, rows, headers) {
  if (window.XLSX) {
    const data = [headers, ...rows];
    const ws = window.XLSX.utils.aoa_to_sheet(data);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Dados');
    window.XLSX.writeFile(wb, `${filename}.xlsx`);
  } else {
    exportToCSV(filename, rows, headers);
  }
}

export function exportToPDF(filename, title, headers, rows) {
  if (window.jspdf && window.jspdf.jsPDF) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 255); // #0000FF
    doc.text('APP TESTE', 14, 18);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text(title, 14, 26);
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 32);

    if (doc.autoTable) {
      doc.autoTable({
        startY: 38,
        head: [headers],
        body: rows,
        headStyles: { fillColor: [0, 0, 255], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        styles: { fontSize: 9, cellPadding: 3 }
      });
    }
    doc.save(`${filename}.pdf`);
  } else {
    window.print();
  }
}
