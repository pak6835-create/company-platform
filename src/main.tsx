import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SiteProvider } from './context/SiteContext'
import { ThemeProvider } from './context/ThemeContext'
import App from './App'
import './index.css'

const basename = import.meta.env.BASE_URL

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <ThemeProvider>
        <SiteProvider>
          <App />
        </SiteProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
