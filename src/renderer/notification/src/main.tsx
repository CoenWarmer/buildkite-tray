import React from 'react'
import ReactDOM from 'react-dom/client'
import NotificationApp from './NotificationApp'
import '../../main/src/index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <NotificationApp />
  </React.StrictMode>
)
