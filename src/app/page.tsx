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

      </nav>

      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-auto">

          {/* Bento Box 1: Title & Description (Spans 2 cols) */}
          <div className="md:col-span-2 bg-card border border-border shadow-xl shadow-primary/5 rounded-3xl p-8 md:p-12 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-500">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">
              Auditoría de Smart Contracts <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                5 Agentes IA
              </span>
            </h1>
          </div>

          {/* Bento Box 2: Network & Pricing (Spans 1 col) */}
          <div className="bg-gradient-to-br from-primary to-accent text-white shadow-xl shadow-primary/20 rounded-3xl p-8 flex flex-col items-start justify-between animate-in fade-in zoom-in-95 duration-500 delay-75">

            <div>
              <h3 className="text-2xl font-black mb-2">Avalanche Fuji</h3>
              <p className="text-white/90 font-semibold mb-6 text-sm">On-Chain (x402)</p>
              <div className="inline-flex items-center gap-2 bg-white/20 px-5 py-2.5 rounded-2xl text-xl font-black backdrop-blur-md shadow-sm">
                0.001 AVAX
              </div>
            </div>
          </div>

          {/* Bento Box 3: Form (Spans 3 cols) */}
          <div className="md:col-span-3 bg-card border border-border shadow-xl shadow-primary/5 rounded-3xl p-8 animate-in fade-in zoom-in-95 duration-500 delay-150">
            {/* Tabs */}
            <div className="flex border-b border-border mb-8">
              <button
                className={`flex-1 pb-4 text-base font-bold border-b-4 transition-colors ${activeTab === 'single' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('single')}
              >
                Archivo .sol
              </button>
              <button
                className={`flex-1 pb-4 text-base font-bold border-b-4 transition-colors ${activeTab === 'multi' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('multi')}
              >
                Múltiples .sol
              </button>
              <button
                className={`flex-1 pb-4 text-base font-bold border-b-4 transition-colors ${activeTab === 'address' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('address')}
              >
                Address Avalanche
              </button>
            </div>

            {/* Content */}
            <div className="min-h-[200px] flex flex-col justify-center mb-8">
              {activeTab === 'single' && (
                <label className="border-3 border-dashed border-primary/30 rounded-3xl p-10 text-center hover:border-primary/60 hover:bg-primary/5 transition-all cursor-pointer bg-background block">
                  <input type="file" className="hidden" accept=".sol" onChange={handleFileChange} />
                  <div className="text-5xl mb-4">📄</div>
                  <h3 className="text-foreground font-bold text-xl mb-2">
                    {files.length > 0 ? files[0].name : "Arrastra tu contrato aquí"}
                  </h3>
                  <p className="text-base text-muted-foreground font-medium">O haz clic para seleccionar un archivo <strong>.sol</strong></p>
                </label>
              )}

              {activeTab === 'multi' && (
                <label className="border-3 border-dashed border-primary/30 rounded-3xl p-10 text-center hover:border-primary/60 hover:bg-primary/5 transition-all cursor-pointer bg-background block">
                  <input type="file" className="hidden" accept=".sol" multiple onChange={handleFileChange} />
                  <div className="text-5xl mb-4">📁</div>
                  <h3 className="text-foreground font-bold text-xl mb-2">
                    {files.length > 0 ? `${files.length} archivos seleccionados` : "Arrastra múltiples contratos"}
                  </h3>
                  <p className="text-base text-muted-foreground font-medium">Selecciona varios archivos <strong>.sol</strong> (interfaces, contrato principal)</p>
                </label>
              )}

              {activeTab === 'address' && (
                <div className="max-w-2xl mx-auto w-full">
                  <label className="block text-base font-bold text-foreground mb-3">Dirección del contrato (Avalanche C-Chain)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-xl">
                      🔗
                    </div>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 border-2 border-primary/20 rounded-2xl bg-background text-foreground font-medium text-lg focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all outline-none shadow-inner"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground font-semibold mt-3 text-center">El contrato debe estar verificado en Snowtrace para obtener el código fuente.</p>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-destructive/10 text-destructive text-base font-bold rounded-2xl text-center border border-destructive/20">
                {errorMsg}
              </div>
            )}

            <Button
              size="lg"
              className="w-full text-lg h-16 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-1"
              onClick={handleStartAudit}
              disabled={isStarting}
            >
              {isStarting ? (paymentStatus || "⏳ Preparando...") : "Iniciar Auditoría por 0.001 AVAX"}
            </Button>
          </div>

        </div>
      </main>
    </div>
  );
}
