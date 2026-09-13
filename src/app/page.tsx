'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useAuditContext } from '@/context/AuditContext';
import {
  readSingleFile,
  readMultipleFiles,
  fetchContractSource,
  isValidAddress,
  generateAuditId
} from '@/lib/parser';
import { ethers } from 'ethers';

export default function Home() {
  const router = useRouter();
  const { settings, apiKeys, setContractSource, setContractMeta } = useAuditContext();

  const [activeTab, setActiveTab] = useState<'single' | 'multi' | 'address'>('single');
  const [address, setAddress] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  const handleStartAudit = async () => {
    setIsStarting(true);
    setErrorMsg('');

    try {
      let source = '';
      let meta: any = { auditId: generateAuditId() };

      if (activeTab === 'single') {
        if (files.length === 0) throw new Error("Selecciona un archivo .sol");
        source = (await readSingleFile(files[0])) as string;
        meta.contractName = files[0].name.replace('.sol', '');
        meta.contractAddress = null;
        meta.network = 'N/A';
      } else if (activeTab === 'multi') {
        if (files.length === 0) throw new Error("Selecciona archivos .sol");
        source = (await readMultipleFiles(files)) as string;
        meta.contractName = 'Multi-file contract';
        meta.contractAddress = null;
        meta.network = 'N/A';
      } else if (activeTab === 'address') {
        if (!isValidAddress(address)) throw new Error("Dirección inválida");
        const fetched = await fetchContractSource(address, apiKeys.snowtrace || '');
        source = fetched.source as string;
        meta.contractName = fetched.contractName;
        meta.contractAddress = address;
        meta.network = fetched.network;
      }

      // ====== x402 PAYWALL LOGIC ======
      const paywallRes = await fetch('/api/paywall');
      if (paywallRes.status === 402) {
        const paywallData = await paywallRes.json();
        
        if (!(window as any).ethereum) {
          throw new Error("MetaMask no detectado. Para pagar la auditoría, instala una wallet Web3.");
        }

        let provider = new ethers.BrowserProvider((window as any).ethereum);
        await provider.send("eth_requestAccounts", []);
        let signer = await provider.getSigner();

        const network = await provider.getNetwork();
        // Chain ID for Fuji Testnet is 43113
        if (network.chainId !== 43113n) {
          try {
            await provider.send('wallet_switchEthereumChain', [{ chainId: '0xa869' }]);
            // Re-instantiate after network switch to avoid NETWORK_ERROR
            provider = new ethers.BrowserProvider((window as any).ethereum);
            signer = await provider.getSigner();
          } catch (switchError: any) {
            throw new Error("Por favor cambia a la red Avalanche Fuji Testnet en tu wallet para pagar.");
          }
        }

        setPaymentStatus('Esperando confirmación en MetaMask...');
        
        // Encode the function call payForAudit(string auditId)
        const iface = new ethers.Interface([
          "function payForAudit(string memory auditId) public payable"
        ]);
        const data = iface.encodeFunctionData("payForAudit", [meta.auditId || "unknown"]);

        const tx = await signer.sendTransaction({
          to: paywallData.contractAddress,
          value: ethers.parseEther(paywallData.price),
          data: data
        });

        setPaymentStatus('Confirmando transacción en Avalanche...');
        
        const receipt = await tx.wait();

        const verifyRes = await fetch('/api/paywall', {
          headers: {
            'Authorization': `L402 ${tx.hash}`
          }
        });

        if (!verifyRes.ok) {
          throw new Error("La transacción fue enviada pero el servidor no pudo verificarla.");
        }
      }
      // ===================================

      setContractSource(source);
      setContractMeta(meta);
      router.push('/audit');
    } catch (err: any) {
      setErrorMsg(err.message || "Error desconocido");
    } finally {
      setIsStarting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (activeTab === 'single') {
        setFiles([selected[0]]);
      } else {
        setFiles(prev => [...prev, ...selected.filter(f => f.name.endsWith('.sol'))]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col font-sans">
      {/* Mesh Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/15 blur-[120px] rounded-full"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 font-extrabold text-xl tracking-tight">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-md" />
          <span className="text-foreground">5-Agent-Cats</span>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" className="font-semibold text-primary">
            ⚙️ Configuración
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm font-semibold text-primary mb-6 animate-in fade-in slide-in-from-bottom-4">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
          Sistema Multi-Agente · Avalanche · ISO 27001
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight max-w-3xl mb-5 animate-in fade-in slide-in-from-bottom-5">
          Auditoría de Smart Contracts <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            Potenciada por 5 Agentes IA
          </span>
        </h1>

        <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed mb-10 animate-in fade-in slide-in-from-bottom-6">
          Análisis de seguridad profesional bajo estándares ISO/IEC 27001 y NIST CSF. Presupuesto de tokens controlado y liquidación on-chain en Avalanche.
        </p>

        {/* Audit Form Card */}
        <div className="w-full max-w-3xl bg-card border border-border shadow-2xl rounded-2xl p-6 md:p-8 text-left animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Nueva Auditoría</h2>
            <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-md">
              Presupuesto: <span className="text-primary font-bold">$0.10</span>
            </span>
          </div>

          {/* Agent Pipeline Visual */}
          <div className="flex items-center gap-2 p-4 bg-background border border-border/50 rounded-xl mb-8 overflow-x-auto">
            <div className="flex flex-col items-center gap-1 min-w-[60px]">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-lg">🔍</div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Escáner</span>
            </div>
            <div className="text-muted-foreground">→</div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-row items-center gap-2 min-w-[80px]">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm">💰</div>
                <span className="text-[9px] font-bold uppercase text-muted-foreground">Economista</span>
              </div>
              <div className="flex flex-row items-center gap-2 min-w-[80px]">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm">📋</div>
                <span className="text-[9px] font-bold uppercase text-muted-foreground">Cumplimiento</span>
              </div>
            </div>
            <div className="text-muted-foreground">→</div>
            <div className="flex flex-col items-center gap-1 min-w-[60px]">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-lg">🎯</div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Hacker</span>
            </div>
            <div className="text-muted-foreground">→</div>
            <div className="flex flex-col items-center gap-1 min-w-[60px]">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-lg">🧠</div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Manager</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border mb-6">
            <button
              className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'single' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              onClick={() => setActiveTab('single')}
            >
              📄 Archivo .sol
            </button>
            <button
              className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'multi' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              onClick={() => setActiveTab('multi')}
            >
              📁 Múltiples .sol
            </button>
            <button
              className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'address' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              onClick={() => setActiveTab('address')}
            >
              🔗 Address Avalanche
            </button>
          </div>

          {/* Content */}
          <div className="min-h-[160px] flex flex-col justify-center">
            {activeTab === 'single' && (
              <label className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-background block">
                <input type="file" className="hidden" accept=".sol" onChange={handleFileChange} />
                <div className="text-4xl mb-3">📄</div>
                <h3 className="text-foreground font-semibold mb-1">
                  {files.length > 0 ? files[0].name : "Arrastra tu contrato aquí"}
                </h3>
                <p className="text-sm text-muted-foreground">O haz clic para seleccionar un archivo <strong>.sol</strong></p>
              </label>
            )}

            {activeTab === 'multi' && (
              <label className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-background block">
                <input type="file" className="hidden" accept=".sol" multiple onChange={handleFileChange} />
                <div className="text-4xl mb-3">📁</div>
                <h3 className="text-foreground font-semibold mb-1">
                  {files.length > 0 ? `${files.length} archivos seleccionados` : "Arrastra múltiples contratos"}
                </h3>
                <p className="text-sm text-muted-foreground">Selecciona varios archivos <strong>.sol</strong> (interfaces, contrato principal)</p>
              </label>
            )}

            {activeTab === 'address' && (
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Dirección del contrato (Avalanche C-Chain)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    🔗
                  </div>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">El contrato debe estar verificado en Snowtrace para obtener el código fuente.</p>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm font-semibold rounded-md text-center">
              {errorMsg}
            </div>
          )}

          <div className="mt-6">
            <Button
              size="lg"
              className="w-full text-base h-14 bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-lg hover:shadow-accent/25 transition-all"
              onClick={handleStartAudit}
              disabled={isStarting}
            >
              {isStarting ? (paymentStatus || "⏳ Preparando...") : "🚀 Iniciar Auditoría (0.001 AVAX)"}
            </Button>
          </div>
        </div>

      </main>
    </div>
  );
}
