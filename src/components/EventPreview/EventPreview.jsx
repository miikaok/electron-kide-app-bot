import React, { useState, useContext } from 'react'
import styles from './EventPreview.module.css'

import axios from 'axios'
import { AppContext } from '../../App.js'
import { Spinner } from '@blueprintjs/core'

const EventPreview = () => {
  const [events, setEvents] = useState(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const context = useContext(AppContext)

  const fetchEvents = async search => {
    try {
      const response = await axios(
        `https://api.kide.app/api/products?searchText=${search}`
      )
      return response.data
    } catch (error) {
      console.log(error)
    }
    return null
  }

  const handleEventIDChange = async e => {
    if (e.keyCode !== 13) return
    setLoading(true)

    const events = await fetchEvents(search)
    setLoading(false)
    if (events == null) {
      return setEvents([])
    }
    setEvents(events.model)
  }

  const handleSearchChange = e => {
    setSearch(e.target.value)
  }

  const handleMissingImage = e => {
    e.target.src = './no-image.jpg'
  }

  const handleSelectEvent = eventID => {
    const oldValue = context.value
    context.setValue({ ...oldValue, eventID })
  }

  return (
    <div className={styles.EventPreview}>
      <div className="bp4-input-group">
        <span className="bp4-icon bp4-icon-search" />
        <input
          type="text"
          className="bp4-input"
          placeholder="Search for events..."
          value={search}
          onKeyDown={handleEventIDChange}
          onChange={handleSearchChange}
        />
      </div>
      {!loading ? (
        <>
          {events?.length === 0 ? (
            <div className={styles.NoResultContainer}>
              <h4 className="bp4-heading">No matching content found.</h4>
              <label className="bp4-label">
                Try a different keyword or check your spelling
              </label>
            </div>
          ) : (
            <div className={styles.MediaResultContainer}>
              {events != null &&
                events.map(event => {
                  return (
                    <div
                      key={event.id}
                      className={styles.MediaContainer}
                      onClick={() => handleSelectEvent(event.id)}
                    >
                      <img
                        src={`https://portalvhdsp62n0yt356llm.blob.core.windows.net/bailataan-mediaitems/${event.mediaFilename}`}
                        className={styles.ProductImage}
                        onError={handleMissingImage}
                        alt="Event Preview"
                      />
                      <div className={styles.ProductInfo}>
                        <h5 className="bp4-heading">{event.name}</h5>
                        <span className="bp4-text-small">
                          City: {event.city ?? 'Unknown'}
                        </span>
                        <span className="bp4-text-small">
                          Place: {event.place ?? 'Unknown'}
                        </span>
                        <span className="bp4-text-small">
                          Availability: {event.availability ?? 'Unknown'}
                        </span>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </>
      ) : (
        <div className={styles.LoadingContainer}>
          <Spinner />
        </div>
      )}
    </div>
  )
}

export default EventPreview
