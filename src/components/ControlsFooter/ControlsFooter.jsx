/** @format */

import React, { useContext } from "react";
import styles from "./ControlsFooter.module.css";

// Context
import { AppContext } from "../../App";

// Components
import { Button } from "@blueprintjs/core";

// Logic
import threadWorker from "../../logic/thread.worker.js";

const ControlsFooter = () => {
  const context = useContext(AppContext);
  const status = context.temporaryStore?.botStatus;

  const { autoStop } = context.store;

  const increaseStatCount = (stat) => {
    context.setTemporaryStore((store) => ({
      ...store,
      stats: {
        ...store.stats,
        [stat]: store.stats[stat] + 1,
      },
    }));
  };

  const handleWorker = (event) => {
    const { type: messageType } = event.data;

    switch (messageType) {
      case "request_start":
        increaseStatCount("request_sent");
        break;
      case "request_error":
        increaseStatCount("request_error");
        break;
      case "request_success":
        increaseStatCount("request_success");
        break;
      case "no_available_variants":
        increaseStatCount("no_available_variants");
        break;
      case "buy_attempt":
        increaseStatCount("buy_attempts");
        break;
      case "strict_skip":
        increaseStatCount("strict_skips");
        break;
      case "buy_success":
        increaseStatCount("buy_success");
        if (autoStop) handleStopBot();
        break;
      case "buy_failed":
        increaseStatCount("buy_failed");
        break;
      case "in_cart":
        increaseStatCount("in_cart");
        break;
      default:
        break;
    }
  };

  const handleStartBot = async () => {
    context.setTemporaryStore((store) => ({
      ...store,
      botStatus: "booting",
    }));

    // Create new thread for each threadCount
    for (let i = 0; i < context.store?.threadCount; i++) {
      // Create new thread
      const thread = new threadWorker();

      // Post settings for each thread
      thread.postMessage({
        eventID: context.store?.eventId,
        threadDelay: context.store?.threadDelay,
        requestTimeout: context.store?.requestTimeout,
        strictPriority: context.store?.strictPriority,
        priorityItems: context.store?.priorityItems,
        bearerToken: context.temporaryStore?.bearerToken,
        useCustomCount: context.store?.useCustomCount,
        ticketBuyCount: context.temporaryStore?.ticketBuyCount,
      });

      thread.onmessage = (e) => {
        handleWorker(e);
      };

      // Add each thread to temporary store
      context.setTemporaryStore((store) => ({
        ...store,
        threads: [...store.threads, thread],
      }));

      // Wait 85ms for the thread to boot up
      await new Promise((resolve) => setTimeout(resolve, 85));
    }

    // Set bot status to running
    context.setTemporaryStore((store) => ({
      ...store,
      botStatus: "running",
    }));
  };

  const handleStopBot = () => {
    const threads = context.temporaryStore.threads;

    // Terminate each thread
    threads.forEach((thread) => {
      thread.terminate();
    });

    // Clear threads from temporary store
    context.setTemporaryStore((store) => ({ ...store, threads: [] }));

    // Set bot status to stopped
    context.setTemporaryStore((store) => ({
      ...store,
      botStatus: "stopped",
    }));
  };

  const handleGoBack = () => {
    context.setStore((store) => ({ ...store, eventId: null, priorityItems: [] }));
  };

  const allowBotStart = () => {
    if (context.store?.threadCount === "") return false;
    if (context.store?.threadDelay === "") return false;
    if (context.store?.requestTimeout === "") return false;

    // Check if any of the values are less than 1 or not numbers
    if (context.store?.threadCount < 1) return false;
    if (context.store?.threadDelay < 1) return false;
    if (context.store?.requestTimeout < 1) return false;

    if (context.store?.threadCount % 1 !== 0) return false;
    if (context.store?.threadDelay % 1 !== 0) return false;
    if (context.store?.requestTimeout % 1 !== 0) return false;

    if (isNaN(context.temporaryStore?.ticketBuyCount)) return false;
    if (context.temporaryStore?.ticketBuyCount < 1) return false;

    // Check if there are any priority items with empty values
    if (context.store.priorityItems.length > 0) {
      const emptyPriorityItems = context.store.priorityItems.filter((item) => item.value === "");
      if (emptyPriorityItems.length > 0) return false;
    }
    return true;
  };

  return (
    <div className={styles.ControlsFooter}>
      <div>
        <Button
          icon="arrow-left"
          intent="danger"
          text="Go Back"
          disabled={status !== "stopped"}
          onClick={() => handleGoBack()}
        />
      </div>
      <div>
        <Button
          icon="stop"
          intent="danger"
          onClick={() => handleStopBot()}
          disabled={status === "stopped" || status === "booting"}
          text="Stop Bot"
        />
        <Button
          icon="play"
          intent="success"
          onClick={() => handleStartBot()}
          disabled={!allowBotStart() || status === "running" || status === "booting"}
          text="Start Bot"
        />
      </div>
    </div>
  );
};

export default ControlsFooter;
