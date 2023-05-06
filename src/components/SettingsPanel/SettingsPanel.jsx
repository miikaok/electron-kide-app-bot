import React, { useContext } from "react";
import styles from "./SettingsPanel.module.css";

// Components
import { Card, Elevation } from "@blueprintjs/core";

// Context
import { AppContext } from "../../App";

const SettingsPanel = () => {
  const context = useContext(AppContext);

  const handleThreadCountChange = (e) => {
    const value = e.target.value;
    context.setStore((store) => ({ ...store, threadCount: value }));
  };

  const handleThreadDelayChange = (e) => {
    const value = e.target.value;
    context.setStore((store) => ({ ...store, threadDelay: value }));
  };

  const handleRequestTimeoutChange = (e) => {
    const value = e.target.value;
    context.setStore((store) => ({ ...store, requestTimeout: value }));
  };

  return (
    <Card elevation={Elevation.TWO} className={styles.SettingsPanel}>
      <h3>Bot Settings</h3>
      <p>
        The default settings have been benchmarked and are considered the best in most cases. If you
        change these settings, you should be able to reach over 75% rate when running the bot for more
        than 5 minutes.
      </p>
      <div className={styles.SettingsRow}>
        <span>Thread Count</span>
        <div className="bp4-input-group">
          <input
            type="number"
            className="bp4-input"
            placeholder="Enter a thread count..."
            onChange={handleThreadCountChange}
            value={context.store.threadCount}
          />
        </div>
      </div>
      <div className={styles.SettingsRow}>
        <span>Thread Delay (ms)</span>
        <div className="bp4-input-group">
          <input
            type="number"
            className="bp4-input"
            placeholder="Enter a thread delay..."
            onChange={handleThreadDelayChange}
            value={context.store.threadDelay}
          />
        </div>
      </div>
      <div className={styles.SettingsRow}>
        <span>Request Timeout (ms)</span>
        <div className="bp4-input-group">
          <input
            type="number"
            className="bp4-input"
            placeholder="Enter a request timeout..."
            onChange={handleRequestTimeoutChange}
            value={context.store.requestTimeout}
          />
        </div>
      </div>
    </Card>
  );
};

export default SettingsPanel;
