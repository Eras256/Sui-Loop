# 🧪 Testing Guide

SuiLoop uses **Jest** for unit/integration testing and **Synthetic Mode** for AI simulation.

## 🚀 Quick Start
Run all tests across the monorepo:

```bash
pnpm test
```

## 🏗️ Test Structure

### 1. Unit Tests (`*.test.ts`)
Located alongside source files. Test individual functions and services locally.
- **Mocking**: Use `jest.mock()` to bypass external calls (Sui RPC, OpenAI).

### 2. Integration Tests
Test interaction between services (e.g., Scheduler -> SkillManager).
- **Environment**: Runs in-memory without real network calls.

### 3. AI Synthetic Mode
To test the Agent's decision making flow without spending money:
1. Set `LLM_PROVIDER=synthetic` in `.env`.
2. Run the agent. It will use the mock provider defined in `llmService.ts`.

## 🛠️ Writing Tests

**Example Service Test:**

```typescript
import { MyService } from './myService';

describe('MyService', () => {
    it('should initialize correctly', () => {
        const service = new MyService();
        expect(service.isReady).toBe(true);
    });
});
```

## 🔍 CI/CD Pipeline
GitHub Actions automatically runs `pnpm test` on every PR.
Ensure all tests pass before submitting.
