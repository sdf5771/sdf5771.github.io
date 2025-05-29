import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './initialize.css'
import './global.css'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/sdf5771.github.io">
      <App />
    </BrowserRouter>
  </StrictMode>,
)
