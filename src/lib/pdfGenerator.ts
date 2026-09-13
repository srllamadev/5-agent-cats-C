import jsPDF from 'jspdf';

export function generateExecutiveReportPDF(auditResult: any, dashboardPayload: any) {
  if (!auditResult || !dashboardPayload) {
    alert("No hay datos de auditoría disponibles para generar el reporte.");
    return;
  }

  // Inicializar documento PDF (A4)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Configuración de márgenes y tipografía
  const marginX = 20;
  let cursorY = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - (marginX * 2);

  // Establecer tipografía Times New Roman (canónica)
  doc.setFont('times', 'normal');

  // Función auxiliar para añadir texto con wrap y actualizar cursorY
  const addWrappedText = (text: string, fontSize: number, style: 'normal' | 'bold' | 'italic' = 'normal', color: number[] = [0, 0, 0], align: 'left' | 'center' | 'right' | 'justify' = 'left') => {
    doc.setFont('times', style);
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    
    const lines = doc.splitTextToSize(text || '', contentWidth);
    
    // Si se pasa de página
    if (cursorY + (lines.length * (fontSize * 0.4)) > 280) {
      doc.addPage();
      cursorY = 20;
    }

    doc.text(lines, align === 'center' ? pageWidth / 2 : marginX, cursorY, { align: align as any });
    cursorY += (lines.length * (fontSize * 0.4)) + 5;
  };

  // --- PORTADA Y ENCABEZADO ---
  addWrappedText('INFORME EJECUTIVO DE AUDITORÍA DE SEGURIDAD', 22, 'bold', [0, 51, 102], 'center');
  cursorY += 5;
  addWrappedText(`Fecha de emisión: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`, 12, 'italic', [100, 100, 100], 'center');
  addWrappedText(`ID de Auditoría: ${auditResult.audit_id || 'N/A'}`, 10, 'normal', [150, 150, 150], 'center');
  cursorY += 10;

  // --- DATOS DEL CONTRATO ---
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(0.5);
  doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
  cursorY += 8;

  addWrappedText('1. INFORMACIÓN DEL ACTIVO EVALUADO', 14, 'bold', [0, 51, 102]);
  addWrappedText(`Nombre del Contrato: ${auditResult.contrato?.name || dashboardPayload.contrato?.name || 'Desconocido'}`, 12, 'normal');
  addWrappedText(`Dirección / Endpoint: ${auditResult.contrato?.address || dashboardPayload.contrato?.address || 'N/A'}`, 12, 'normal');
  addWrappedText(`Red: ${auditResult.contrato?.network || dashboardPayload.contrato?.network || 'N/A'}`, 12, 'normal');
  cursorY += 5;

  // --- RESULTADO GENERAL ---
  addWrappedText('2. CALIFICACIÓN DE SEGURIDAD Y MÉTRICAS', 14, 'bold', [0, 51, 102]);
  const score = dashboardPayload.kpis?.security_score || auditResult.security_score || 0;
  addWrappedText(`Puntuación Global (Security Score): ${score}/100`, 16, 'bold', score >= 70 ? [0, 153, 76] : score >= 40 ? [204, 102, 0] : [204, 0, 0]);
  
  const kpis = dashboardPayload.kpis || {};
  addWrappedText(`Hallazgos Críticos: ${kpis.hallazgos_criticos || 0}`, 12, 'normal');
  addWrappedText(`Hallazgos Altos: ${kpis.hallazgos_altos || 0}`, 12, 'normal');
  addWrappedText(`Hallazgos Medios: ${kpis.hallazgos_medios || 0}`, 12, 'normal');
  addWrappedText(`Hallazgos Bajos: ${kpis.hallazgos_bajos || 0}`, 12, 'normal');
  cursorY += 5;

  // --- RESUMEN EJECUTIVO ---
  addWrappedText('3. RESUMEN EJECUTIVO', 14, 'bold', [0, 51, 102]);
  addWrappedText(auditResult.resumen_ejecutivo || dashboardPayload.resumen_ejecutivo || 'No se proveyó un resumen ejecutivo por parte del Manager de IA.', 12, 'normal', [0, 0, 0], 'justify');
  cursorY += 5;

  // --- IMPLICACIONES Y RECOMENDACIONES ---
  addWrappedText('4. IMPLICACIONES Y RECOMENDACIONES CLAVE', 14, 'bold', [0, 51, 102]);
  
  const hallazgos = auditResult.hallazgos || [];
  const criticosYAltos = hallazgos.filter((h: any) => h.severidad === 'critico' || h.severidad === 'alto');

  if (criticosYAltos.length > 0) {
    addWrappedText('Implicaciones de los hallazgos de severidad crítica/alta:', 12, 'bold');
    criticosYAltos.forEach((h: any, i: number) => {
      addWrappedText(`• ${h.titulo.toUpperCase()}`, 11, 'bold', [204, 0, 0]);
      addWrappedText(`Implicación: ${h.descripcion}`, 11, 'normal', [0, 0, 0], 'justify');
      addWrappedText(`Recomendación: ${h.recomendacion || 'Revisar la lógica del contrato y aplicar validaciones estrictas.'}`, 11, 'italic', [0, 102, 0], 'justify');
      cursorY += 3;
    });
  } else if (hallazgos.length > 0) {
    addWrappedText('Implicaciones Generales:', 12, 'bold');
    addWrappedText('El contrato presenta un nivel de riesgo manejable. Los hallazgos encontrados son de severidad media o baja. Se sugiere revisar la documentación para aplicar las mejores prácticas antes del despliegue en producción principal.', 12, 'normal', [0, 0, 0], 'justify');
    addWrappedText('Recomendaciones Clave:', 12, 'bold');
    hallazgos.slice(0, 3).forEach((h: any) => {
      addWrappedText(`• ${h.titulo}: ${h.recomendacion || 'Mejorar controles.'}`, 11, 'italic', [0, 0, 0], 'justify');
    });
  } else {
    addWrappedText('No se encontraron vulnerabilidades reportadas durante la auditoría.', 12, 'normal');
    addWrappedText('Recomendación: Mantener monitorización continua en producción.', 12, 'italic');
  }

  // --- PIE DE PÁGINA ---
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generado por AuditAI Engine | Página ${i} de ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
  }

  // Descargar el archivo
  doc.save(`Informe_Ejecutivo_AuditAI_${auditResult.audit_id || 'N-A'}.pdf`);
}
