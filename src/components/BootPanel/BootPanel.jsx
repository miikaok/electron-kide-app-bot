import React, { useContext } from "react";
import styles from "./BootPanel.module.css";

// Context
import { AppContext } from "../../App";

const BootPanel = () => {
  const context = useContext(AppContext);

  const { threads } = context.temporaryStore;
  const progress = Math.round((threads.length / context.store.threadCount) * 100);

  return (
    <div className={styles.RunningStatsProgress}>
      <div className={styles.LoaderContainer}>
        <h3>
          Booting Threads ({threads.length} /{context.store.threadCount}) ...
        </h3>
        <div className="bp4-progress-bar bp4-intent-primary">
          <div
            className="bp4-progress-meter"
            style={{
              width: progress + "%",
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default BootPanel;
