import React from 'react'
import styles from './Header.module.css'

const Header = () => {
  return (
    <header className={styles.Header}>
      <h2 className="bp4-heading">Kide.app | Ticket Bot</h2>
      <h6 className="bp4-heading">
        NextGen Ticket Bot <span className={styles.Detail}>version 2.2</span>
      </h6>
    </header>
  )
}

export default Header
