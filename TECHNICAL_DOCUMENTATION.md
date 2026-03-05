# SuiLoop — Documentación Técnica Exhaustiva

> **Versión**: 2.0.0 (Kernel 0.0.7-Neural)  
> **Red**: Sui Testnet  
> **Package ID**: `0x945163568d75adf1cb3c1f7d1a197e4a903fd6ba3f807a4421cfa9f563f0dcb0`  
> **Última actualización**: Marzo 2026  

---

## 📌 ÍNDICE

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Smart Contracts (Move)](#smart-contracts-move)
4. [Agent Daemon (packages/agent)](#agent-daemon)
5. [Frontend Web (packages/web)](#frontend-web)
6. [Economía de Agentes](#economía-de-agentes)
7. [Base de Datos (Supabase)](#base-de-datos-supabase)
8. [Tabla Real vs Simulado](#tabla-real-vs-simulado)
9. [Flujos de Ejecución](#flujos-de-ejecución)
10. [Servicios del Agent Daemon](#servicios-del-agent-daemon)
11. [Integraciones Externas](#integraciones-externas)
12. [Scripts de Infraestructura](#scripts-de-infraestructura)
13. [SDKs](#sdks)
14. [Estado del Proyecto](#estado-del-proyecto)

---

## 1. Visión General

SuiLoop es una plataforma de **agentes DeFi autónomos** construida sobre Sui Network. Su propuesta de valor es permitir que tanto humanos como máquinas puedan desplegar estrategias de trading (Flash Loans, arbitraje, yield farming) de forma **atómica** y **no custodial**, usando el patrón "Hot Potato" de Move.

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────────┐
│                        SuiLoop Ecosystem                        │
├─────────────────┬────────────────────┬──────────────────────────┤
│  Smart Contracts│   Agent Daemon     │    Frontend Web          │
│  (Move / Sui)   │   (Node.js + TS)   │    (Next.js 14)          │
│                 │                    │                          │
│ atomic_engine   │  server.ts (API)   │  Dashboard               │
│ agent_registry  │  autonomousLoop.ts │  Leaderboard             │
│ strategy_mkt    │  skillManager.ts   │  Strategy Builder        │
│ interfaces/     │  loopHub.ts        │  Agents Page             │
│   scallop       │  llmService.ts     │  Marketplace             │
│   cetus         │  memoryService.ts  │  Plugins                 │
└─────────────────┴────────────────────┴──────────────────────────┘
                            │
                    ┌───────┴────────┐
                    │   Supabase     │
                    │  (PostgreSQL)  │
                    │  + Realtime    │
                    └────────────────┘
```

---

## 2. Arquitectura del Sistema

### Monorepo structure

```
Sui-Loop/
├── packages/
│   ├── agent/          # Daemon TypeScript (API + Autonomous Loop)
│   ├── contracts/      # Smart Contracts Move
│   ├── web/            # Frontend Next.js 14
│   ├── sdk/            # TypeScript SDK (npm: @suiloop/sdk)
│   ├── sdk-python/     # Python SDK (pip: suiloop)
│   ├── cli/            # CLI Tool (suiloop CLI)
│   ├── desktop/        # Desktop App (Electron)
│   └── mcp/            # MCP Server (AI Tool)
├── scripts/            # Utilidades de infraestructura
├── docs/               # Documentación adicional
├── SUPABASE_SCHEMA.sql # Schema de base de datos
└── *.key               # Keypairs de agentes (~50 wallets)
```

### Stack tecnológico

| Capa | Tecnología | Estado |
|------|-----------|--------|
| Blockchain | Sui Network (testnet) | ✅ Real |
| Smart Contracts | Move Language | ✅ Real (desplegados) |
| Agent Runtime | ElizaOS + Express.js | ✅ Real |
| LLM | OpenAI GPT-4o (con fallback a Claude, Gemini, Grok) | ✅ Real (si OPENAI_API_KEY configurado) |
| Base de Datos | Supabase (PostgreSQL + Realtime) | ✅ Real |
| Almacenamiento Descentralizado | Walrus Testnet | ✅ Real (con fallback local) |
| Frontend | Next.js 14 + TailwindCSS | ✅ Real |
| 3D UI | Three.js / React Three Fiber | ✅ Real |
| Indexer | Custom Sui Event Indexer | ✅ Real |

---

## 3. Smart Contracts (Move)

**Package desplegado en Testnet**: `0x945163568d75adf1cb3c1f7d1a197e4a903fd6ba3f807a4421cfa9f563f0dcb0`

### 3.1 `atomic_engine.move` — Motor de Flash Loans

**Archivo**: `packages/contracts/sources/atomic_engine.move`  
**Estado**: ✅ REAL — Desplegado y funcional en Testnet

#### Structs principales

| Struct | Descripción | Estado |
|--------|-------------|--------|
| `Vault<Asset>` | Safe/caja fuerte no custodial del usuario. El agente NO puede retirar, solo usar vía funciones whitelisteadas | ✅ Real |
| `AgentCap` | Capability que permite al hot wallet ejecutar estrategias sin poder retirar fondos | ✅ Real |
| `OwnerCap` | Capability full-control del cold wallet del usuario | ✅ Real |
| `LoopReceipt` | "Hot Potato" — garantiza el repago del flash loan. No se puede descartar sin repagar | ✅ Real |
| `MockPool<Base, Quote>` | Pool de liquidez simulada para testnet (en lugar de DeepBook real) | ⚠️ Simulado |

#### Funciones públicas

| Función | Acción | Real/Simulado |
|---------|--------|---------------|
| `create_vault<Asset>()` | Crea una bóveda no custodial. Emite `OwnerCap` al usuario | ✅ Real |
| `deposit<Asset>()` | Deposita fondos en la bóveda | ✅ Real |
| `withdraw<Asset>()` | Retira fondos (requiere `OwnerCap`) | ✅ Real |
| `create_agent_cap<Asset>()` | Minta `AgentCap` al agente. **Requiere pago de `DEPLOYMENT_FEE = 0.1 SUI`** | ✅ Real |
| `destroy_agent_cap()` | Revoca permisos del agente (burn del cap) | ✅ Real |
| `destroy_vault<Asset>()` | Destruye la bóveda y retorna fondos al owner | ✅ Real |
| `execute_loop<Base, Quote>()` | **V1**: Flash loan clásico con validación de profit | ✅ Real (en testnet) |
| `execute_strategy_secure<Base, Quote>()` | **V2**: Flash loan con Vault + protección Hot Potato | ✅ Real (estrategia demo) |
| `execute_strategy_mainnet<Base, Quote>()` | **V3**: Integración con Scallop + Cetus real | ⚠️ Demo — tiene `abort 0` al final (compilable pero no ejecutable end-to-end) |
| `borrow_flash_loan<Base, Quote>()` | Core: Emite `LoopReceipt` y transfiere liquidez | ✅ Real |
| `repay_flash_loan<Base, Quote>()` | Core: Valida repago del Hot Potato | ✅ Real |
| `create_pool<Base, Quote>()` | Crea MockPool (solo testnet) | ✅ Real (testnet) |
| `add_liquidity<Base, Quote>()` | Agrega liquidez al MockPool | ✅ Real (testnet) |

#### Economía del contrato

- **`DEPLOYMENT_FEE`**: `100_000_000 MIST = 0.1 SUI` (equivalente a ~$0.09 USD a precio actual)
  - *Nota en código*: "Target ~$4.50 USD asumiendo 1 SUI ~ $0.90 USD", actualmente el fee es 0.1 SUI por simplificación testnet
- **Fee de Flash Loan**: `30 BPS = 0.3%` del monto prestado
- **`TREASURY`**: Dirección hardcoded para recibir fees de deployment: `0x7b8f...7777` (placeholder, no funcional en mainnet aún)
- **Eventos emitidos**: `LoopExecuted`, `FlashLoanInitiated`, `FlashLoanRepaid`

```
📊 FLUJO DE REVENUE TEÓRICO:
  Cada AgentCap creada → 0.1 SUI → TREASURY
  Cada Flash Loan → 0.3% fee → queda en el Pool
```

---

### 3.2 `agent_registry.move` — Registro On-Chain de Agentes

**Estado**: ✅ REAL — Desplegado. El indexer lo lee activamente.

**Registry ID**: `0xcbb6d114644b9573c76c1eee3f94ad4b8874273e7691f5c46d24add925b47e30`

#### Structs

| Struct | Descripción |
|--------|-------------|
| `Registry` | Tabla maestra con todos los records de agentes |
| `AgentRecord` | Track de: `reputation_score` (ELO), `successful_trades`, `failed_trades`, `total_volume`, `created_at` |
| `AdminCap` | Cap exclusivo del deployer para actualizar reputación |

#### Funciones

| Función | Descripción | Quién la llama |
|---------|-------------|----------------|
| `register_agent()` | Registra un agente con ELO base de 1000 | Agente/usuario |
| `publish_signal()` | Emite `SignalPublished` event con datos binarios (señal de trading) | Agent Daemon (en cada ejecución de strategy) |
| `update_reputation()` | Actualiza ELO `+10` (éxito) o `-5` (fallo). Requiere `AdminCap` | Solo ADMIN |

#### ELO System

```
Base ELO: 1000
Trade Exitoso: +10 puntos
Trade Fallido: -5 puntos (floor en 0)
```

> ⚠️ **Limitación actual**: `update_reputation()` requiere `AdminCap`, lo que significa que el ELO solo puede actualizarse por el deployer del contrato, no automáticamente. En producción se usaría un oracle verificado o zkProof.

---

### 3.3 `strategy_marketplace.move`

**Estado**: ✅ Real — Compilado y desplegado como parte del package. Funcionalidad de marketplace on-chain básica.

```
Funciones: publicar estrategias, listarlas, acceder a ellas como NFTs de licencia
```

---

### 3.4 `interfaces/` — Adaptadores de Protocolos Reales

| Archivo | Protocolo | Estado |
|---------|-----------|--------|
| `scallop_interface.move` | Scallop Lending | ⚠️ Interface mock — define ABIs pero no conecta al contrato real de Scallop en testnet |
| `cetus_interface.move` | Cetus CLMM DEX | ⚠️ Interface mock — define ABIs pero no conecta al pool real de Cetus |

> **Nota técnica**: Para conectar con los contratos reales de Scallop y Cetus se necesitaría integrar sus Package IDs oficiales y hacer dependency injection correcta en `Move.toml`. La versión actual demuestra la arquitectura pero no ejecuta swaps reales en esos protocolos.

---

## 4. Agent Daemon

**Directorio**: `packages/agent/`  
**Runtime**: Node.js 20 + TypeScript (tsx)  
**Puerto**: 3001  
**Framework**: Express.js + HTTP Server + WebSockets  

### 4.1 `server.ts` — API Principal (1165 líneas)

El servidor central. Inicializa todos los servicios y expone los endpoints REST.

#### Endpoints REST

| Método | Ruta | Auth | Descripción | Estado |
|--------|------|------|-------------|--------|
| GET | `/health` | ❌ | Health check básico | ✅ Real |
| GET | `/api/health` | ❌ | Gateway heartbeat completo | ✅ Real |
| GET | `/api/doctor` | 🔒 Admin | Health check profundo del sistema | ✅ Real |
| GET | `/api/info` | ❌ | Info del servidor | ✅ Real |
| POST | `/api/auth/token` | ❌ | Genera JWT con wallet address | ✅ Real (sin verificar firma aún) |
| POST | `/api/auth/keys` | 🔒 Auth | Genera API Key | ✅ Real |
| GET | `/api/auth/keys` | 🔒 Auth | Lista API Keys | ✅ Real |
| DELETE | `/api/auth/keys/:id` | 🔒 Auth | Revoca API Key | ✅ Real |
| POST | `/api/execute-demo` | ❌ | Ejecuta estrategia demo (sin auth) | ✅ Real + Fallback simulado |
| POST | `/api/execute` | 🔒 Auth | Ejecuta estrategia (autenticado) | ✅ Real |
| POST | `/api/webhooks` | 🔒 Auth | Registra webhook | ✅ Real |
| GET | `/api/webhooks` | 🔒 Auth | Lista webhooks | ✅ Real |
| DELETE | `/api/webhooks/:id` | 🔒 Auth | Elimina webhook | ✅ Real |
| POST | `/api/webhooks/:id/test` | 🔒 Auth | Prueba webhook | ✅ Real |
| POST | `/api/subscriptions` | 🔒 Auth | Crea suscripción WebSocket | ✅ Real |
| GET | `/api/subscriptions` | 🔒 Auth | Lista suscripciones | ✅ Real |
| POST | `/api/loop/start` | 🔒 Auth | Inicia Autonomous Loop | ✅ Real |
| POST | `/api/loop/stop` | 🔒 Auth | Detiene Autonomous Loop | ✅ Real |
| GET | `/api/loop/status` | 🔒 Auth | Estado del loop | ✅ Real |
| GET | `/api/loop/market` | 🔒 Auth | Estado del mercado | ✅ Real |
| GET | `/api/features/*` | Mixto | Endpoints de features (skills, memory, LLM) | ✅ Real |

#### Lógica de Ejecución (POST /api/execute-demo y /api/execute)

```
1. Si strategy = "skill:action" → SkillManager.executeAction()
2. Si strategy = "flash-loan-executor" → executeMainnetStrategy handler
3. Fallback → executeAtomicLeverage (PTB builder)
```

---

### 4.2 `autonomousLoop.ts` — Market Scanner Autónomo

**Estado**: ✅ Real — corre en background constantemente

Escanea el mercado cada **10 segundos** y hace análisis profundo cada **60 segundos** (cron).

#### Datos de mercado que obtiene

| Dato | Fuente | Real/Simulado |
|------|--------|---------------|
| SUI Price | Pyth Network (`hermes.pyth.network`) | ✅ Real (con fallback) |
| Gas Price | Sui RPC `getReferenceGasPrice()` | ✅ Real |
| Total Staked SUI | `getLatestSuiSystemState()` como proxy de liquidez | ✅ Real |
| Scallop APY | `api.scallop.io/market` | ⚠️ Real en estructura, valores hardcodeados si falla |
| Navi APY | Calculado deterministicamente desde precio SUI | ⚠️ Aproximación real |
| Cetus Pool Depth | Valor inicial hardcodeado (500,000) | ⚠️ Simulado |

#### Señales emitidas (WebSocket)

| Signal Type | Trigger | Descripción |
|-------------|---------|-------------|
| `arbitrage_opportunity` | Discrepancia de precio > `minProfitPercentage` | Detectada con LLM validation |
| `flash_loan_opportunity` | Spread Borrow/Supply > 2% en Scallop o Navi | Con LLM validation |
| `liquidity_change` | DeepBook liquidity < 800,000 SUI | Basado en staking total |
| `gas_spike` | Gas > `maxGasPrice` (5000 MIST default) | Alerta crítica |
| `price_deviation` | Risk Level > 0.7 en deep analysis | Análisis de salud del mercado |

#### LLM Integration en el loop

```typescript
// El loop consulta al LLM para validar oportunidades
const response = await llm.chat({
    messages: [
        { role: 'system', content: 'You are an autonomous DeFi risk validator.' },
        { role: 'user', content: `Arbitrage spread: ${spread}%. Execute?` }
    ],
    maxTokens: 10  // Solo true/false
});
// Si LLM dice false: -20 confianza
// Si LLM dice true: +5 confianza
```

---

### 4.3 `actions/executeAtomicLeverage.ts` — Executor Principal (381 líneas)

**Estado**: ✅ REAL — Construye y envía PTBs reales a Sui Testnet

Flujo completo:

```
1. Validar SUI_PRIVATE_KEY existe
2. Decodificar keypair (suiprivkey bech32 o base64)
3. Consultar Scallop API para datos de mercado
4. Consultar Cetus para verificar pool
5. Check DeepBook V3 status (real RPC call)
6. Construir PTB:
   a. splitCoins para fees
   b. publish_signal en agent_registry (REAL on-chain)
   c. atomic_engine::execute_loop (REAL on-chain)
7. signAndExecuteTransaction
8. Verificar resultado y emitir LoopExecuted event
```

**Para USDC**: ⚠️ Simulado — USDC vaults en testnet no tienen pool real, se genera `sim_XXXX` digest falso

**Para SUI**: ✅ Real — Transacción on-chain con hash verificable en suiscan.xyz

---

### 4.4 `actions/executeMainnetStrategy.ts` — Executor Mainnet-Ready

**Estado**: ⚠️ Parcialmente real — intenta hacer swap real con Cetus, pero con fallbacks.

---

### 4.5 `actions/executeBuilderStrategy.ts` — Strategy Builder Executor

**Estado**: ✅ Real (estructura) — ejecuta nodos del Strategy Builder del frontend

---

## 5. Frontend Web

**Directorio**: `packages/web/`  
**Framework**: Next.js 14 (App Router)  
**Styling**: TailwindCSS + Custom CSS Vars  
**Deploy**: Vercel  

### Rutas

| Ruta | Componente | Descripción | Estado |
|------|-----------|-------------|--------|
| `/` | `app/page.tsx` | Landing page con 3D orb, terminal simulada, hero | ✅ Real |
| `/dashboard` | `app/dashboard/page.tsx` | Dashboard principal con estrategias activas | ✅ Real |
| `/agents` | `app/agents/page.tsx` | Interface agents: logs en vivo, API keys, SDK | ✅ Real |
| `/leaderboard` | `app/leaderboard/page.tsx` | Leaderboard de agentes con ELO | ✅ Real (datos de Supabase) |
| `/strategies` | `app/strategies/page.tsx` | Catálogo de estrategias | ✅ Real |
| `/strategies/builder` | `app/strategies/builder/page.tsx` | Visual Strategy Builder (drag-and-drop) | ✅ Real (UI) |
| `/marketplace` | `app/marketplace/page.tsx` | Marketplace de Skills (LoopHub) | ✅ Real (data hardcodeada del backend) |
| `/plugins` | `app/plugins/page.tsx` | Sistema de plugins | ✅ Real (UI) |
| `/docs` | `app/docs/page.tsx` | Documentación in-app | ✅ Real |
| `/analytics` | `app/analytics/page.tsx` | Analytics de performance | ✅ Real (UI) |
| `/manifesto` | `app/manifesto/page.tsx` | Manifesto del proyecto | ✅ Real |

### Landing Page (`app/page.tsx`) — Elementos Reales vs Simulados

| Elemento | Real/Simulado |
|----------|---------------|
| 3D Neural Orb (Three.js) | ✅ Real |
| Terminal feed de logs | ⚠️ Simulado — array hardcodeado de mensajes que se muestran con `setInterval` |
| Stats "TVL $1.4B, 2,890 synced" | ⚠️ Simulados — hardcodeados en JSX |
| Botón "Launch Agent" → Deploy tx | ✅ Real — hace una transacción real de 1000 MIST a sí mismo para "activación" |
| Integrations Bar | ✅ Real (logos de protocolos reales) |
| Navigate to `/dashboard` | ✅ Real |

### Agents Page (`app/agents/page.tsx`) — La más compleja

| Feature | Descripción | Real/Simulado |
|---------|-------------|---------------|
| RPC Latency | Mide latencia real al nodo Sui con `performance.now()` | ✅ Real |
| "Uplink Gateway" status | Basado en latencia real | ✅ Real |
| "Targeting Engine" status | Hardcodeado como OPERATIONAL | ⚠️ Estático |
| "Secure Enclave" status | Hardcodeado como SHIELD ACTIVE | ⚠️ Estático |
| Walrus Audit status | Muestra "LIVE" después de 1800ms timeout fijo | ⚠️ Simulado (no verifica Walrus real) |
| "Blobs Committed" counter | Cuenta los logs locales como proxy | ⚠️ Aproximado |
| Neural Feed (logs tab) | Fetch a Supabase + query eventos on-chain de `SignalPublished` | ✅ Real (dual source) |
| Bar chart de actividad | Señal senoidal + noise random + spikes en nuevos logs | ⚠️ Generado algorítmicamente |
| SYNC_ACTIVE_{N}% | Counter que va de 0 a 99 cíclicamente | ⚠️ Simulado |
| API Key Manager | Genera y gestiona keys reales del agent API | ✅ Real |
| SDK code snippets | Código de ejemplo estático | ⚠️ Estático |
| "Download Audit" button | Genera JSON local con datos reales + datos fijos | ⚠️ Parcialmente real |
| `enclave_signature` en audit | `"0x8a2f...3b1c"` hardcodeado | ⚠️ Falso |

---

## 6. Economía de Agentes

### Modelo de Agentes

SuiLoop define 3 arquetipos de agentes en la UI, pero en el código son roles del mismo daemon:

| Arquetipo (UI) | Rol Real en Código | Función |
|---------------|-------------------|---------|
| **Analyst** (púrpura) | `autonomousLoop.performDeepAnalysis()` | Escanea mercado, calcula health y risk score, genera recomendaciones |
| **Executioner** (cyan) | `executeAtomicLeverage.handler()` | Construye PTBs y envía txns on-chain |
| **Validator** (verde) | LLM calls dentro del loop + Hot Potato pattern | Valida que la oportunidad sea segura antes de ejecutar |

### Swarm de Agentes (keys en raíz)

El proyecto tiene **~50 keypairs** en la raíz (`0x...key` files) — wallets de agentes individuales del swarm.

**Archivo** `scripts/traffic_gen.sh` (actualmente corriendo): Genera tráfico on-chain simulado con estos wallets.

### Sistema de Reputación (ELO)

```
ELO Base: 1000 puntos
+10 por trade exitoso (requiere AdminCap para actualizar)
-5 por trade fallido
Floor: 0
```

---

### 💰 Modelo de Negocio — Fuentes de Ingreso

El protocolo tiene **3 fuentes de revenue**, siendo el Marketplace P2P la principal:

#### Fuente 1: Licencia de Agente (`DEPLOYMENT_FEE`)

Cada vez que un usuario crea un `AgentCap` (activa su agente), paga una tarifa única al TREASURY:

```move
// atomic_engine.move
const DEPLOYMENT_FEE: u64 = 100_000_000; // 0.1 SUI (Testnet)
// Comentario en código: "Target ~$4.50 USD. Asumiendo 1 SUI ~ $0.90 USD => ~5 SUI en mainnet"
const TREASURY: address = @0x7b8f...7777; // Placeholder
```

| Red | Fee | Equivalente USD (aprox.) |
|-----|-----|--------------------------|
| Testnet | 0.1 SUI | ~$0.09 |
| Mainnet (planeado) | ~5 SUI | ~$4.50 |

- Es un pago **único por agente**, no recurrente.
- El agente puede ejecutar estrategias **ilimitadas** después de pagar.

---

#### Fuente 2: Marketplace P2P de Estrategias ← **PRINCIPAL** ⭐

Esta es la fuente de ingresos central del protocolo, implementada en `strategy_marketplace.move`.

**Flujo completo del Marketplace:**

```
Creador publica su estrategia:
  → list_strategy(name, cid, price) 
  → Guarda el CID de Walrus/IPFS (referencia a la lógica)
  → Recibe StrategyTemplate NFT (el "master" de la estrategia)
  → Emite evento StrategyListed

Comprador adquiere una copia:
  → buy_copy(template_id, payment_coin)
  → El contrato divide el pago automáticamente:

     Pago del comprador (ej. 10 SUI)
     ├─ 99% → Creador original (9.9 SUI)  👤
     └─  1% → TREASURY del protocolo (0.1 SUI) 🏦

  → Emite evento StrategyBought
```

Código exacto del split en el contrato:

```move
// strategy_marketplace.move — líneas 126-134
let fee_amount = record.price / 100;          // 1% → protocolo
let royalty_amount = record.price - fee_amount; // 99% → creador

transfer::public_transfer(fee, market.treasury);    // SuiLoop cobra
transfer::public_transfer(royalty, record.creator); // Creador cobra
```

**Modelo económico del Marketplace:**

| Participante | Recibe | Por qué |
|-------------|--------|---------|
| Creador de estrategia | 99% del precio de venta | Royalty permanente por cada copia vendida |
| Protocolo SuiLoop | 1% de cada venta | Comisión de plataforma |
| Comprador | Copia on-chain de la estrategia | Acceso a la lógica via CID (Walrus/IPFS) |

**Flywheel del Marketplace:**
```
Más agentes activos
  → Más estrategias creadas y publicadas
  → Más compradores en el marketplace
  → Más ingresos al protocolo (1% de cada venta)
  → Más incentivo para publicar buenas estrategias
  → Ciclo se repite ♻️
```

---

#### Fuente 3: Flash Loan Fee (Para LPs, NO para el protocolo)

```move
// El fee del 0.3% va al MockPool, no al TREASURY de SuiLoop
// En producción (DeepBook real), va a los proveedores de liquidez
```

| Fee | Porcentaje | Beneficiario | Aclaración |
|-----|-----------|-------------|-----------|
| Flash Loan | 0.3% del borrow | MockPool / LPs | **No es ingreso de SuiLoop** — es el costo del préstamo |

> ⚠️ El fee de Flash Loan **no va al TREASURY del protocolo**. Es el costo del servicio de liquidez que se queda en el pool, eventualmente beneficiando a los proveedores de liquidez (LPs). En testnet circularmente queda en el contrato.

---

### Resumen del Modelo de Negocio

```
┌──────────────────────────────────────────────────────────────┐
│                  REVENUE MODEL SUILOOP                       │
├─────────────────────┬─────────────┬────────────────────────┐ │
│ Fuente              │ Quién paga  │ Va a SuiLoop Treasury  │ │
├─────────────────────┼─────────────┼────────────────────────┤ │
│ 🤖 Deploy AgentCap  │ Cada usuario│ 100% → TREASURY        │ │
│    (licencia única) │ una vez     │ (0.1 SUI / ~5 mainnet) │ │
├─────────────────────┼─────────────┼────────────────────────┤ │
│ 🛒 Marketplace P2P  │ Compradores │ 1% de cada venta       │ │
│    de estrategias   │ de estrategs│ 99% → Creador          │ │
│    ← PRINCIPAL ⭐   │             │                        │ │
├─────────────────────┼─────────────┼────────────────────────┤ │
│ ⚡ Flash Loan 0.3%  │ El trader   │ 0% a SuiLoop           │ │
│    (costo del loan) │             │ (va al pool / LPs)     │ │
└─────────────────────┴─────────────┴────────────────────────┘ │
```

---

### LoopHub Marketplace (Skills — capa off-chain)

Además del Marketplace on-chain de estrategias, existe el **LoopHub** (capa off-chain gestionada por `loopHub.ts`/`skillManager.ts`):

El `loopHub.ts` define **26 skills** con sus estadísticas de descargas y ratings. **Estas estadísticas son hardcodeadas** (ej. Flash Loan Executor: 12,453 downloads, rating 4.8).

La API `api.loophub.io` está definida como base URL pero **no existe como servicio externo real** — el sistema opera en modo "in-memory/local" usando los skills hardcodeados.

Cuando se instala un skill vía "LoopHub", el `SkillManager` genera archivos localmente en `.suiloop/skills/`.

> **Nota**: El Marketplace P2P on-chain (`strategy_marketplace.move`) y el LoopHub off-chain (`loopHub.ts`) son **dos sistemas distintos**. El primero es la fuente de revenue principal con el split 99%/1%. El segundo es el sistema de plugins del agente (skills/herramientas que extienden sus capacidades).

---

## 7. Base de Datos (Supabase)

**URL**: `https://qzocuuldfqklicaakdhj.supabase.co`  
**Schema**: Definido en `SUPABASE_SCHEMA.sql`

### Tablas

| Tabla | Descripción | Quien escribe | Quien lee |
|-------|-------------|---------------|-----------|
| `profiles` | Usuarios por wallet_address | Frontend (al deploy strategy) | Frontend |
| `strategies` | Estrategias activas por usuario | Frontend (`strategyService.ts`) | Frontend Dashboard |
| `agent_logs` | Logs del agent daemon | Agent server + indexer | Frontend Agents Page (Realtime) |
| `user_memory` | Memoria persistente del agente | `memoryService.ts` | Agent LLM context |
| `skills` | Catálogo de skills (no poblado aún) | N/A | N/A |
| `skill_installs` | Skills instalados por usuario | N/A | N/A |
| `skill_reviews` | Reviews de skills | N/A | N/A |
| `chat_integrations` | Tokens de Telegram/Discord/Slack | N/A | N/A |
| `suiloop_agents` | Agentes sincronizados del indexer | `suiloop_indexer.ts` | Frontend Leaderboard |

### Supabase Realtime

La tabla `agent_logs` tiene suscripción Realtime activa en el frontend (`agents/page.tsx`):

```typescript
channel = supabase
    .channel('agents-realtime-logs')
    .on('postgres_changes', { event: 'INSERT', table: 'agent_logs' }, callback)
    .subscribe();
```

Esto actualiza el "Neural Feed" en tiempo real cuando el agent daemon escribe logs.

---

## 8. Tabla Real vs Simulado

### SMART CONTRACTS

| Función/Feature | Real ✅ | Simulado ⚠️ |
|-----------------|---------|------------|
| Flash Loan pattern (Hot Potato) | ✅ | |
| Vault / AgentCap / OwnerCap | ✅ | |
| agent_registry.register_agent() | ✅ | |
| agent_registry.publish_signal() | ✅ (llamado en cada ejecución SUI) | |
| agent_registry.update_reputation() | | ⚠️ Requiere AdminCap manual |
| MockPool (liquidez) | | ⚠️ Pool ficticio en testnet |
| execute_strategy_mainnet() | | ⚠️ `abort 0` — no ejecutable end-to-end |
| Scallop interface | | ⚠️ Mock ABI, no conecta al Scallop real |
| Cetus interface | | ⚠️ Mock ABI, no conecta al Cetus real |
| TREASURY revenue | | ⚠️ Dirección placeholder sin governance |

### AGENT DAEMON (server.ts + autonomousLoop.ts)

| Feature | Real ✅ | Simulado ⚠️ |
|---------|---------|------------|
| Express REST API | ✅ | |
| JWT + API Key auth | ✅ | |
| Rate limiting | ✅ | |
| WebSocket subscriptions | ✅ | |
| Webhook system | ✅ | |
| SUI price via Pyth Network | ✅ | |
| Gas price via Sui RPC | ✅ | |
| Total staked SUI (proxy liquidez) | ✅ | |
| Scallop APY (si API responde) | ✅ | |
| Scallop APY (fallback) | | ⚠️ Derivado deterministicamente del gas price |
| Navi APY | | ⚠️ Calculado desde `suiPrice % 2/3` |
| Cetus Pool Depth | | ⚠️ Valor inicial 500,000 hardcodeado |
| LLM validation de oportunidades | ✅ (si OPENAI_API_KEY configurado) | ⚠️ Falla silenciosamente si no hay key |
| ejecutar PTB real SUI | ✅ | |
| ejecutar PTB real USDC | | ⚠️ `sim_XXXX` hash falso |
| Walrus upload | ✅ (intenta, fallback local si falla) | |

### FRONTEND

| Feature | Real ✅ | Simulado ⚠️ |
|---------|---------|------------|
| RPC Latency medición | ✅ | |
| Neural Feed (Supabase Realtime) | ✅ | |
| On-chain signals (SignalPublished) | ✅ | |
| Deploy Tx "Activation" (1000 MIST) | ✅ | |
| Strategy service (Supabase) | ✅ | |
| LoopHub downloads/ratings | | ⚠️ Hardcodeados |
| Terminal landing feed | | ⚠️ Array estático con delays |
| Stats "TVL $1.4B", "2890 synced" | | ⚠️ Hardcodeados |
| Walrus status "LIVE" | | ⚠️ Timer de 1800ms |
| "Blobs Committed" count | | ⚠️ Proxy de logs count |
| "SYNC_ACTIVE_N%" | | ⚠️ Counter cíclico |
| "Secure Enclave" shield | | ⚠️ Hardcodeado |
| Audit download `enclave_signature` | | ⚠️ `"0x8a2f...3b1c"` falso |
| 3D Neural Orb | ✅ (Three.js) | |

---

## 9. Flujos de Ejecución

### Flujo 1: Flash Loan SUI (Ejecutado por usuario vía dashboard)

```
Usuario → ConnectWallet → Click "Execute Strategy"
  → Frontend: construye Transaction (PTB)
  → Wallet extension: user signs
  → suiClient.executeTransactionBlock()
  → Sui Testnet: ejecuta atomic_engine::execute_loop()
    → borrow_flash_loan() → emite FlashLoanInitiated
    → (strategy logic — en demo solo hace join + split)
    → repay_flash_loan() → emite FlashLoanRepaid
    → emite LoopExecuted event
  → Frontend: muestra tx hash, puede ver en suiscan.xyz
```

### Flujo 2: Agent Daemon ejecuta estrategia

```
autonomousLoop detecta oportunidad (gas price change, Pyth feed)
  → checkArbitrageOpportunities() | checkFlashLoanOpportunities()
  → LLM.chat() valida la señal (maxTokens: 10, solo true/false)
  → Si confidence >= minConfidence (60%)
    → emitSignal() → WebSocket broadcast a subscriptores
    → triggerWebhooks() → HTTP POST a URLs registradas
  → Si se ejecuta:
    → executeAtomicLeverage.handler()
    → buildPTB → signAndExecuteTransaction
    → Resultado → Supabase agent_logs
```

### Flujo 3: Indexer → Supabase → Leaderboard

```
suiloop_indexer.ts (cada 5 segundos):
  → client.queryEvents({ MoveEventType: AgentRegistered })
  → client.queryEvents({ MoveEventType: ReputationUpdated })
  → client.queryEvents({ MoveEventType: SignalPublished })
  → Calcula ELO, win_rate, volume_usd
  → supabase.from('suiloop_agents').upsert()
  
Frontend Leaderboard:
  → supabase.from('suiloop_agents').select() ORDER BY elo DESC
  → Supabase Realtime subscription para updates en vivo
```

---

## 10. Servicios del Agent Daemon

### `llmService.ts` — Multi-Provider LLM

Proveedores soportados (con failover automático):

| Provider | Modelo default | Estado |
|----------|---------------|--------|
| OpenAI | GPT-4o | ✅ Completo |
| Anthropic | Claude 3.5 Sonnet | ✅ Completo |
| AWS Bedrock | Claude 3 Sonnet v1 | ✅ Completo |
| Google Gemini | Gemini 1.5 Pro | ✅ Completo |
| Grok (xAI) | Grok Beta | ✅ Completo |
| Ollama (local) | Llama 3 | ✅ Básico |
| OpenRouter | Varios | ⚠️ Mock |
| Synthetic | N/A | ✅ Para testing |

**Failover**: Si el provider primario falla, automáticamente intenta los de la lista `fallbacks` en config.

### `memoryService.ts` — Memoria Persistente (797 líneas)

3 backends:
1. **InMemoryCache**: RAM, LRU eviction a 500 entries
2. **LocalFileStore**: Archivos JSON + Markdown en `.suiloop/memory/`
3. **SupabaseStore**: PostgreSQL cloud (tabla `user_memory`)

Almacena por usuario:
- Historial de conversaciones (últimas 1000)
- Historial de ejecuciones
- Preferencias (slippage, gas, risk tolerance)
- Contexto actual (intent, token mencionado, pending action)
- Stats (total executions, success rate, total profit)

Auto-save cada 30 segundos al persistent store.

### `skillManager.ts` — Plugin System (1051 líneas)

Gestiona el ciclo de vida completo de skills:

```
initialize() → loadBuiltInSkills() + loadInstalledSkills() + loadAgentSkills()
installSkill(source) → soporta: "github:owner/repo", "loophub:slug", path local
executeAction(skillSlug, actionName, params, context) → llama handler
assignSkillToAgent(slug, agentId) → persiste en agent_skills.json
```

**Built-in skills** (siempre cargados):
1. `atomic-flash-loan`
2. `price-monitor`
3. `telegram-alerts`

### `walrusService.ts` — Storage Descentralizado

```typescript
WALRUS_PUBLISHER = 'https://publisher.walrus-testnet.walrus.space'
```

Dos funciones:
1. `logStrategyExecution()`: Sube JSON de ejecución a Walrus (8s timeout), fallback a archivo local `audit_book.log`
2. `logTradeToWalrus()`: Sube datos genéricos de trade

**Estado**: Intenta subida real a Walrus Testnet. Si falla (timeout, red), guarda localmente en `audit_book.log`. La URL `walruscan.com/testnet/blob/{blobId}` es real si la subida fue exitosa.

### `subscriptionService.ts` — WebSocket Real-Time

Emite señales del tipo: `arbitrage_opportunity`, `flash_loan_opportunity`, `liquidity_change`, `gas_spike`, `price_deviation`, `strategy_trigger`

Clientes se suscriben via WebSocket y filtran por tipo, par, confianza mínima.

### `schedulerService.ts` — Programador de Tareas

Tareas cron para ejecutar estrategias periódicamente.

### `gatewayService.ts` — Gateway & Health Monitor

Centraliza heartbeats, health checks de todos los servicios, y expone `/api/health`.

### `browserService.ts` — Web Scraping Autónomo (17KB)

Usa Puppeteer para scraping descentralizado. Used by `sui-deep-research` skill.

Acciones:
- `scrapePrice()`: Precio de tokens
- `scrapePools()`: Datos de pools DEX
- `screenshot()`: Screenshot de URLs
- `extractData()`: Extracción de datos con CSS selectors

### `twitterService.ts` + `knowledgeService.ts`

Análisis de sentimiento de Twitter/X y búsqueda de conocimiento via Tavily API.

### `telegramService.ts`, `discordService.ts`

Alertas y comandos via bots de Telegram y Discord.

### Otros servicios (stub/parcial)

| Servicio | Estado |
|---------|--------|
| `voiceService.ts` | Stub — voice input/output |
| `queueService.ts` | Cola de tareas en memoria |
| `sessionService.ts` | Gestión de sesiones |
| `notificationService.ts` | Notificaciones multi-canal |
| `cetusService.ts` | Wrapper Cetus SDK |
| `scallopService.ts` | Wrapper Scallop SDK |
| `agentRegistryService.ts` | Interacción con registry on-chain |

---

## 11. Integraciones Externas

| Servicio | Uso | Estado |
|---------|-----|--------|
| Pyth Network | Precio SUI/USD via Hermes API | ✅ Real |
| Sui Testnet RPC | Gas price, system state, events | ✅ Real |
| Supabase | Database + Realtime | ✅ Real |
| Walrus Testnet | Forensic logging | ✅ Real (con fallback) |
| OpenAI API | LLM validation + chat | ✅ Real (si API key configurada) |
| DeepBook V3 | Check de objeto en testnet | ✅ Real (solo status check) |
| Scallop API | APY data | ✅ Real (intenta `sui.scallop.io/api/market`) |
| Cetus DEX | Pool data | ⚠️ Parcial |
| LoopHub API | Marketplace backend | ⚠️ No existe — modo local |
| api.loophub.io | Base URL del Hub | ⚠️ No existe aún |
| Tavily | Knowledge search | ⚠️ Requiere API key |

---

## 12. Scripts de Infraestructura

### `scripts/suiloop_indexer.ts` — Indexer On-Chain (ACTIVO)

**Ejecutándose actualmente** en `packages/agent/`.

```typescript
// Corre cada 5 segundos:
1. Queries a Sui: AgentRegistered, ReputationUpdated, SignalPublished
2. Calcula: ELO, win_rate, volume_usd por agente
3. Upsert a Supabase tabla suiloop_agents
```

**Limitación**: El ELO que muestra es el que viene de `ReputationUpdated` events — pero esos eventos solo se emiten cuando el AdminCap actualiza manualmente. Los trades normales no actualizan el ELO automáticamente.

### `scripts/balance.ts` / `balance_all.ts`

Utilidades para ver balances de cada wallet del swarm.

### `scripts/add_liquidity.ts` / `add_liquidity_real.ts`

Agrega liquidez al MockPool del contrato para que los flash loans del demo funcionen.

### `scripts/deploy_test_usdc.ts`

Deploya un token USDC de testnet para testing.

### `request_faucet.js` (raíz)

Solicita SUI del faucet para wallets del swarm.

### `scripts/traffic_gen.sh` (ACTIVO)

Genera tráfico on-chain con los ~50 wallets del swarm. Actualmente ejecutándose en background según los terminales activos.

---

## 13. SDKs

### TypeScript SDK (`packages/sdk/`)

```bash
npm i @suiloop/sdk
```

**Estado**: Estructura creada, implementación básica.

### Python SDK (`packages/sdk-python/`)

```bash
pip install suiloop
```

**Estado**: Estructura creada, implementación básica.

### CLI (`packages/cli/`)

```bash
./suiloop sync
npx suiloop create-unit
```

**Estado**: Estructura creada.

---

## 14. Estado del Proyecto

### ✅ Funcional y Real (producción-ready para testnet)

- Smart contracts desplegados en Testnet
- Flash Loans SUI funcionales via MockPool
- Agent Registry con ELO base
- Signal publishing on-chain
- Agent Daemon con API REST completa
- Autonomous market scanner con datos reales (Pyth, Sui RPC)
- Supabase Realtime funcionando
- Frontend Next.js con conexión a wallet
- Indexer leyendo eventos on-chain
- Walrus logging (con fallback)
- Multi-provider LLM con failover

### ⚠️ Simulado / Demo / En desarrollo

- MockPool (no es DeepBook V3 real)
- USDC vaults (no tienen pool real en testnet)
- Scallop/Cetus interfaces son ABIs mock
- ELO updates solo via AdminCap manual
- LoopHub marketplace (datos hardcodeados, API no existe)
- Stats "TVL $1.4B" y similares en landing page
- Walrus status en frontend (timer fijo de 1800ms)
- `execute_strategy_mainnet()` tiene `abort 0`
- Terminal feed de landing page (mensajes estáticos)
- `enclave_signature` en audit download

### 🔜 Próximos pasos para mainnet

1. Conectar interfaces Move a contratos reales de Scallop y Cetus
2. Implementar actualización de ELO via oracle/verificador zkProof
3. Actualizar `DEPLOYMENT_FEE` a 5 SUI
4. Crear TREASURY governance real
5. Deployar LoopHub API backend
6. Pools reales (DeepBook V3 integration)
7. USDC vault con liquidez real

---

## 15. SuiLoop Pay Protocol v1.0

**Archivo**: `packages/agent/src/middleware/suiPayProtocol.ts`  
**Estado**: ✅ Implementado — Monetización on-chain nativa de Sui

### Contexto: El problema de pay-per-API en Web3

Varios ecosistemas han intentado resolver el problema de cobrar por acceso a APIs con cripto. SuiLoop implementa su propio protocolo aprovechando las capacidades nativas de Sui — específicamente los **Programmable Transaction Blocks (PTBs)** — logrando un resultado arquitectónicamente superior a todas las alternativas existentes.

### Comparativa de estándares Web3 de pay-per-API

| Estándar | Red | Mecanismo | Round-trips | Prueba permanente | Infraestructura extra |
|---------|-----|---------|-------------|-----------------|-------------------|
| **L402 / LSAT** (Lightning Labs) | Bitcoin / Lightning | Token macaroon emitido tras pago en Lightning Network | 2 | ❌ Expira | Lightning Node + LSAT server |
| **x402** (Coinbase / Base / Stellar / Ethereum) | Multi-chain | HTTP 402 → cliente paga → reintenta con recibo | 2 | ❌ Recibo temporal | x402 relay server |
| **EIP-4337 Paymaster** (Ethereum / L2s) | EVM | Account Abstraction: tercero patrocina o descuenta gas de saldo prepagado | 1 | ✅ On-chain EVM | Bundler + Paymaster contract + EntryPoint |
| **Solana Pay** | Solana | QR/deep-link para pagos en punto de venta | 2 | ✅ On-chain Solana | Wallet + server de solicitud de tx |
| **μRaiden / Connext** | Ethereum | Micropagos off-chain vía state channels | 1 | ❌ Off-chain hasta cierre | Canal de estado por contraparte |
| **SuiLoop Pay** ← este protocolo | **Sui** | **PTB: pago + intención de ejecución firmados en UNA sola transacción** | **1** | **✅ On-chain Sui, permanente** | **Ninguna — solo una wallet Sui** |

### ¿Por qué SuiLoop Pay es superior?

```
L402/LSAT:   CALL → 402 → pay LN → get macaroon → RETRY    (2 trips, LN node required)
x402:        CALL → 402 → pay on-chain → RETRY with receipt (2 trips, relay server)
EIP-4337:    Complex: Bundler + EntryPoint + Paymaster stack (gas abstraction, not pay-per-call)
Solana Pay:  Designed for PoS, not API monetization
μRaiden:     Off-chain channels, deprecated, per-pair setup

SuiLoop Pay: [pay + call intent] signed atomically in ONE PTB → verify digest on-chain
             1 round-trip. No extra infrastructure. Permanent proof. Composable.
```

**5 ventajas clave**:

1. **ATÓMICO** — El pago y la intención de ejecución se firman en una sola transacción PTB. Si el pago falla, el API call no existe. No hay 2 round-trips.
2. **PERMANENTE** — La prueba vive en la blockchain de Sui para siempre (no es un recibo temporal como en x402 o un macaroon que expira como en L402).
3. **COMPOSABLE** — El pago puede estar embebido *dentro* de la misma PTB que ejecuta la estrategia de flash loan. El pago ES la autorización.
4. **NON-CUSTODIAL** — El TREASURY es una dirección on-chain. El protocolo nunca es un relay, un escrow, ni mantiene fondos.
5. **ZERO INFRAESTRUCTURA** — No requiere nodo Lightning, no requiere state channel, no requiere bundler/EntryPoint de EIP-4337. Solo una wallet Sui.

### Tiers de Acceso

#### Tier 1: AgentCap NFT (acceso ilimitado)

```
Header requerido: X-Wallet-Address: <wallet>

Flujo:
  1. Usuario paga DEPLOYMENT_FEE (0.1 SUI Testnet / ~5 SUI Mainnet)
  2. Recibe AgentCap NFT en su wallet
  3. Cada request: servidor verifica on-chain que wallet tiene AgentCap
  4. Si tiene AgentCap → acceso ilimitado al API
```

Verificación en el servidor:
```typescript
client.getOwnedObjects({
    owner: walletAddress,
    filter: { StructType: `${PACKAGE_ID}::atomic_engine::AgentCap` }
})
// Si data.length > 0 → acceso garantizado
```

#### Tier 2: Pay-Per-Call via PTB (micropago por llamada)

```
Headers requeridos:
  X-Wallet-Address: <wallet>
  X-Payment-Tx:    <tx_digest>

Flujo del cliente:
  1. Construir PTB:
     a. splitCoins(gas, [1_000_000])          // 0.001 SUI
     b. transferObjects([coin], TREASURY)      // paga al protocolo
  2. Firmar y ejecutar PTB → obtiene tx_digest
  3. Adjuntar headers al API request
  
Verificación del servidor:
  1. Fetch tx de Sui: getTransactionBlock(digest)
  2. Check: status === 'success' ✅
  3. Check: timestamp < 5 minutos (anti-stale) ✅  
  4. Check: balance_changes incluye ≥ 1,000,000 MIST → TREASURY ✅
  5. Check: digest no fue usado antes (anti-replay) ✅
  6. Marcar digest como usado → ejecutar
```

#### Respuesta HTTP 402 — detallada por diseño

Si ningún tier es válido, el servidor retorna `402 Payment Required` con instrucciones completas para cada tier, compatible con cualquier cliente que implemente x402, L402, o un cliente custom:

```json
{
  "error": "Payment Required",
  "code": "SUI_PAY_402",
  "protocol": "SuiLoop Pay Protocol v1.0",
  "tiers": {
    "agentcap": { "fee": "0.1 SUI (once)", "access": "unlimited", "how": "..." },
    "pay_per_call": { "fee": "1000000 MIST (0.001 SUI/call)", "treasury": "0x..." }
  },
  "docs": "https://github.com/Eras256/Sui-Loop"
}
```

### Endpoints del Pay Protocol

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/pay/instructions` | ❌ | Instrucciones + comparativa con L402/x402/EIP-4337 |
| `POST` | `/api/pay/verify` | ❌ | Pre-verifica un `tx_digest` antes de usarlo en una llamada |

### Anti-Replay Protection

```
usedDigests = Set<string>   // in-memory (Redis/Supabase en producción)
TTL auto-clean = 6 minutos  // MAX_TX_AGE_MS (5 min) + 1 min buffer

Reglas:
  - tx_digest ya usado → HTTP 402 "Payment Already Used"  
  - tx con > 5 min de antigüedad → HTTP 402 "Transaction Expired"
  - Cada digest es de un solo uso (1 pago = 1 API call)
```

---

## Variables de Entorno Requeridas

### `packages/agent/.env`

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `SUI_PRIVATE_KEY` | Clave privada del agent hot wallet | ✅ |
| `OPENAI_API_KEY` | Para LLM validation | ⚠️ Opcional |
| `SUPABASE_URL` | URL de Supabase | ⚠️ Opcional (logging disabled sin él) |
| `SUPABASE_SERVICE_KEY` | Service Key de Supabase | ⚠️ Opcional |
| `SUI_PACKAGE_ID` | Package ID del contrato | ✅ |
| `SUI_POOL_ID` | Pool ID del MockPool | ✅ |
| `SUI_REGISTRY_ID` | Registry ID del agent_registry | ✅ |
| `SUI_NETWORK` | `testnet` o `mainnet` | ✅ |
| `SUI_TREASURY_ADDRESS` | Dirección del treasury (SuiLoop Pay Protocol) | ⚠️ Opcional |
| `TELEGRAM_BOT_TOKEN` | Para alertas Telegram | ⚠️ Opcional |
| `DISCORD_BOT_TOKEN` | Para alertas Discord | ⚠️ Opcional |
| `PORT` | Puerto del servidor (default 3001) | ⚠️ Opcional |

### `packages/web/.env.local`

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase |
| `NEXT_PUBLIC_PACKAGE_ID` | Package ID del contrato |
| `NEXT_PUBLIC_SUI_NETWORK` | `testnet` o `mainnet` |

---

## 16. Neural Swarm v2.0

**Script**: `packages/agent/scripts/suiloop_neural_swarm.ts`  
**Reemplaza**: `scripts/traffic_gen.sh` (bash anónimo)  
**Estado**: ✅ Implementado — 20 agentes nombrados con tráfico dual

### Roster de Agentes (Los 20 del Swarm)

| # | Nombre | Rol | Especialidad | Tipo de Tráfico |
|---|--------|-----|-------------|----------------|
| 1 | **Nexus** | Swarm Commander | Flash Loan Execution | Dual (A+B) |
| 2 | **Phantom** | Market Scanner | Price Arbitrage | Signal (B) |
| 3 | **Cipher** | Signal Publisher | On-chain Telemetry | Signal (B) |
| 4 | **Apex** | Arbitrage Hunter | Cross-pool Spreads | Flash Loan (A) |
| 5 | **Vault** | Liquidity Guardian | Capital Preservation | Flash Loan (A) |
| 6 | **Nova** | Opportunity Explorer | New Pool Discovery | Dual (A+B) |
| 7 | **Specter** | Shadow Executor | MEV Protection | Flash Loan (A) |
| 8 | **Chronos** | Temporal Strategist | Gas Timing Optimization | Signal (B) |
| 9 | **Atlas** | Capital Coordinator | Multi-vault Management | Dual (A+B) |
| 10 | **Matrix** | Data Analyst | Market State Analysis | Signal (B) |
| 11 | **Titan** | Heavy Executor | Large Volume Loans | Flash Loan (A) |
| 12 | **Oracle** | Price Feed Monitor | Pyth Network Signals | Signal (B) |
| 13 | **Forge** | PTB Architect | Transaction Construction | Flash Loan (A) |
| 14 | **Helios** | Yield Hunter | APY Optimization | Dual (A+B) |
| 15 | **Vortex** | Liquidity Rotator | Pool Rotation Strategy | Flash Loan (A) |
| 16 | **Zenith** | Risk Validator | LLM-assisted Validation | Signal (B) |
| 17 | **Flux** | Adaptive Executor | Dynamic Strategy Switch | Dual (A+B) |
| 18 | **Pulse** | Health Monitor | Protocol Health Checks | Signal (B) |
| 19 | **Shadow** | Stealth Operator | Low-latency Execution | Flash Loan (A) |
| 20 | **Aegis** | Security Validator | Hot Potato Integrity | Dual (A+B) |

### Tráfico Dual — Tipos de Transacción

| Tipo | ID | Target | Gas aprox. | Descripción |
|-----|-----|--------|-----------|-------------|
| **Type A** | Flash Loan | `atomic_engine::execute_loop` | ~0.003 SUI | Ciclo completo de hot-potato flash loan |
| **Type B** | Signal | `agent_registry::publish_signal` | ~0.001 SUI | Señal on-chain con datos del agente |

Cada agente tiene su tipo asignado (`flash_loan`, `signal`, o `dual`). Los agentes `dual` alternan entre tipos por tick con 50% de probabilidad.

### Métricas Operacionales

| Métrica | Valor |
|---------|-------|
| Cadencia del swarm | **8 segundos** por tick |
| Agentes activos | **20** (de 46 wallets disponibles) |
| TX/minuto estimadas | **~150** (20 agentes × ~1 tx/tick × 60/8) |
| Fondeo por agente | Faucet testnet (variable) |
| Stagger entre agentes | 200ms (evita rate limits del RPC) |
| Métricas cada N ticks | Cada 5 ticks (~40 segundos) |
| Supabase sync | **Cada tick** (8 segundos) |
| Uptime | Continuo mientras corre el script |

### Schema de Supabase — Tabla `suiloop_agents` (actualizada)

```sql
-- Migración para añadir columnas de identidad del swarm
ALTER TABLE suiloop_agents
    ADD COLUMN IF NOT EXISTS agent_name      TEXT DEFAULT 'Unknown',
    ADD COLUMN IF NOT EXISTS agent_role      TEXT DEFAULT 'Agent',
    ADD COLUMN IF NOT EXISTS agent_specialty TEXT DEFAULT 'General',
    ADD COLUMN IF NOT EXISTS flash_loan_txs  INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS signal_txs      INTEGER DEFAULT 0;

-- Habilitar Realtime si no está activo
ALTER PUBLICATION supabase_realtime ADD TABLE suiloop_agents;
```

La tabla completa queda:

```sql
CREATE TABLE public.suiloop_agents (
    id              TEXT PRIMARY KEY,        -- wallet_address (0x...)
    agent_name      TEXT DEFAULT 'Unknown',  -- "Nexus", "Phantom", etc.
    agent_role      TEXT DEFAULT 'Agent',    -- "Swarm Commander", etc.
    agent_specialty TEXT DEFAULT 'General',  -- "Flash Loan Execution", etc.
    wallet_address  TEXT NOT NULL,
    total_txs       INTEGER DEFAULT 0,
    flash_loan_txs  INTEGER DEFAULT 0,       -- TYPE A: Flash Loans
    signal_txs      INTEGER DEFAULT 0,       -- TYPE B: Signals
    volume_usd      NUMERIC(20,2) DEFAULT 0,
    elo             INTEGER DEFAULT 1000,
    win_rate        NUMERIC(5,1) DEFAULT 0,
    last_tx_hash    TEXT,
    last_activity   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
-- RLS abierto + Realtime habilitado para el leaderboard
```

### Comandos de Operación

```bash
# ── Swarm Neural (principal, reemplaza traffic_gen.sh)
cd packages/agent
npx tsx scripts/suiloop_neural_swarm.ts

# ── Indexer on-chain (sincroniza eventos on-chain)
npx tsx scripts/suiloop_indexer.ts

# ── Setup inicial (solo si cambia el contrato)
npx tsx scripts/add_liquidity_real.ts

# ── Balances del swarm
npx tsx scripts/balance_all.ts

# ── Frontend
cd packages/web && npm run dev
```

---

## 17. Links de Monitoreo

| Recurso | URL |
|---------|-----|
| 🌐 **Frontend** | http://localhost:3000 (dev) |
| 🏆 **Leaderboard** | http://localhost:3000/leaderboard |
| 🤖 **Agents** | http://localhost:3000/agents |
| 📊 **Dashboard** | http://localhost:3000/dashboard |
| 🛒 **Marketplace** | http://localhost:3000/marketplace |
| ⚙️ **Agent API** | http://localhost:3001/api/info |
| 💊 **Pay Protocol** | http://localhost:3001/api/pay/instructions |
| 🩺 **Health** | http://localhost:3001/api/health |
| 🔵 **Contrato Sui** | https://suiscan.xyz/testnet/object/`${PACKAGE_ID}` |
| 📡 **Eventos on-chain** | https://suiscan.xyz/testnet/object/`${REGISTRY_ID}` |
| 🗄️ **Supabase** | https://supabase.com/dashboard/project/qzocuuldfqklicaakdhj |
| 📦 **GitHub** | https://github.com/Eras256/Sui-Loop |

> **Nota**: El frontend no está desplegado en Vercel aún. Para obtener la URL pública, hacer `git push` y configurar el proyecto en Vercel siguiendo `VERCEL.md`.

---

*Documentación generada mediante análisis exhaustivo del código fuente — Marzo 2026*
