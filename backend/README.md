# PowerSetter Backend

Backend API service for the PowerSetter application.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The server will run on port 3001 by default.

## Endpoints

- `GET /health` - Health check endpoint
- `GET /api/powersetter` - PowerSetter API endpoint