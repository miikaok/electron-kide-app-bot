import React, { useState, useContext } from "react";
import styles from "./LoginPanel.module.css";

import axios from "axios";
import { Button } from "@blueprintjs/core";
import { AppContext } from "../../App";

const LoginPanel = ({ allowClose }) => {
  const [jwt, setJwt] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const context = useContext(AppContext);

  /**
   * Handles the JWT change
   * @param {object} e
   */
  const handleJwtChange = (e) => {
    const jwt = sanitizeJwt(e.target.value);
    setJwt(jwt);
  };

  /**
   * Sanitizes the JWT by removing the "Bearer " prefix and the quotes
   * @param {string} jwt
   * @returns
   */
  const sanitizeJwt = (jwt) => {
    if (jwt == null) return "";
    return jwt.replace("Bearer ", "").replace(/"/g, "");
  };

  /**
   * Verifies the JWT token using the kide.app API
   * @param {string} jwt
   * @returns {boolean} isValid
   */
  const verifyJwt = async (jwt) => {
    // This endpoint is just used to verify the JWT
    const url = "https://api.kide.app/api/authentication/user";

    setLoading(true);

    try {
      const response = await axios.get(url, {
        headers: {
          Accept: "application/json, text/plain, */*",
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (response.status !== 200) {
        setError("Request failed.");
        return false;
      }

      return true;
    } catch (e) {
      if (e.response.status === 401) setError("Authentication failed. Invalid JWT token.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Saves the user to the local storage
   * @param {string} email
   * @param {string} token
   * @param {datetime} expires
   * @returns {boolean} success
   */
  const saveUser = (email, token, expires) => {
    if (context.store.users == null) {
      context.setStore((store) => ({ ...store, users: [{ email, token, expires }] }));
    } else {
      // Skip if email exists
      if (context.store.users.find((user) => user.email === email)) return false;

      context.setStore((store) => ({
        ...store,
        users: [...store.users, { email, token, expires }],
      }));
    }
    return true;
  };

  /**
   * Parses the JWT token and returns the payload
   * @param {string} token
   * @returns {object} payload
   */
  const parseJwt = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );

      return JSON.parse(jsonPayload);
    } catch (e) {
      setError("Failed to parse token. Invalid JWT token");
      return null;
    }
  };

  /**
   * Check if user exists in the local storage based on the email
   * @param {string} email
   * @returns
   */
  const checkIfUserExists = (email) => {
    if (context.store.users == null) return false;
    return context.store.users.find((user) => user.email === email) != null;
  };

  /**
   * Uses the JWT token to add a new user to the local storage
   * @param {string} jwt
   * @returns {boolean} success
   */
  const addNewUser = async (jwt) => {
    const isValidJwt = await verifyJwt(jwt);
    if (!isValidJwt) return false;

    const payload = parseJwt(jwt);
    if (payload == null) return false;

    const email = payload?.sub;
    const expires = new Date(payload?.exp * 1000);

    if (email == null) return false;

    if (checkIfUserExists(email)) {
      setError("User already exists.");
      return false;
    }

    saveUser(email, jwt, expires);
  };

  /**
   * Handles the behavior when the user clicks the cancel button
   */
  const handleExit = () => {
    context.setTemporaryStore((store) => ({
      ...store,
      showLogin: false,
    }));
  };

  const allowLogin = jwt?.length > 0 || false;

  return (
    <div className={styles.LoginPanelContainer}>
      <div className={styles.LoginHeader}>
        <h3 className="bp4-heading">User Login</h3>
        <label className="bp4-text-small">
          Your login information is only forwarded to kide.app and not stored anywhere.
        </label>
      </div>
      <div className={styles.LoginContainer}>
        <input
          className="bp4-input"
          type="text"
          placeholder="JWT Token"
          onChange={handleJwtChange}
          value={jwt}
          disabled={loading}
          style={{ width: "240px" }}
        />
        {error && <span className={styles.ErrorLabel}>Error: {error}</span>}
        <div className={styles.ButtonGroup}>
          {allowClose === true && (
            <Button
              icon="arrow-left"
              intent="danger"
              text="Cancel"
              loading={loading}
              onClick={() => handleExit()}
            />
          )}
          <Button
            icon="lock"
            text="Authenticate"
            loading={loading}
            disabled={!allowLogin}
            onClick={() => addNewUser(jwt)}
          />
        </div>
      </div>
      <a
        href="https://developer.oftrust.net/guides/get-bearer-token/#how-to-get-bearer-token"
        target="_blank"
        className={styles.TutorialLink}
        rel="noreferrer"
      >
        How to get your JWT token?
      </a>
    </div>
  );
};

export default LoginPanel;
