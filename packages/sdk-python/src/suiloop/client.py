import requests
import json
import asyncio
import websockets
from typing import Optional, Dict, Any, Callable, AsyncGenerator

class Agent:
    def __init__(self, api_key: str, base_url: str = "http://localhost:3001"):
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.ws_url = self.base_url.replace('http', 'ws') + '/ws/signals'
        self.session = requests.Session()
        self.session.headers.update({
            "x-api-key": self.api_key,
            "Content-Type": "application/json"
        })

    def ping(self) -> bool:
        """Check if the Agent API is reachable."""
        try:
            res = self.session.get(f"{self.base_url}/health")
            return res.status_code == 200
        except:
            return False

    def execute(self, strategy: str, params: Dict[str, Any] = {}) -> Dict[str, Any]:
        """
        Execute a strategy autonomously.
        
        Args:
            strategy (str): The strategy identifier (e.g., 'atomic-flash-loan')
            params (dict): Parameters for execution
            
        Returns:
            dict: The execution result
        """
        try:
            res = self.session.post(f"{self.base_url}/api/execute", json={
                "strategy": strategy,
                "params": params
            })
            res.raise_for_status()
            return res.json()
        except requests.exceptions.RequestException as e:
            if e.response is not None:
                try:
                    error_data = e.response.json()
                    raise Exception(f"Execution failed: {error_data.get('error', str(e))}")
                except:
                    pass
            raise Exception(f"Execution failed: {str(e)}")

    async def listen(self) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Connect to the signal stream and yield market events in real-time.
        Usage:
            async for signal in agent.listen():
                print(signal)
        """
        async with websockets.connect(self.ws_url) as websocket:
            print("🔌 Connected to Agent Signal Stream")
            
            # Authenticate
            await websocket.send(json.dumps({
                "type": "auth",
                "apiKey": self.api_key
            }))
            
            while True:
                try:
                    message = await websocket.recv()
                    data = json.loads(message)
                    yield data
                except websockets.exceptions.ConnectionClosed:
                    print("Connection closed")
                    break
                except Exception as e:
                    print(f"Error reading stream: {e}")
