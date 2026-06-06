import React from 'react'
import ReactDOM from 'react-dom/client'
import { CommandPaletteApp } from './apps/CommandPaletteApp'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <CommandPaletteApp />
  </React.StrictMode>
)
