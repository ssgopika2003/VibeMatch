# VibeMatch

VibeMatch is a full-stack fashion discovery and shopping application. It uses a style quiz and user preferences to surface products and coordinated looks, with account, cart, order, and administration workflows.

## Key Features

- Style quiz and profile preferences for vibe, undertone, silhouette, and seasonal palette
- Personalized product and outfit recommendations, including gender-based product filtering
- Product browsing, search, favorites, cart, and order history
- Optional AI-assisted styling and similar-product recommendations, with non-AI fallbacks
- Admin tools and analytics for managing the shopping experience
- Razorpay checkout integration, configurable for test use
- Responsive React interface with virtual outfit preview

## Technology Stack

- Frontend: React 18, Vite, Tailwind CSS, React Router, Zustand
- Backend: Node.js, Express, Mongoose, MongoDB
- Authentication: JSON Web Tokens and bcrypt
- Optional integrations: Gemini/Ollama AI and Razorpay

## Screenshots

### Home

![VibeMatch home page](docs/screenshots/home.png)

Use real screenshots of the running application; do not include account details, customer data, or credentials.

## System Architecture

The React/Vite client calls the Express REST API. The API uses Mongoose for MongoDB persistence, JWT middleware for protected routes, and separate route/model/service modules for application features. AI and payment integrations are optional and configured through environment variables.

## Project Structure

```text
client/                 React application, pages, components, and static assets
server/
  controllers/           Request-level application logic
  middleware/            Authentication and request middleware
  models/                Mongoose schemas
  routes/                REST API endpoints
  services/              AI integration services
  server.js              Express entry point
  seed.js                Database seeding utility
docs/                   Project documentation and screenshots
.env.example            Safe environment-variable template
package.json            Backend and development scripts
```

## Installation

Prerequisites: Node.js 18 or newer and a MongoDB instance. An Atlas URI or local MongoDB URI can be used.

Install dependencies from the repository root:

```sh
npm install
npm --prefix client install
```

Copy `.env.example` to `.env` and set the values for your own development environment. Keep `.env` local; never commit credentials.

PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```sh
cp .env.example .env
```

## Environment Variables

At minimum, configure `MONGODB_URI` and a unique `JWT_SECRET`. Payment and AI credentials are optional. Use test credentials for payment development, and leave integrations disabled when they are not configured.

## Running Locally

Start the API and Vite development server together:

```sh
npm run dev
```

The client is available at `http://localhost:5173`; the API runs at `http://localhost:5000`. Build the client with:

```sh
npm run build
```

## API / Backend

The API is organized under `server/routes/` and mounted at `/api`. It includes authentication, products, recommendations, users, orders, admin, analytics, and chat routes. The health endpoint is `GET /api/health`.

## What I Learned

This section is intentionally left for project-specific reflections. Add the parts you personally implemented and can confidently explain in an interview.

## Security Notes

- `.env` and other local environment files are ignored by Git; only `.env.example` belongs in the repository.
- Never put database credentials, JWT secrets, payment secrets, or AI keys in source code or screenshots.
- If a credential has been shared or exposed, revoke or rotate it with its provider.