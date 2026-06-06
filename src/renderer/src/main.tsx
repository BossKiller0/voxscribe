import React from 'react'
import ReactDOM from 'react-dom/client'
import { DashboardApp } from './apps/DashboardApp'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <DashboardApp />
  </React.StrictMode>
)
