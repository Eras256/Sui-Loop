# ♾️ SuiLoop Protocol — Inteligencia DeFi Autónoma en Sui

<div align="center">

![Status](https://img.shields.io/badge/Status-Operational-00f3ff?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-blueviolet?style=for-the-badge)
![Network](https://img.shields.io/badge/Network-Sui_Testnet-4DA2FF?style=for-the-badge&logo=sui)
![Security](https://img.shields.io/badge/Hot_Potato_Pattern-Verified-00ff88?style=for-the-badge)
![Agents](https://img.shields.io/badge/Neural_Swarm-20_Agents-ff6b6b?style=for-the-badge)
![Walrus](https://img.shields.io/badge/Audit-Walrus_Sealed-orange?style=for-the-badge)

**El primer protocolo de Agentes Autónomos de Inteligencia Artificial (IA) de grado institucional construido nativamente sobre la blockchain de Sui.**

</div>

---

## 🧠 La Visión General

SuiLoop elimina el cuello de botella humano en las finanzas descentralizadas (DeFi). Es una capa de **Inteligencia Financiera Autónoma** impulsada por un enjambre neuronal ("Neural Swarm") de 20 agentes IA con nombre, rol y especialidad que operan 24/7 en la red Sui. Escanean los mercados, arbitran, emiten señales on-chain y ejecutan estrategias atómicas sin intervención humana. 

Todo este ecosistema está respaldado por el patrón **Hot Potato de Sui Move** que hace imposible crear deuda irrecuperable en los "Flash Loans" (préstamos relámpago), garantizando un **Riesgo Colateral Cero**. Adicionalmente, las decisiones de la IA quedan inmutables gracias a la red de almacenamiento descentralizado **Sui Walrus (Proof of Action)**.

---

## 🏛️ Ecosistema Modular Completo (Full Stack)

El protocolo abarca 8 paquetes (packages) exhaustivos integrados en un monorepo administrado con `pnpm` workspaces:

### 1. 🔐 Contratos Inteligentes On-Chain (`packages/contracts`)
Implementados en **Sui Move**, garantizan seguridad atómica a nivel de bytecode:
- **`atomic_engine.move`**: Usa el patrón *Hot Potato* (`LoopReceipt`). Si un Préstamo Relámpago (Flash Loan) no se paga dentro de la misma *Programmable Transaction Block* (PTB), el bloque entero revierte. Absoluta garantía matemática contra pérdidas.
- **`agent_registry.move`**: Identidad On-Chain de los agentes. Publican "señales" que son archivadas permanentemente on-chain.
- **`agent_vault.move`**: Bóvedas No-Custodias (`Vault<T>`). Los agentes NUNCA tienen acceso a la clave privada del usuario, se basan en Capacidades Delegadas (`AgentCap`).

### 2. 🤖 Matriz Neuronal / Backend (`packages/agent`)
El cerebro (Node.js 20, TS, Express 5) que orquesta las estrategias:
- **Enjambre de 20 Agentes**: Agentes como Nexus (Comandante), Phantom (Escáner de Arbitraje), Cipher (Oráculo de Precios), entre otros.
- **Circuit Breaker**: Mecanismo de seguridad industrial que pausa operaciones automáticamente si detecta fallos en la blockchain y manda avisos mediante Webhooks y eventos on-chain.
- **Microservicios**: Gestor de LLM multicanal (GPT-4o-mini + Ollama local), subida inmutable a **Sui Walrus** cada 5 minutos, despachador de Webhooks (HMAC-SHA256) y telemetría por WebSockets.

### 3. 🖥️ Centro de Mando Web (`packages/web`)
Interfaz de vanguardia construida en **Next.js 15, React 19, Tailwind CSS, Framer Motion y Three.js**.
- **Estética "State of the Art" Premium**: Tema oscuro profundo ("Dark Void" `#030014`) infundido con efectos **Glassmorphism**, neones cian y púrpuras, texturas granuladas sutiles y el componente 3D fotorrealista `NeuralOrb` flotante.
- **Multilingüe (i18n)**: Soporte completo en Inglés, Español y Chino Simplificado.
- **Visual Strategy Builder**: Interfaz innovadora tipo Drag-and-Drop (ReactFlow) para conectar nodos lógicos y armar bots visualmente.
- **Leaderboard Dual**: ELO en vivo con base de datos **Supabase**, enfrentando humanos vs. agentes.

### 4. 🧰 CLI - Interfaz de Línea de Comandos (`packages/cli`)
Herramienta NodeJS que brinda control total a los operadores del sistema para arrancar el enjambre de agentes, generar plantillas en TS/Py e interactuar nativamente con la matriz (`suiloop agent deploy`, `suiloop loop start`).

### 5. 📦 SDK de TypeScript (`packages/sdk`)
SDK tipado y publicado para integrar de forma agnóstica la API de SuiLoop en aplicaciones web y dApps ajenas, ideal para B2B.

### 6. 🐍 SDK de Python (`packages/sdk-python`)
Librería completa de Python `suiloop` orientada a Quants y Científicos de Datos para facilitar automatizaciones matemáticas, machine learning y modelos de riesgo que consuman las APIs del la red.

### 7. �� Servidor MCP (`packages/mcp`)
Acrónimo de *Model Context Protocol*. Permite que Asistentes Inteligentes externos de LLMs o IDEs como Claude se conecten e interactúen de forma estandarizada y directa con las capacidades de SuiLoop.

### 8. 💻 Aplicación de Escritorio (`packages/desktop`)
Desarrollada en **Tauri 2.0 (Rust)**, una app nativa hiper-ligera multiplataforma (Windows/macOS/Linux) que corre discretamente de fondo (system tray alert), y da manejo seguro y nativo de las alertas del oráculo, billetera local y comandos de consola del agente.

---

## 🦭 Auditoría Descentralizada con Sui Walrus (Proof of Action)

SuiLoop innova implementando la **Prueba de Acción (PoA)**:
Cada decisión que un Agente IA toma (por ejemplo, realizar un flash loan porque el spread entre Cetus y DeepBook v3 era ventajoso) genera un registro de memoria contextual procesado por un LLM.
- **Paso 1**: La bitácora se comprime en un Blob.
- **Paso 2**: El servicio se inyecta en el objeto inteligente del registro del agente.
- **Paso 3**: Se archiva en la Testnet del almacenamiento descentralizado de gran volumen **Sui Walrus**. Esto permite un rastro 100% inmutable, descentralizado y auditable forensemente por institucionales.

---

## 🛠️ Guía Rápida de Implementación

**1. Clonar e Instalar Setup (Monorepo pnpm)**
```bash
git clone https://github.com/Eras256/Sui-Loop.git
cd Sui-Loop
pnpm install
```

**2. Variables de Entorno y Base de Datos**
Asegúrate de copiar el entorno en `packages/agent` (`SUI_PRIVATE_KEY`, `OPENAI_API_KEY`, accesos de `SUPABASE`).

**3. Iniciar Servicios de Desarrollo Locales**
```bash
pnpm dev
# Frontend -> http://localhost:3000
# Backend API -> http://localhost:3001
# Desktop -> Tauri local build
```

**4. Orquestar el Enjambre Neuronal**
```bash
cd packages/agent 
npx tsx scripts/fund_swarm.ts           # Fondear carretas secundarias
npx tsx scripts/suiloop_neural_swarm.ts # Arrancar los 20 Agentes IA
```

---

## ⚖️ Aviso Legal y Riesgos
**SuiLoop** es proveedor tecnológico de código abierto para las testnets, no ofrece asesoría financiera ni de inversión. Las bóvedas (vaults) permanecen en absoluto control no-custodio (non-custodial) del titular de la billetera (wallet) original. Utilizar bajo propio riesgo.

