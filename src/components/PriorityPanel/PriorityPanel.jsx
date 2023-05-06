/** @format */

import React, { useContext } from "react";
import styles from "./PriorityPanel.module.css";

// Components
import { Card, Elevation, Button, Switch, NumericInput } from "@blueprintjs/core";

// Context
import { AppContext } from "../../App";

const PriorityPanel = () => {
  const context = useContext(AppContext);
  const priorityItems = context.store.priorityItems;

  const setPriorityItems = (items) => {
    context.setStore((store) => ({ ...store, priorityItems: items }));
  };

  const handleAddPriorityItem = () => {
    const items = [...priorityItems];

    const newPriorityItem = {
      id: items.length + 1,
      value: "",
    };

    items.push(newPriorityItem);
    setPriorityItems(items);
  };

  const handlePriorityItemUp = (id) => {
    const items = [...priorityItems];
    const index = items.findIndex((item) => item.id === id);

    if (index > 0) {
      const temp = items[index - 1];
      items[index - 1] = items[index];
      items[index] = temp;
    }

    // Reorder the items based on their id
    items.forEach((item, index) => {
      item.id = index + 1;
    });

    setPriorityItems(items);
  };

  const handlePriorityItemDown = (id) => {
    const items = [...priorityItems];
    const index = items.findIndex((item) => item.id === id);

    if (index < items.length - 1) {
      const temp = items[index + 1];
      items[index + 1] = items[index];
      items[index] = temp;
    }

    // Reorder the items based on their id
    items.forEach((item, index) => {
      item.id = index + 1;
    });

    setPriorityItems(items);
  };

  const handlePriorityItemChange = (id, value) => {
    const items = [...priorityItems];
    const index = items.findIndex((item) => item.id === id);
    items[index].value = value;

    setPriorityItems(items);
  };

  const handleEmptyPriorityItems = () => {
    const items = [...priorityItems].filter((item) => item.value !== "");

    // Reorder the items based on their id
    items.forEach((item, index) => {
      item.id = index + 1;
    });

    setPriorityItems(items);
  };

  const handleRemovePriorityItem = (id) => {
    const items = [...priorityItems];
    const index = items.findIndex((item) => item.id === id);
    items.splice(index, 1);

    // Reorder the items based on their id
    items.forEach((item, index) => {
      item.id = index + 1;
    });

    setPriorityItems(items);
  };

  const handleStrictPriorityChange = (e) => {
    const value = e.target.checked;
    context.setStore((store) => ({ ...store, strictPriority: value }));
  };

  const handleAutoStopChange = (e) => {
    const value = e.target.checked;
    context.setStore((store) => ({ ...store, autoStop: value }));
  };

  const handleUseCountChange = (e) => {
    const value = e.target.checked;
    context.setStore((store) => ({ ...store, useCustomCount: value }));
  };

  const handleCountChange = (value) => {
    context.setTemporaryStore((store) => ({ ...store, ticketBuyCount: value }));
  };

  return (
    <Card elevation={Elevation.TWO} className={styles.PriorityPanel}>
      <h3>Ticket Settings</h3>
      <span>
        You can prioritize certain tickets by entering priority items. Tickets are prioritized by the
        variant name. Priority items are not case-sensitive. The maximum number of priority items is 5.
        Do not leave empty priority items.
      </span>
      <div className={styles.PriorityItemList}>
        {priorityItems?.length > 0 &&
          priorityItems.map((item) => {
            return (
              <div key={item.id} className={styles.PriorityItem}>
                <span>{item.id}.</span>
                <div className="bp4-input-group">
                  <input
                    type="text"
                    className="bp4-input"
                    onChange={({ target }) => {
                      handlePriorityItemChange(item.id, target.value);
                    }}
                    onBlur={() => handleEmptyPriorityItems()}
                    value={item.value}
                  />
                </div>
                <Button
                  icon="arrow-up"
                  disabled={item.id === 1}
                  onClick={() => handlePriorityItemUp(item.id)}
                />
                <Button
                  icon="arrow-down"
                  disabled={item.id === priorityItems.length}
                  onClick={() => handlePriorityItemDown(item.id)}
                />
                <Button icon="cross" intent="danger" onClick={() => handleRemovePriorityItem(item.id)} />
              </div>
            );
          })}
      </div>
      <Button
        icon="plus"
        text="Add New Priority Item"
        onClick={() => handleAddPriorityItem()}
        disabled={priorityItems.length >= 5}
      />
      <div className={styles.AdditionalPrioritySettings}>
        <h3>Behavior</h3>
        {priorityItems.length > 0 && (
          <Switch
            checked={context.store.strictPriority}
            onChange={handleStrictPriorityChange}
            label="Skip Other Than Priority Tickets"
          />
        )}
        <Switch
          checked={context.store.autoStop}
          onChange={handleAutoStopChange}
          label="Stop Bot When Successful Reservation (Experimental)"
        />
        <div className={styles.BuyCountContainer}>
          <h3>Ticket Buy Count</h3>
          <span>
            Specify the number of tickets to purchase. If the number is greater than the maximum number
            of tickets that can be then that value will be overridden.
          </span>
          <Switch
            checked={context.store.useCustomCount}
            onChange={handleUseCountChange}
            label="Use Custom Count"
          />
          {context.store.useCustomCount && (
            <NumericInput
              placeholder="Ticket Count..."
              disabled={context.store.singlePriority}
              onValueChange={handleCountChange}
              value={context.temporaryStore.ticketBuyCount}
            />
          )}
        </div>
      </div>
    </Card>
  );
};

export default PriorityPanel;
