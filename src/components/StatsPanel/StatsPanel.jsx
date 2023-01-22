import React, { useContext } from "react";
import styles from "./StatsPanel.module.css";

// Context
import { AppContext } from "../../App";

const StatsPanel = () => {
  const context = useContext(AppContext);
  const { stats } = context.temporaryStore;

  return (
    <div className={styles.StatsPanel}>
      <h2>Session Stats</h2>
      <div className={styles.StatsContainer}>
        <span>
          Requests: <span className={styles.SuccessSpan}>{stats.request_success} success</span> /{" "}
          <span className={styles.ErrorSpan}>{stats.request_error} failed</span>
        </span>
        <span>
          Reserve Requests: <span className={styles.SuccessSpan}>{stats.buy_success} success</span> /{" "}
          <span className={styles.ErrorSpan}>{stats.buy_failed} failed</span>
        </span>
        <span>Total Reserve Attempts: {stats.buy_attempts}</span>
        <h2>Skip Stats</h2>
        <span>Total Skips: {stats.no_available_variants + stats.strict_skips + stats.in_cart}</span>
        <span>Due already in cart: {stats.in_cart}</span>
        <span>Due strict variants: {stats.strict_skips}</span>
        <span>Due unavailable variants: {stats.no_available_variants}</span>
      </div>
    </div>
  );
};

export default StatsPanel;
