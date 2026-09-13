// ============================================================
//  js/env.js — Runtime environment config for 5-Agent-Cats (browser)
//  ¡NO subir a repositorios públicos! (está en .gitignore)
// ============================================================

const ENV = {
  // ── LLM Providers ────────────────────────────────────────
  DEEPSEEK_API_KEY: '',
  CLAUDE_API_KEY: '',
  OPENAI_API_KEY: '',

  // ── IPFS (opcional) ──────────────────────────────────────
  PINATA_JWT: '',

  // ── Snowtrace (opcional) ──────────────────────────────────
  SNOWTRACE_API_KEY: '',

  // ── Configuración por defecto ─────────────────────────────
  DEFAULT_PROVIDER: 'deepseek',
  DEFAULT_DEEPSEEK_MODEL: 'deepseek-chat',   // DeepSeek V3 (más rápido)
  DEFAULT_CLAUDE_MODEL: 'claude-sonnet-4-5',
  DEFAULT_OPENAI_MODEL: 'gpt-4o-mini',

  // ── Presupuesto y modo ────────────────────────────────────
  MAX_AUDIT_BUDGET_USD: 0.10,
  CHAIN_MODE: 'simulated',
  IPFS_MODE: 'simulated',
};

export default ENV;
