import React, { useContext } from "react";

// Components
import InfoPanel from "../../components/InfoPanel";
import SettingsPanel from "../../components/SettingsPanel";
import PriorityPanel from "../../components/PriorityPanel";
import ControlsFooter from "../../components/ControlsFooter";

// Context
import { AppContext } from "../../App";
import BootPanel from "../../components/BootPanel";
import StatsPanel from "../../components/StatsPanel";

const styles = {
  height: "100%",
  overflowY: "auto",
};

const BotWindow = () => {
  const context = useContext(AppContext);
  const status = context.temporaryStore.botStatus;

  return (
    <section>
      {status === "stopped" ? (
        <div style={styles}>
          <InfoPanel />
          <SettingsPanel />
          <PriorityPanel />
        </div>
      ) : (
        <div style={styles}>
          {status === "booting" && <BootPanel />}
          {status === "running" && <StatsPanel />}
        </div>
      )}
      <ControlsFooter />
    </section>
  );
};

export default BotWindow;
