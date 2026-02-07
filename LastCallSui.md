# Last Call Sui - Active Deployment Archive

**Date:** 07.02.2026 UTC 16:42
**Status:** Active Production Candidate

## 📦 Package Information (Producción)
- **Package ID:** `0xc24c35c4fa95430759743d79c079f2d89ef85ed0187daa0342345410a98c025b`
- **Network:** Sui Testnet / Mainnet Ready
- **Fee:** 5 SUI (Protocol Revenue)

## 📦 Package Information (Hackathon Demo)
- **Package ID:** `0x673686ac6a1a259b1d39553e6cdb2fb2478a13db4bccd83ea6f7c079af89a7fb`
- **Network:** Sui Testnet
- **Fee:** 0.1 SUI (Adjusted for Judges & Testing)

---

## � Modelo de Operación PRO (Estándar)

SuiLoop opera bajo un modelo de **Seguridad Institucional** donde cada agente requiere una licencia on-chain. No utilizamos atajos inseguros; la arquitectura es robusta y predecible.

### 1. Licencia de Agente (`AgentCap`)
Para desplegar un agente, el usuario debe acuñar un `AgentCap`. Este es un objeto real (NFT de capacidad) que vive en la wallet del usuario.

- **Costo de Producción:** 5 SUI (Definido en el contrato `0xc24c...`).
- **Costo de Demo:** 0.1 SUI (Para facilitar el testing en el Hackathon).

**¿Por qué usar AgentCap?**
- **Delegación Segura:** El agente solo tiene permiso para *ejecutar estrategias*, nunca para retirar fondos.
- **Revocación Instantánea:** El usuario puede llamar a `destroy_agent_cap` en cualquier momento para quemar la licencia y detener al agente forzosamente.

### 2. Ejecución Atómica (Flash Loans)
Toda operación ocurre en una sola transacción atómica:
1.  **Préstamo Flash:** El contrato toma prestado capital del pool sin colateral.
2.  **Verificación de Beneficio:** Si la estrategia no es rentable (después de fees y repago), la transacción falla automáticamente.
3.  **Seguridad de Bóveda:** Los fondos del usuario en la `Vault` están aislados y nunca salen de la custodia del contrato durante la ejecución.

### 3. Mecanismo de Stop (Kill Switch)
El control total reside en el usuario. Para detener un agente, se ejecuta una transacción on-chain verificable:
- **Acción:** `destroy_agent_cap`
- **Efecto:** Quema el objeto de capacidad irrevocablemenente.
- **Resultado:** El agente pierde instantáneamente cualquier permiso para operar.

---

## 📝 Nota Técnica para Jueces
Para la demostración en vivo del Hackathon, hemos ajustado el parámetro de tarifa en el contrato desplegado (`0x6736...`) a **0.1 SUI**. Esto permite probar el flujo completo de creación y destrucción de licencias sin la fricción de adquirir grandes cantidades de tokens de prueba.

La versión Mainnet (`0xc24c...`) mantiene el modelo económico original de **5 SUI** para sostenibilidad del protocolo.
