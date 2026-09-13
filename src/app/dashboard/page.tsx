'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { getDashboardPayload, getAuditResult } from '@/lib/config';
import { generateExecutiveReportPDF } from '@/lib/pdfGenerator';

export default function Dashboard() {
  const router = useRouter();
  const [payload, setPayload] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dPayload = getDashboardPayload();
    const aResult = getAuditResult();

    if (!dPayload || !aResult) {
      // router.push('/'); // Comentado para desarrollo
    } else {
      setPayload(dPayload);
      setResult(aResult);
    }
    setLoading(false);
  }, [router]);

  const handleDownloadPDF = () => {
    generateExecutiveReportPDF(result, payload);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center font-bold text-lg">Cargando Dashboard...</div>;

  const score = payload?.kpis?.security_score || 0;
  const kpis = payload?.kpis || { hallazgos_criticos: 0, hallazgos_altos: 0, hallazgos_medios: 0, hallazgos_bajos: 0 };
  const findings = payload?.tabla_hallazgos || [];

  return (
    <div className="min-h-screen bg-background font-sans">
      <nav className="flex items-center justify-between px-6 py-4 bg-background border-b border-border">
        <div className="flex items-center gap-3 font-extrabold text-xl">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm">
            🛡️
          </div>
          <span className="text-foreground">5-Agent-Cats</span>
        </div>
        <Button variant="outline" className="font-semibold" onClick={() => router.push('/')}>Volver</Button>
      </nav>

      <main className="p-6 md:p-10 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-foreground mb-2">Dashboard de Seguridad</h1>
            <p className="text-muted-foreground">ID: {payload?.audit_id || 'N/A'}</p>
          </div>
          <Button
            className="bg-accent text-accent-foreground font-bold hover:bg-accent/90"
            onClick={handleDownloadPDF}
            disabled={!payload}
          >
            Descargar Reporte PDF
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-muted-foreground text-xs uppercase font-bold tracking-wider mb-2">Security Score</h3>
            <div className={`text-5xl font-black ${score >= 70 ? 'text-emerald-500' : score >= 40 ? 'text-amber-500' : 'text-destructive'}`}>
              {score}<span className="text-lg text-muted-foreground">/100</span>
            </div>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-muted-foreground text-xs uppercase font-bold tracking-wider mb-2">Críticos</h3>
            <div className="text-5xl font-black text-destructive">{kpis.hallazgos_criticos}</div>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-muted-foreground text-xs uppercase font-bold tracking-wider mb-2">Medios</h3>
            <div className="text-5xl font-black text-amber-500">{kpis.hallazgos_medios}</div>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-muted-foreground text-xs uppercase font-bold tracking-wider mb-2">Bajos</h3>
            <div className="text-5xl font-black text-emerald-500">{kpis.hallazgos_bajos}</div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-foreground mb-4">Últimos Hallazgos</h2>
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary text-secondary-foreground text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-bold">Gravedad</th>
                <th className="px-6 py-4 font-bold">Tipo</th>
                <th className="px-6 py-4 font-bold">Descripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {findings.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">No se encontraron vulnerabilidades.</td>
                </tr>
              ) : (
                findings.map((f: any, idx: number) => (
                  <tr key={idx} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded font-bold text-xs ${f.severidad === 'critico' ? 'bg-destructive/10 text-destructive' :
                          f.severidad === 'alto' ? 'bg-amber-600/10 text-amber-600' :
                            f.severidad === 'medio' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-emerald-500/10 text-emerald-500'
                        }`}>
                        {f.severidad.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">{f.titulo}</td>
                    <td className="px-6 py-4 text-muted-foreground">{f.descripcion?.slice(0, 100)}...</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
