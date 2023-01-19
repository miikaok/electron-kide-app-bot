import React, { createContext } from 'react'

import Header from './components/Header'
import EventPreview from './components/EventPreview'
import Controls from './components/Controls'

import useStickyState from './hooks/useStickyState'
import LoginPanel from './components/LoginPanel'

export const AppContext = createContext()

function App() {
  const [value, setValue] = useStickyState(
    {
      eventID: null,
      bearerToken: null,
      tokenExpires: null,
      threadCount: 10,
      threadDelay: 200,
      requestTimeout: 500,
      strictPriority: false,
      priorityItems: []
    },
    'appState'
  )

  // Check if the token has expired
  if (value?.tokenExpires != null) {
    if (value.tokenExpires < Date.now()) {
      setValue({ ...value, bearerToken: null, tokenExpires: null })
    }
  }

  return (
    <AppContext.Provider value={{ value, setValue }}>
      <div className="bp4-dark" style={{ marginInline: '40px' }}>
        <Header />
        {value?.eventID == null ? (
          <EventPreview />
        ) : (
          <>{value?.bearerToken === null ? <LoginPanel /> : <Controls />}</>
        )}
      </div>
    </AppContext.Provider>
  )
}

export default App
