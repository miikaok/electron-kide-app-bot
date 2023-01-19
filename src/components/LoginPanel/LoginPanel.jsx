import React, { useState, useContext } from 'react'
import styles from './LoginPanel.module.css'

import axios from 'axios'
import { AppContext } from '../../App.js'
import { Button } from '@blueprintjs/core'

const LoginPanel = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const context = useContext(AppContext)

  const handleEmailChange = e => {
    setEmail(e.target.value)
  }

  const handlePasswordChange = e => {
    setPassword(e.target.value)
  }

  const handleLogin = async () => {
    setError(null)
    setLoading(true)

    const payload = {
      client_id: '56d9cbe22a58432b97c287eadda040df',
      grant_type: 'password',
      username: email,
      password: password,
      rememberMe: true
    }

    const params = new URLSearchParams()
    for (const key of Object.keys(payload)) {
      params.append(key, payload[key])
    }
    const queryString = params.toString()

    try {
      const response = await axios.post(
        'https://auth.kide.app/oauth2/token',
        queryString
      )

      const token = response.data.access_token

      const now = new Date()
      const expires = new Date(
        now.getTime() + parseInt(response.data.expires_in) * 1000
      )

      const oldValues = context.value
      context.setValue({
        ...oldValues,
        bearerToken: token,
        tokenExpires: expires
      })

      setLoading(false)
    } catch (error) {
      setError('Invalid credentials, please try again.')
      setLoading(false)
      setPassword('')
      return
    }
  }

  const allowLogin = email.length > 0 && password.length > 0

  return (
    <div className={styles.LoginPanelContainer}>
      <div className={styles.LoginHeader}>
        <h3 className="bp4-heading">User Login</h3>
        <label className="bp4-text-small">
          Please login to your kide.app user to continue.
        </label>
        <label className="bp4-text-small">
          Your login information is only forwarded to kide.app and not stored
          anywhere.
        </label>
      </div>
      <div className={styles.LoginContainer}>
        <input
          className="bp4-input"
          type="text"
          placeholder="Email"
          onChange={handleEmailChange}
          value={email}
          disabled={loading}
        />
        <input
          className="bp4-input"
          type="password"
          placeholder="Password"
          onChange={handlePasswordChange}
          value={password}
          disabled={loading}
        />
        {error && <span className={styles.ErrorLabel}>Error: {error}</span>}
        <Button
          icon="lock"
          text="Login"
          loading={loading}
          disabled={!allowLogin}
          onClick={handleLogin}
        />
      </div>
    </div>
  )
}

export default LoginPanel
