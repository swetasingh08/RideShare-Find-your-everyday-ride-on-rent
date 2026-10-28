import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.jsx'
import {BrowserRouter} from 'react-router-dom'
import {AppProvider} from './context/AppContext.jsx'
import {MotionConfig} from 'motion/react'
import {ClerkProvider} from '@clerk/clerk-react'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error('VITE_CLERK_PUBLISHABLE_KEY is missing from client/.env')
}

createRoot(document.getElementById('root')).render(
  <ClerkProvider
    publishableKey={publishableKey}
    // Pins the organization as active so the signed-in user's role is present in
    // the session token the backend verifies. Without it the token has no
    // organization claim and the server has to make an extra lookup per request.
    organizationSlug={import.meta.env.VITE_CLERK_ORG_SLUG || undefined}
  >
    <AppErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <MotionConfig viewport={{once: true}}>
            <App />
          </MotionConfig>
        </AppProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  </ClerkProvider>,
)
