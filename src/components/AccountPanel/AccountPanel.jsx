import React, { useContext } from "react";
import styles from "./AccountPanel.module.css";

// Context
import { AppContext } from "../../App";

// Components
import { Card, Icon } from "@blueprintjs/core";

const AccountPanel = () => {
  const context = useContext(AppContext);
  const { users } = context.store;

  const handleLogout = (event, email) => {
    event.stopPropagation();
    context.setStore((store) => ({
      ...store,
      users: users.filter((user) => user.email !== email),
    }));
  };

  const handleAddNewAccount = () => {
    context.setTemporaryStore((store) => ({
      ...store,
      showLogin: true,
    }));
  };

  const handleAccountSelect = (token, expires) => {
    context.setTemporaryStore((store) => ({
      ...store,
      bearerToken: token,
      expires: expires,
      showLogin: false,
    }));
  };

  return (
    <div className={styles.AccountPanel}>
      <div className={styles.AccountPanelContent}>
        <div className={styles.AccountPanelHeader}>
          <h3>Accounts ({users.length})</h3>
          <div onClick={() => handleAddNewAccount()} className={styles.AddAccountButton}>
            <Icon icon="add" />
            Add New Account
          </div>
        </div>
        <div className={styles.AccountList}>
          {users.map((user, index) => {
            const username = user.email.split("@")[0];
            return (
              <Card
                key={index}
                interactive
                onClick={() => handleAccountSelect(user.token, user.expires)}
              >
                <div className={styles.UserCard}>
                  <div>
                    <Icon icon="user" />
                  </div>
                  <div>
                    <span>Username: {username}</span>
                  </div>
                  <div
                    onClick={(event) => handleLogout(event, user.email)}
                    className={styles.LogoutButton}
                  >
                    <Icon icon="remove" color="red" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default AccountPanel;
