const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'packages/web/messages/en.json');
const esPath = path.join(__dirname, 'packages/web/messages/es.json');
const zhPath = path.join(__dirname, 'packages/web/messages/zh.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const esData = JSON.parse(fs.readFileSync(esPath, 'utf8'));
const zhData = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

const translations = {
  leaderboard: {
    hero: {
      verified: { en: "verified on-chain performance", es: "rendimiento verificado en cadena", zh: "链上验证性能" },
      title1: { en: "Agent", es: "Agente", zh: "代理" },
      title2: { en: "Elite", es: "Élite", zh: "精英" },
      subtitle: {
        en: "Real-time reputation ranking of autonomous agents operating on the SuiLoop Protocol. Metrics are verified via cryptographical proof on Sui Testnet.",
        es: "Clasificación de reputación en tiempo real de los agentes autónomos que operan en el Protocolo SuiLoop. Las métricas se verifican mediante pruebas criptográficas en la red de pruebas (Sui Testnet).",
        zh: "在 SuiLoop 协议上运行的自治代理的实时声誉排名。指标通过 Sui 测试网上的密码学证明进行验证。"
      }
    },
    search: {
      placeholder: { en: "Search agent or wallet...", es: "Buscar agente o billetera...", zh: "搜索代理或钱包..." }
    },
    tvl: {
      label: { en: "Global TVL", es: "TVL Global", zh: "全球总锁仓量" }
    },
    podium: {
      eloRating: { en: "ELO Rating", es: "Clasificación ELO", zh: "ELO 评分" },
      winRate: { en: "Win Rate", es: "Tasa de Ganancia", zh: "胜率" },
      agentWallet: { en: "AGENT WALLET", es: "BILLETERA DEL AGENTE", zh: "代理钱包" },
      lastSignal: { en: "Last Signal", es: "Última Señal", zh: "最新信号" }
    },
    feed: {
      title: { en: "LIVE NEURAL FEED", es: "FEED NEURONAL EN VIVO", zh: "实时神经反馈" },
      waiting: { en: "Waiting for agents to sync...", es: "Esperando a que los agentes se sincronicen...", zh: "等待代理同步..." },
      justNow: { en: "just now", es: "justo ahora", zh: "刚刚" }
    },
    table: {
      headers: {
        rank: { en: "Rank", es: "Rango", zh: "排名" },
        profile: { en: "Agent Profile", es: "Perfil del Agente", zh: "代理资料" },
        performance: { en: "Performance", es: "Rendimiento", zh: "表现" },
        trust: { en: "Trust Score", es: "Puntuación de Confianza", zh: "信任评分" },
        feed: { en: "Neural Feed", es: "Feed Neuronal", zh: "神经反馈" },
        audit: { en: "Audit Seal", es: "Sello Auditor", zh: "审计密封" },
        volume: { en: "Volume", es: "Volumen", zh: "成交量" }
      },
      stats: {
        winRate: { en: "Win Rate", es: "Tasa de ganancia", zh: "胜率" },
        trades: { en: "Trades", es: "Comercios", zh: "交易笔数" },
        elo: { en: "ELO", es: "ELO", zh: "ELO" },
        standby: { en: "STANDBY MODE", es: "MODO DE ESPERA", zh: "待机模式" },
        tx: { en: "TX:", es: "TX:", zh: "交易:" }
      }
    },
    footer: {
      sync: { en: "Live Network Sync", es: "Sincronización de Red en Vivo", zh: "实时网络同步" },
      nodes: { en: "Active Nodes", es: "Nodos Activos", zh: "活跃节点" },
      monitor: { en: "Monitor My Agent", es: "Monitorear Mi Agente", zh: "监控我的代理" },
      deploy: { en: "Deploy New Unit", es: "Desplegar Nueva Unidad", zh: "部署新单元" }
    }
  }
};

function addTranslations(targetData, langCode) {
  if (!targetData.leaderboard) targetData.leaderboard = {};

  for (const [section, sectionData] of Object.entries(translations.leaderboard)) {
    if (!targetData.leaderboard[section]) targetData.leaderboard[section] = {};
    for (const [key, val] of Object.entries(sectionData)) {
      if (val && val[langCode]) {
        if (typeof val[langCode] === 'string') {
          targetData.leaderboard[section][key] = val[langCode];
        } else {
          if (!targetData.leaderboard[section][key]) targetData.leaderboard[section][key] = {};
          for (const [subKey, subVal] of Object.entries(val[langCode])) {
            targetData.leaderboard[section][key][subKey] = subVal;
          }
        }
      }
    }
  }

  targetData.leaderboard.table = { headers: {}, stats: {} };
  for (const [key, val] of Object.entries(translations.leaderboard.table.headers)) {
    targetData.leaderboard.table.headers[key] = val[langCode];
  }
  for (const [key, val] of Object.entries(translations.leaderboard.table.stats)) {
    targetData.leaderboard.table.stats[key] = val[langCode];
  }
}

addTranslations(enData, 'en');
addTranslations(esData, 'es');
addTranslations(zhData, 'zh');

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2) + '\n');
fs.writeFileSync(esPath, JSON.stringify(esData, null, 2) + '\n');
fs.writeFileSync(zhPath, JSON.stringify(zhData, null, 2) + '\n');

console.log('Translations updated successfully');
