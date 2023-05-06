/** @format */

import React, { useContext } from "react";

// Context
import { AppContext } from "../../App";

// Components
import AccountPanel from "../../components/AccountPanel";
import LoginPanel from "../../components/LoginPanel";

const styles = {
  height: "100%",
  overflowY: "auto",
};

const UserWindow = () => {
  const context = useContext(AppContext);

  const hasUsers = context.store.users?.length > 0;
  const isLoggedIn = context.temporaryStore.bearerToken != null;
  const showLogin = context.temporaryStore.showLogin;

  if (showLogin) return <LoginPanel allowClose={true} />;
  return <section style={styles}>{hasUsers && !isLoggedIn ? <AccountPanel /> : <LoginPanel />}</section>;
};

export default UserWindow;
