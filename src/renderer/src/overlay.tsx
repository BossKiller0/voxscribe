import React from 'react'
import ReactDOM from 'react-dom/client'
import { FloatingMicOverlay } from './components/FloatingMicOverlay'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <FloatingMicOverlay />
  </React.StrictMode>
)
