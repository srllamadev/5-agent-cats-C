// @ts-nocheck
import { marked } from 'marked';

export async function generateExecutiveReportPDF(auditResult: any, dashboardPayload: any) {
  if (!auditResult || !dashboardPayload) {
    alert("No hay datos de auditoría disponibles para generar el reporte.");
    return;
  }

  // Adaptación de los datos al índice ISA (Índice de Superficie de Ataque)
  const hallazgos = auditResult.hallazgos || dashboardPayload.tabla_hallazgos || [];
  const A = dashboardPayload.contrato ? 1 : 0; // Contratos/Librerías
  const S = auditResult.funciones_analizadas || 5; // Funciones/Servicios analizados
  const V = hallazgos.length;
  
  const isaScore = (A * 0.3) + (S * 0.3) + (V * 0.4);
  const isaLevel = isaScore <= 20 ? 'Bajo' : isaScore <= 50 ? 'Medio' : isaScore <= 80 ? 'Alto' : 'Crítico';

  const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');

  // Construcción del documento en Markdown siguiendo los cánones solicitados
  const markdownContent = `
<div style="text-align: center; font-weight: bold; margin-bottom: 2rem; font-size: 14pt;">
UNIVERSIDAD MAYOR DE SAN ANDRES<br>
FACULTAD DE CIENCIAS PURAS Y NATURALES<br>
CARRERA DE INFORMÁTICA
</div>

<br>

**INFORME**  
**FECHA:** ${dateStr}

Agente 1 - Orchestrator (Gestión y Parsing)  
Agente 2 - Scanner (Reconocimiento Perimetral)  
Agente 3 - Hacker (Explotación de Vulnerabilidades)  
Agente 4 - Economist (Evaluación de Riesgo Financiero)  
Agente 5 - Compliance (Normativas ISO/NIST)

<br>

**PARA:** Cesar Roberto Cuenca Díaz  
Docente SEG-372 SEGURIDAD EN REDES II

---

### I. RESUMEN EJECUTIVO 
El informe analiza la superficie de ataque pública y las vulnerabilidades del contrato inteligente **${dashboardPayload.contrato?.name || 'Smart Contract'}** mediante técnicas de auditoría estática y dinámica. Los resultados evidencian una infraestructura expuesta a la red blockchain compuesta principalmente por métodos y variables públicas. 

Sin embargo, se identificó la exposición de funciones críticas y flujos de valor que podrían representar riesgos potenciales de seguridad. 

Los agentes especializados (Scanner, Hacker y Economist) proporcionaron la mayor visibilidad para el mapeo de la infraestructura del contrato, detectando vectores clave en su arquitectura.

### II. ANTECEDENTES
El presente análisis se originó a partir de la necesidad de conocer la postura de seguridad perimetral y la exposición pública de la lógica del contrato asociado. Se realizó un escaneo del código fuente para identificar posibles vectores de ataque, funciones mal configuradas o expuestas inadvertidamente, empleando herramientas de reconocimiento algorítmico y agentes LLM para recopilar información durante el periodo de evaluación.

### III. OBJETIVO GENERAL 
Identificar y evaluar la superficie de ataque pública del contrato inteligente mediante el uso de herramientas de reconocimiento y agentes OSINT simulados, para determinar el nivel de exposición de sus activos digitales y servicios tecnológicos.

### IV. OBJETIVOS ESPECIFICOS 
1. Mapear la infraestructura del contrato y descubrir las funciones expuestas a los usuarios.
2. Enumerar los métodos, modificadores y variables actualmente expuestas a la blockchain.
3. Identificar las lógicas vulnerables y patrones de diseño utilizados en el despliegue del contrato.
4. Comparar la eficacia de diferentes agentes de IA en la detección de los activos y riesgos.

### V. ANALISIS Y DESARROLLO 
Para cumplir con los objetivos planteados, se ejecutó una metodología de escaneo utilizando agentes de seguridad especializados. A continuación, se detalla la información recolectada de los hallazgos:

${hallazgos.length > 0 ? hallazgos.map((h: any) => `**${h.titulo}**\n- **Severidad:** ${h.severidad.toUpperCase()}\n- **Categoría ISO 27001:** ${h.control_iso27001 || 'General'}\n- **Descripción:** ${h.descripcion}\n`).join('\n') : 'No se detectaron vulnerabilidades críticas durante la fase de análisis activo.'}

### VI. RESULTADOS OBTENIDOS 
Se ha logrado mapear con éxito la infraestructura pública del contrato. Se identificó el uso de múltiples funciones que exponen directamente a la blockchain lógicas de pagos, transferencias y actualización del estado global. 
Es de especial atención la detección de los vectores detallados previamente, los cuales ofrecen una vía directa de interacción con los fondos o el flujo del sistema.
**Security Score del Sistema:** ${dashboardPayload.kpis?.security_score || 100}/100

### VII. CONCLUSIONES 
- **Comparación de resultados entre agentes:** El Agente Hacker demostró ser la herramienta más robusta para este objetivo, brindando el nivel de detalle más profundo sobre los vectores de ataque. El Agente Economist fue fundamental para el cálculo del valor en riesgo. El Agente Compliance aportó un excelente contexto a nivel de marcos normativos (NIST/ISO).
- **Funciones mayormente expuestas:** Los servicios con mayor exposición son las funciones públicas sin el modificador \`onlyOwner\` y los métodos que manejan transferencias de fondos.
- **Análisis de Cantidad Vs Calidad:** Se observó que una menor cantidad de líneas de código exponen una gran cantidad de flujos críticos. La calidad de los hallazgos es alta, ya que permite perfilar exactamente la pila tecnológica y los riesgos de la organización.

### VIII. RECOMENDACIONES 
- **Cerrar accesos críticos:** Restringir inmediatamente el acceso público a las funciones de administración y variables de estado sensibles. El acceso a estos servicios debe realizarse exclusivamente a través de controles de acceso (Access Control).
- **Revisar plataformas expuestas:** Auditar el estado de actualización de la versión de \`pragma solidity\` y las librerías base (ej. OpenZeppelin), ya que son objetivos comunes para la explotación de vulnerabilidades.
- **Implementar segmentación:** Evaluar la posibilidad de aislar componentes lógicos (proxy y lógica de implementación) apoyándose en la infraestructura de contratos actualizables si la arquitectura lo permite.

<div style="page-break-before: always;"></div>

### ANEXO A
**ÍNDICE DE SUPERFICIE DE ATAQUE (ISA)**

Se calcula un indicador cuantitativo denominado Índice de Superficie de Ataque (ISA), el cual permite estimar el nivel de exposición de una organización (o contrato) en la red a partir de la información recopilada mediante herramientas de reconocimiento. 

Este índice considera tres factores principales:
- Activos expuestos
- Servicios publicados
- Vulnerabilidades identificadas 

El objetivo del índice es medir el nivel de exposición tecnológica y permitir comparar resultados. 

**1. Variables del Índice**
Se debe identificar las siguientes variables:
**A** = Número de activos expuestos (Contratos, librerías, dependencias)
**S** = Número de servicios expuestos (Funciones públicas y externas analizadas)
**V** = Número de vulnerabilidades detectadas (Hallazgos, CVE equivalentes)

**2. Ecuación del Índice**
Se aplicará la siguiente ecuación:
ISA = (A × 0.3) + (S × 0.3) + (V × 0.4)

Se asigna mayor peso a las vulnerabilidades debido a que representan riesgos explotables directamente.

**3. Interpretación del Índice**
- 0 – 20: Bajo
- 21 – 50: Medio
- 51 – 80: Alto
- 81 – 100: Crítico

**4. Ejemplo de cálculo para este informe**
**Variable - Cantidad**
Activos (A) = ${A}
Servicios (S) = ${S}
Vulnerabilidades (V) = ${V}

**Cálculo:**
ISA = (${A} × 0.3) + (${S} × 0.3) + (${V} × 0.4)
ISA = ${(A * 0.3).toFixed(1)} + ${(S * 0.3).toFixed(1)} + ${(V * 0.4).toFixed(1)}
**ISA = ${isaScore.toFixed(1)}**

**Resultado:** ${isaScore.toFixed(1)}
**Nivel de exposición:** ${isaLevel}
`;

  try {
    // 1. Transformamos el Markdown a HTML
    const htmlContent = await marked.parse(markdownContent);

    // 2. Creamos un contenedor con estilos canónicos (Times New Roman)
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; text-align: justify; color: #000;">
        ${htmlContent}
      </div>
    `;

    // 3. Importamos html2pdf dinámicamente para que no falle en Next.js SSR
    const html2pdf = (await import('html2pdf.js')).default;
    
    // 4. Configuramos html2pdf
    const opt = {
      margin:       15,
      filename:     `Informe_UMSA_${dashboardPayload.audit_id || 'Auditoria'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // 5. Generamos y descargamos
    html2pdf().from(wrapper).set(opt).save();

  } catch (error) {
    console.error("Error al generar el PDF:", error);
    alert("Hubo un error al generar el PDF. Revisa la consola para más detalles.");
  }
}

