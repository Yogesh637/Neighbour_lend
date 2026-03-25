# AI Coding Agent Instructions for NeighbourLend Frontend

## Project Overview
NeighbourLend is a React + Vite application for a peer-to-peer item rental marketplace. Users can browse items by category, list items for rent, and manage their bookings.

**Key Architecture:**
- **Frontend Stack**: React 19, Vite 7, React Router 7, Axios
- **Backend Integration**: Vite proxy routes requests to `http://localhost:8152` (see [vite.config.js](vite.config.js#L8))
- **State Management**: React Context (AuthContext) for authentication; local component state for UI

## Critical Workflows

### Development & Builds
- **Start dev server**: `npm run dev` – runs Vite with HMR on default port, proxies `/api`, `/auth`, `/users`, `/items`, `/bookings` to backend
- **Build for production**: `npm run build` – outputs to dist/
- **Lint**: `npm run lint` – ESLint checks configured in [eslint.config.js](eslint.config.js)
- **Preview build**: `npm run preview`

### Authentication Flow
1. User enters credentials at [Login.jsx](src/pages/Auth/Login.jsx) or [Register.jsx](src/pages/Auth/Register.jsx)
2. [AuthContext.jsx](src/context/AuthContext.jsx) handles `login()` and `register()` calls via API
3. JWT token stored in localStorage; decoded on mount to restore user session
4. [axios.js](src/api/axios.js) interceptor auto-attaches `Authorization: Bearer {token}` header to all requests
5. [App.jsx](src/App.jsx) wraps routes with `ProtectedRoute` for `/my-bookings`

## Project Structure & Patterns

### API Communication
- All API calls use `api` instance from [src/api/axios.js](src/api/axios.js)
- Base URL: `http://localhost:8152` (backend must be running)
- Request/response pattern: `api.get('/items')`, `api.post('/auth/login', {...})`
- Backend endpoints: `/items`, `/bookings`, `/auth/login`, `/users/register`

### Component Patterns
- **Functional components with hooks**: All components use React 19 hooks (useState, useEffect, useContext)
- **Modal pattern**: [AddItemModal.jsx](src/components/AddItemModal.jsx) and [RentModal.jsx](src/components/RentModal.jsx) use state to control visibility
- **Navbar layout**: [Navbar.jsx](src/components/Navbar.jsx) shows conditional nav based on `user` from AuthContext
- **Item listing**: [Dashboard.jsx](src/pages/Dashboard/Dashboard.jsx) demonstrates filtering by category/search, sorting, and pagination pattern
- **Error handling**: Simple try-catch in API calls with user-facing error messages (see Login.jsx)

### Styling
- Global styles in [index.css](src/index.css) and [App.css](src/App.css)
- Inline styles used sparingly (e.g., flexbox layouts in Navbar)
- CSS classes: `.btn-primary`, `.input-field`, `.auth-container`, `.navbar`, etc.

## Common Tasks

### Adding a New Page
1. Create file in `src/pages/{PageName}/{PageName}.jsx`
2. Import `useAuth()` if auth is needed; wrap in `ProtectedRoute` in [App.jsx](src/App.jsx) if protected
3. Use `api.get()` / `api.post()` for data fetching within `useEffect()`
4. Example: [MyBookings.jsx](src/pages/Bookings/MyBookings.jsx)

### Adding a New Component
1. Create in `src/components/{ComponentName}.jsx`
2. Accept props for data/callbacks; use hooks for local state
3. Example: [ItemCard.jsx](src/components/ItemCard.jsx) – receives item data and onClick handlers

### Modifying Authentication
- Token logic lives in [AuthContext.jsx](src/context/AuthContext.jsx) – JWT parsing via `atob(token.split('.')[1])`
- localStorage key: `'token'`
- Always export `useAuth` hook for component access

### API Integration
- All requests go through [src/api/axios.js](src/api/axios.js)
- Vite dev server proxies requests (no CORS issues in dev)
- Backend URL hardcoded; change in axios.js `baseURL` if needed

## Key Files Reference
| File | Purpose |
|------|---------|
| [App.jsx](src/App.jsx) | Routes, AuthProvider wrapper, ProtectedRoute |
| [AuthContext.jsx](src/context/AuthContext.jsx) | Auth state, login/logout/register, JWT parsing |
| [axios.js](src/api/axios.js) | API client with Bearer token interceptor |
| [Dashboard.jsx](src/pages/Dashboard/Dashboard.jsx) | Main marketplace page with filtering/sorting |
| [Navbar.jsx](src/components/Navbar.jsx) | Header with conditional nav based on auth state |
| [vite.config.js](vite.config.js) | Vite config with backend proxy routes |

## Notes for Agents
- Backend must be running on port 8152 for API calls to work
- Restart `npm run dev` after changes to vite.config.js
- Check browser console for API errors when features break
- Token validation happens silently in AuthContext; check localStorage if auth seems stuck
