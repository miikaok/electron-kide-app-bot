/** @format */

import React, { useContext, useEffect, useState } from "react";
import styles from "./InfoPanel.module.css";

// Axios
import axios from "axios";

// Components
import { Button, Card, Elevation, Spinner } from "@blueprintjs/core";

// Context
import { AppContext } from "../../App";

const InfoPanel = () => {
  const context = useContext(AppContext);
  const eventId = context.store?.eventId;

  // Component state
  const [event, setEvent] = useState(null);

  useEffect(() => {
    fetchEvent();
  }, []);

  const handleRefresh = () => {
    setEvent(null);
    setTimeout(() => {
      fetchEvent();
    }, 300);
  };

  const fetchEvent = async () => {
    try {
      const response = await axios.get(`https://api.kide.app/api/products/${eventId}`);
      setEvent(response.data.model);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Card elevation={Elevation.TWO} className={styles.InfoPanel}>
      {event != null ? (
        <>
          <div className={styles.EventInfoContainer}>
            <h3>{event.product.name}</h3>
            {event.product.salesOngoing ? (
              <span className={styles.OnSaleLabel}>On Sale</span>
            ) : (
              <span className={styles.OffSaleLabel}>
                Not On Sale (will begin at {event.product.dateSalesFrom})
              </span>
            )}
            <span>Current Availability: {event.product.availability ?? "Unknown"}</span>
          </div>
          <Button onClick={() => handleRefresh()}>Refresh Information</Button>
        </>
      ) : (
        <div className={styles.LoadingContainer}>
          <Spinner aria-label="Loading..." />
        </div>
      )}
    </Card>
  );
};

export default InfoPanel;
