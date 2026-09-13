'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useAuditContext } from '@/context/AuditContext';
import { runAuditPipeline, onAuditEvent } from '@/lib/orchestrator';

export default function Audit() {
  const router = useRouter();
  const { contractSource, contractMeta } = useAuditContext();
  const [pipelineStatus, setPipelineStatus] = useState<any[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    if (!contractSource || !contractMeta) {
      router.push('/');
      return;
    }

    started.current = true;

    onAuditEvent('agent:progress', (data: any) => {
      setPipelineStatus(prev => [...prev, `[${data.agent}] ${data.status}`]);
    });

    onAuditEvent('agent:done', (data: any) => {
      setPipelineStatus(prev => [...prev, `[${data.agent}] Completado (Costo: $${data.costUSD?.toFixed(4) || 0})`]);
    });

    onAuditEvent('pipeline:complete', (data: any) => {
      setIsFinished(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    });

    runAuditPipeline(contractSource, contractMeta).catch(err => {
      console.error(err);
      setPipelineStatus(prev => [...prev, `ERROR: ${err.message}`]);
    });
  }, [contractSource, contractMeta, router]);

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 bg-background border-b border-border">
        <div className="flex items-center gap-3 font-extrabold text-xl">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm">
            🛡️
          </div>
          <span className="text-foreground">5-Agent-Cats</span>
        </div>
        <Button variant="outline" className="font-semibold" onClick={() => router.push('/')}>Cancelar Auditoría</Button>
      </nav>

      <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto flex flex-col items-center justify-center text-center mt-8 w-full">
        {!isFinished && (
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <h1 className="text-3xl font-black text-foreground mb-4">
          {isFinished ? "Auditoría Completada" : "Ejecutando Pipeline..."}
        </h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-lg">
          {isFinished ? "Redirigiendo al dashboard..." : "Los agentes de IA están analizando el smart contract. Por favor espera."}
        </p>

        <div className="w-full max-w-2xl bg-card border border-border p-6 rounded-2xl text-left shadow-sm h-96 overflow-y-auto font-mono text-sm">
          <div className="flex flex-col gap-2">
            {pipelineStatus.map((status, idx) => (
              <div key={idx} className="flex items-start gap-2 border-b border-border/40 pb-2">
                <span className="text-primary mt-1">❯</span>
                <span className="text-muted-foreground">{status}</span>
              </div>
            ))}
            {pipelineStatus.length === 0 && (
              <div className="text-muted-foreground italic">Iniciando agentes...</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
