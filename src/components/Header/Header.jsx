import React, { useContext } from "react";
import styles from "./Header.module.css";

// Components
import { Button } from "@blueprintjs/core";

// Configs
import { storeConfig, temporaryStoreConfig } from "../../App.js";

// Context
import { AppContext } from "../../App";

const Header = () => {
  const context = useContext(AppContext);

  const handleDarkMode = () => {
    context.setStore((store) => ({
      ...store,
      darkMode: !store.darkMode,
    }));
  };

  const handleLogout = () => {
    context.setTemporaryStore((store) => ({
      ...store,
      bearerToken: null,
      expires: null,
    }));
  };

  const handleResetBot = () => {
    context.setStore(storeConfig);
    context.setTemporaryStore(temporaryStoreConfig);
  };

  const disableControls = context.temporaryStore.botStatus !== "stopped";

  return (
    <header className={styles.HeaderContainer}>
      <div className={styles.ControlsLeft}>
        <Button icon={context.store.darkMode ? "flash" : "moon"} onClick={() => handleDarkMode()} />
      </div>
      <div className={styles.Header}>
        <h2 className="bp4-heading">Kide.app | Ticket Bot</h2>
        <h6 className="bp4-heading">
          NextGen Ticket Bot <span className={styles.Detail}>version 2.3</span>
        </h6>
      </div>
      <div className={styles.ControlsRight}>
        <Button icon="refresh" disabled={disableControls} onClick={() => handleResetBot()} />
        {context.temporaryStore.bearerToken && (
          <Button icon="log-out" disabled={disableControls} onClick={() => handleLogout()} />
        )}
      </div>
    </header>
  );
};

export default Header;
