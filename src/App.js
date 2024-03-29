import React, { useState, createContext } from "react";

import Header from "./components/Header";

import useStickyState from "./hooks/useStickyState";

import UserWindow from "./layout/UserWindow";
import EventWindow from "./layout/EventWindow";
import BotWindow from "./layout/BotWindow";

export const AppContext = createContext();

// Contains the default values for the store
export const storeConfig = {
  eventId: null,
  users: [],
  threadCount: 18,
  threadDelay: 1350,
  requestTimeout: 4500,
  strictPriority: false,
  useCustomCount: false,
  autoStop: false,
  priorityItems: [],
  darkMode: false,
};

// Contains the default values for the temporary store
export const temporaryStoreConfig = {
  botStatus: "stopped",
  bearerToken: null,
  tokenExpires: null,
  showLogin: false,
  ticketBuyCount: 1,
  threads: [],
  stats: {
    request_sent: 0,
    request_error: 0,
    request_success: 0,
    no_available_variants: 0,
    buy_attempts: 0,
    strict_skips: 0,
    buy_success: 0,
    buy_failed: 0,
    in_cart: 0,
  }
};

const styles = {
  display: "flex",
  flexDirection: "column",
  marginInline: "auto",
  padding: "0 1rem",
  maxWidth: "1240px",
  height: "100%"
};

function App() {
  const [store, setStore] = useStickyState(storeConfig, "appStore");
  const [temporaryStore, setTemporaryStore] = useState(temporaryStoreConfig);

  // Check if the token has expired
  if (temporaryStore?.tokenExpires != null) {
    if (temporaryStore.tokenExpires < Date.now()) {
      setTemporaryStore({ ...temporaryStore, showLogin: false });
      setTemporaryStore({ ...temporaryStore, bearerToken: null, tokenExpires: null });
    }
  }

  // Handle dark mode
  const body = document.getElementsByTagName("body")[0];
  if (store.darkMode) {
    body.style.backgroundColor = "#252a31";
  } else {
    body.style.backgroundColor = "#ffffff";
  }

  return (
    <AppContext.Provider value={{ store, setStore, temporaryStore, setTemporaryStore }}>
      <div className={store.darkMode ? "bp4-dark" : "bp4"} style={styles}>
        <Header />
        {(temporaryStore.bearerToken == null || temporaryStore.showLogin) && <UserWindow />}
        {temporaryStore.bearerToken != null && store.eventId == null && <EventWindow />}
        {temporaryStore.bearerToken != null && store.eventId != null && <BotWindow />}
      </div>
    </AppContext.Provider>
  );
}

export default App;
