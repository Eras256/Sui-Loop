import requests
import json
import asyncio
import websockets
from typing import Optional, Dict, Any, Callable, AsyncGenerator, Literal


class Agent:
    """
    SuiLoop Agent SDK — Autonomous DeFi execution on Sui.

    Supports:
    - SUI and USDC multi-asset flash loan vaults
    - Real-time signal streaming via WebSocket
    - Autonomous market loop control
    - Strategy builder kernel execution
    """

    def __init__(self, api_key: str, base_url: str = "http://localhost:3001"):
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.ws_url = self.base_url.replace('http', 'ws') + '/ws/signals'
        self.session = requests.Session()
        self.session.headers.update({
            "x-api-key": self.api_key,
            "Content-Type": "application/json"
        })

    # ──────────────────────────────────────────────────────────────────────────
    # Health
    # ──────────────────────────────────────────────────────────────────────────

    def ping(self) -> bool:
        """Check if the Agent API is reachable."""
        try:
            res = self.session.get(f"{self.base_url}/health", timeout=5)
            return res.status_code == 200
        except Exception:
            return False

    def health(self) -> Dict[str, Any]:
        """Get detailed health status of the agent."""
        res = self.session.get(f"{self.base_url}/health", timeout=5)
        res.raise_for_status()
        return res.json()

    # ──────────────────────────────────────────────────────────────────────────
    # Strategy Execution
    # ──────────────────────────────────────────────────────────────────────────

    def execute(
        self,
        strategy: str,
        params: Dict[str, Any] = {},
        asset: Literal["SUI", "USDC"] = "SUI"
    ) -> Dict[str, Any]:
        """
        Execute a strategy autonomously on Sui Testnet.

        Args:
            strategy (str): Strategy identifier (e.g. 'atomic-flash-loan', 'sui-usdc-loop')
            params (dict):  Execution parameters (amount, minProfit, etc.)
            asset (str):    Vault asset — 'SUI' (default) or 'USDC'

        Returns:
            dict: { success, txHash, profit, suiscanUrl, ... }

        Example:
            # SUI flash loan
            result = agent.execute("atomic-flash-loan", {"amount": 1.0}, asset="SUI")

            # USDC vault strategy
            result = agent.execute("usdc-yield-loop", {"amount": 100.0}, asset="USDC")
        """
        try:
            res = self.session.post(
                f"{self.base_url}/api/execute",
                json={"strategy": strategy, "params": params, "asset": asset},
                timeout=30
            )
            res.raise_for_status()
            return res.json()
        except requests.exceptions.RequestException as e:
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    raise Exception(f"Execution failed: {error_data.get('error', str(e))}")
                except ValueError:
                    pass
            raise Exception(f"Execution failed: {str(e)}")

    def execute_demo(
        self,
        strategy: str = "atomic-flash-loan",
        asset: Literal["SUI", "USDC"] = "SUI"
    ) -> Dict[str, Any]:
        """
        Public demo execution (no API key required).
        Simulates the flash loan flow without real on-chain execution.

        Args:
            strategy (str): Strategy to simulate
            asset (str):    'SUI' or 'USDC'
        """
        res = self.session.post(
            f"{self.base_url}/api/execute-demo",
            json={"strategy": strategy, "asset": asset},
            timeout=15
        )
        res.raise_for_status()
        return res.json()

    # ──────────────────────────────────────────────────────────────────────────
    # Market Data
    # ──────────────────────────────────────────────────────────────────────────

    def get_market(self) -> Dict[str, Any]:
        """
        Get live market state: SUI price, gas, DeepBook liquidity, Scallop APY, Navi USDC APY.

        Returns:
            dict: { suiPrice, gasPrice, deepBookLiquidity, scallopApy, naviUsdcApy, lastUpdate }
        """
        res = self.session.get(f"{self.base_url}/api/market", timeout=10)
        res.raise_for_status()
        return res.json()

    def get_signals(self, limit: int = 10) -> Dict[str, Any]:
        """
        Get recent market signals (arbitrage, flash loan opportunities, gas spikes).

        Args:
            limit (int): Number of signals to return (max 50)
        """
        res = self.session.get(
            f"{self.base_url}/api/signals/recent",
            params={"limit": min(limit, 50)},
            timeout=10
        )
        res.raise_for_status()
        return res.json()

    # ──────────────────────────────────────────────────────────────────────────
    # Autonomous Loop Control
    # ──────────────────────────────────────────────────────────────────────────

    def get_loop_status(self) -> Dict[str, Any]:
        """Get the current autonomous market scanner status."""
        res = self.session.get(f"{self.base_url}/api/loop/status", timeout=10)
        res.raise_for_status()
        return res.json()

    def start_loop(self, config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Start the autonomous market scanner.

        Args:
            config (dict, optional): {
                minProfitPercentage: float,  # e.g. 0.1 (= 0.1%)
                maxGasPrice: int,            # e.g. 5000 MIST
                minLiquidity: int,           # e.g. 10000
                minConfidence: int           # e.g. 60 (percentage)
            }
        """
        res = self.session.post(
            f"{self.base_url}/api/loop/start",
            json={"config": config or {}},
            timeout=10
        )
        res.raise_for_status()
        return res.json()

    def stop_loop(self) -> Dict[str, Any]:
        """Stop the autonomous market scanner."""
        res = self.session.post(f"{self.base_url}/api/loop/stop", timeout=10)
        res.raise_for_status()
        return res.json()

    def trigger_scan(self) -> Dict[str, Any]:
        """Manually trigger a single market scan cycle."""
        res = self.session.post(f"{self.base_url}/api/loop/scan", timeout=15)
        res.raise_for_status()
        return res.json()

    # ──────────────────────────────────────────────────────────────────────────
    # WebSocket Signal Stream
    # ──────────────────────────────────────────────────────────────────────────

    async def listen(self, subscription_id: Optional[str] = None) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Connect to the real-time signal stream and yield market events.

        Args:
            subscription_id (str, optional): Filter events to a specific subscription.

        Usage:
            async for signal in agent.listen():
                print(signal['type'], signal.get('pair'))
                if signal.get('confidence', 0) > 80:
                    agent.execute("atomic-flash-loan", asset="SUI")
        """
        async with websockets.connect(
            self.ws_url,
            extra_headers={"x-api-key": self.api_key}
        ) as ws:
            print("🔌 Connected to SuiLoop Agent Signal Stream")

            # Authenticate
            await ws.send(json.dumps({"type": "auth", "apiKey": self.api_key}))

            # Subscribe to filtered stream if subscription_id provided
            if subscription_id:
                await ws.send(json.dumps({
                    "type": "subscribe",
                    "subscriptionId": subscription_id
                }))

            while True:
                try:
                    message = await ws.recv()
                    data = json.loads(message)
                    yield data
                except websockets.exceptions.ConnectionClosed:
                    print("🔌 Signal stream disconnected.")
                    break
                except Exception as e:
                    print(f"⚠️  Stream error: {e}")

    # ──────────────────────────────────────────────────────────────────────────
    # Subscriptions
    # ──────────────────────────────────────────────────────────────────────────

    def create_subscription(
        self,
        signal_types: list = None,
        min_confidence: int = 60,
        min_profit_pct: float = 0.1,
        pairs: list = None
    ) -> Dict[str, Any]:
        """
        Create a filtered signal subscription.

        Args:
            signal_types (list): e.g. ['arbitrage_opportunity', 'flash_loan_opportunity']
            min_confidence (int): Minimum signal confidence (0-100)
            min_profit_pct (float): Minimum expected profit percentage
            pairs (list): e.g. ['SUI/USDC']

        Returns:
            dict: { subscriptionId, websocketUrl, ... }
        """
        res = self.session.post(
            f"{self.base_url}/api/subscriptions",
            json={
                "signalTypes": signal_types or ["arbitrage_opportunity", "flash_loan_opportunity"],
                "minConfidence": min_confidence,
                "minProfitPercentage": min_profit_pct,
                "pairs": pairs or ["SUI/USDC"],
                "connectionType": "websocket"
            },
            timeout=10
        )
        res.raise_for_status()
        return res.json()
