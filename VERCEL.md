# Deploying SuiLoop to Vercel

To deploy the **SuiLoop Web Interface** to Vercel, follow these optimized settings:

### Project Settings
- **Framework Preset**: Next.js
- **Root Directory**: `packages/web`
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`

### Environment Variables
| Variable | Value (Example) |
| :--- | :--- |
| `NEXT_PUBLIC_SUI_NETWORK` | `testnet` |
| `NEXT_PUBLIC_API_URL` | `https://your-agent-backend.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` |
| `NEXT_PUBLIC_PACKAGE_ID` | `0x...` |

### Rewrites Note
The project is configured to use `NEXT_PUBLIC_API_URL` to proxy `/api` requests to your agent backend. Ensure this is set correctly in Vercel to avoid CORS issues if your backend doesn't support them directly.
