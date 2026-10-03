// ========================================================
// EXPORT UTILS (PDF, CSV & EXCEL)
// Utilitários para geração de relatórios e exportações reais
// ========================================================

/**
 * Exporta dados para CSV estruturado com UTF-8 BOM (compatível com Excel)
 * @param {string} filename 
 * @param {Array<Array>} rows 
 * @param {Array<string>} headers 
 */
export function exportToCSV(filename, rows, headers) {
  try {
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
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch (err) {
    console.error('Erro ao exportar CSV:', err);
    throw err;
  }
}

/**
 * Exporta dados para arquivo Excel (.xlsx) estruturado com abas
 * @param {string} filename 
 * @param {Array<Array>} rows 
 * @param {Array<string>} headers 
 * @param {Object} options - { summary: [ { label, value } ], sheetName: 'Dados' }
 */
export function exportToExcel(filename, rows, headers, options = {}) {
  try {
    if (window.XLSX) {
      const wb = window.XLSX.utils.book_new();

      // Aba 1: Resumo (se houver métricas ou filtros aplicados)
      if (options.summary && options.summary.length > 0) {
        const summaryData = [
          ['APP TESTE — RELATÓRIO DO SISTEMA'],
          ['Gerado em:', new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR')],
          ['Filtros aplicados:', options.filters || 'Nenhum filtro'],
          [],
          ['MÉTRICA / INDICADOR', 'VALOR CONSOLIDADO'],
          ...options.summary.map(s => [s.label, s.value])
        ];
        const wsSummary = window.XLSX.utils.aoa_to_sheet(summaryData);
        window.XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');
      }

      // Aba 2: Dados Detalhados
      const data = [headers, ...rows];
      const wsData = window.XLSX.utils.aoa_to_sheet(data);
      window.XLSX.utils.book_append_sheet(wb, wsData, options.sheetName || 'Dados');

      window.XLSX.writeFile(wb, `${filename}.xlsx`);
      return true;
    } else {
      // Fallback para CSV
      return exportToCSV(filename, rows, headers);
    }
  } catch (err) {
    console.error('Erro ao exportar Excel:', err);
    throw err;
  }
}

/**
 * Exporta documento PDF diagramado profissionalmente via jsPDF + autoTable
 * @param {string} filename 
 * @param {string} title 
 * @param {Array<string>} headers 
 * @param {Array<Array>} rows 
 * @param {Object} options - { period, filters, summary: [{ label, value }] }
 */
export function exportToPDF(filename, title, headers, rows, options = {}) {
  try {
    if (window.jspdf && window.jspdf.jsPDF) {
      const { jsPDF } = window.jspdf;
      // Orientação Paisagem (landscape) se tiver mais de 5 colunas para melhor legibilidade
      const orientation = headers.length > 5 ? 'landscape' : 'portrait';
      const doc = new jsPDF({ orientation });

      // Cabeçalho de Marca
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 255); // Azul #0000FF
      doc.text('APP TESTE', 14, 16);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(24, 24, 27);
      doc.text(title, 14, 24);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(113, 113, 122);
      const generatedAt = `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`;
      const periodText = options.period ? ` • Período: ${options.period}` : '';
      const filterText = options.filters ? ` • Filtros: ${options.filters}` : '';
      doc.text(`${generatedAt}${periodText}${filterText}`, 14, 30);

      let startY = 36;

      // Resumo de Totais (se informado)
      if (options.summary && options.summary.length > 0) {
        doc.setDrawColor(228, 228, 231);
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(14, startY, orientation === 'landscape' ? 268 : 182, 14, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(63, 63, 70);

        let curX = 18;
        options.summary.forEach((item) => {
          doc.text(`${item.label}: `, curX, startY + 9);
          const labelWidth = doc.getTextWidth(`${item.label}: `);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 255);
          doc.text(String(item.value), curX + labelWidth, startY + 9);
          const valWidth = doc.getTextWidth(String(item.value));
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(63, 63, 70);
          curX += labelWidth + valWidth + 14;
        });

        startY += 20;
      }

      // Tabela de Dados via autoTable
      if (doc.autoTable) {
        doc.autoTable({
          startY,
          head: [headers],
          body: rows,
          theme: 'striped',
          headStyles: {
            fillColor: [0, 0, 255],
            textColor: [255, 255, 255],
            fontSize: 8.5,
            fontStyle: 'bold',
            cellPadding: 3
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250]
          },
          styles: {
            fontSize: 8,
            cellPadding: 2.5,
            textColor: [39, 39, 42],
            overflow: 'linebreak'
          },
          margin: { left: 14, right: 14 }
        });
      }

      doc.save(`${filename}.pdf`);
      return true;
    } else {
      window.print();
      return true;
    }
  } catch (err) {
    console.error('Erro ao exportar PDF:', err);
    throw err;
  }
}
