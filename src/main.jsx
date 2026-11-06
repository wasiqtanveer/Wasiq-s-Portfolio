import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const mount = () => createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Mounting the app is one long task (~0.4 s). Started straight away it lands
// before the browser's first paint, so the preloader in index.html only shows
// up once it is over. Waiting one frame lets the preloader paint first.
if (window.__boot) requestAnimationFrame(() => setTimeout(mount, 0))
else mount()
