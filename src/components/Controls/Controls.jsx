import React, { useEffect, useState, useContext } from 'react'
import styles from './Controls.module.css'

import axios from 'axios'
import { AppContext } from '../../App.js'
import { Card, Button, Elevation, Spinner, Checkbox } from '@blueprintjs/core'

import WebWorker from 'react-web-workers'
import shopWorker from '../../base/shopWorker.js'

const Controls = () => {
  const context = useContext(AppContext)
  const priorityItems = context.value?.priorityItems ?? []
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [botStatus, setBotStatus] = useState('stopped')

  const [workers, setWorkers] = useState([])

  const [counts, setCounts] = useState({
    request_error: 0,
    request_success: 0,
    no_available_variants: 0,
    buy_attempts: 0,
    strict_skips: 0
  })

  const fetchEvent = async eventID => {
    setLoading(true)
    try {
      const response = await axios.get(
        `https://api.kide.app/api/products/${eventID}`
      )
      setEvent(response.data.model)
      setLoading(false)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    const eventID = context.value?.eventID
    fetchEvent(eventID)
  }, [context.value?.eventID])

  const handleGoBack = () => {
    context.setValue({ ...context.value, eventID: null, priorityItems: [] })
  }

  const setPriorityItems = items => {
    context.setValue({ ...context.value, priorityItems: items })
  }

  const handleAddPriorityItem = () => {
    const items = [...priorityItems]

    const newPriorityItem = {
      id: items.length + 1,
      value: ''
    }

    items.push(newPriorityItem)
    setPriorityItems(items)
  }

  const handlePriorityItemUp = id => {
    const items = [...priorityItems]
    const index = items.findIndex(item => item.id === id)

    if (index > 0) {
      const temp = items[index - 1]
      items[index - 1] = items[index]
      items[index] = temp
    }

    // Reorder the items based on their id
    items.forEach((item, index) => {
      item.id = index + 1
    })

    setPriorityItems(items)
  }

  const handlePriorityItemDown = id => {
    const items = [...priorityItems]
    const index = items.findIndex(item => item.id === id)

    if (index < items.length - 1) {
      const temp = items[index + 1]
      items[index + 1] = items[index]
      items[index] = temp
    }

    // Reorder the items based on their id
    items.forEach((item, index) => {
      item.id = index + 1
    })

    setPriorityItems(items)
  }

  const handlePriorityItemChange = (id, value) => {
    const items = [...priorityItems]
    const index = items.findIndex(item => item.id === id)
    items[index].value = value

    setPriorityItems(items)
  }

  const handleEmptyPriorityItems = () => {
    const items = [...priorityItems].filter(item => item.value !== '')

    // Reorder the items based on their id
    items.forEach((item, index) => {
      item.id = index + 1
    })

    setPriorityItems(items)
  }

  const handleRemovePriorityItem = id => {
    const items = [...priorityItems]
    const index = items.findIndex(item => item.id === id)
    items.splice(index, 1)

    // Reorder the items based on their id
    items.forEach((item, index) => {
      item.id = index + 1
    })

    setPriorityItems(items)
  }

  const handleThreadCountChange = e => {
    const value = e.target.value
    context.setValue({ ...context.value, threadCount: value })
  }

  const handleThreadDelayChange = e => {
    const value = e.target.value
    context.setValue({ ...context.value, threadDelay: value })
  }

  const handleRequestTimeoutChange = e => {
    const value = e.target.value
    context.setValue({ ...context.value, requestTimeout: value })
  }

  const allowBotStart = () => {
    if (context.value?.threadCount === '') return false
    if (context.value?.threadDelay === '') return false
    if (context.value?.requestTimeout === '') return false

    // Check if any of the values are less than 1 or not numbers
    if (context.value?.threadCount < 1) return false
    if (context.value?.threadDelay < 1) return false
    if (context.value?.requestTimeout < 1) return false

    if (context.value?.threadCount % 1 !== 0) return false
    if (context.value?.threadDelay % 1 !== 0) return false
    if (context.value?.requestTimeout % 1 !== 0) return false

    // Check if there are any priority items with empty values
    if (priorityItems.length > 0) {
      const emptyPriorityItems = priorityItems.filter(item => item.value === '')
      if (emptyPriorityItems.length > 0) return false
    }

    return true
  }

  const handleStrictPriorityChange = e => {
    const value = e.target.checked
    context.setValue({ ...context.value, strictPriority: value })
  }

  const handleStartBot = async () => {
    setBotStatus('booting')

    for (let i = 0; i < context.value?.threadCount; i++) {
      const [sWorker] = WebWorker([shopWorker])
      sWorker.postMessage({
        eventID: context.value?.eventID,
        threadDelay: context.value?.threadDelay,
        requestTimeout: context.value?.requestTimeout,
        strictPriority: context.value?.strictPriority,
        priorityItems: context.value?.priorityItems,
        bearerToken: context.value?.bearerToken
      })
      sWorker.onmessage = e => {
        const message_type = e.data.type
        switch (message_type) {
          case 'request_error':
            setCounts(counts => ({
              ...counts,
              request_errors: counts.request_errors + 1
            }))
            break
          case 'request_success':
            setCounts(counts => ({
              ...counts,
              request_success: counts.request_success + 1
            }))
            break
          case 'no_available_variants':
            setCounts(counts => ({
              ...counts,
              no_available_variants: counts.no_available_variants + 1
            }))
            break
          case 'buy_attempt':
            setCounts(counts => ({
              ...counts,
              buy_attempts: counts.buy_attempts + 1
            }))
            break
          case 'strict_skip':
            setCounts(counts => ({
              ...counts,
              strict_skips: counts.strict_skips + 1
            }))
            break
          case 'buy_success':
            handleBotHold()
            break
          default:
            break
        }
      }
      setWorkers(workers => [...workers, sWorker])
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    setBotStatus('running')
  }

  const handleBotHold = () => {
    workers.forEach(worker => {
      worker.terminate()
    })

    setWorkers([])
    setBotStatus('hold')
  }

  const handleStopBot = () => {
    workers.forEach(worker => {
      worker.terminate()
    })

    setWorkers([])
    setBotStatus('stopped')
  }

  const progress = Math.round(
    (workers.length / context.value.threadCount) * 100
  )

  return (
    <>
      {loading ? (
        <div className={styles.LoadingContainer}>
          <Spinner />
        </div>
      ) : (
        <section className={styles.ControlsContainer}>
          <>
            {botStatus === 'stopped' ? (
              <div className={styles.Controls}>
                <Card elevation={Elevation.TWO}>
                  <div className={styles.EventInfoContainer}>
                    <h3>{event.product.name}</h3>
                    {event.product.salesOngoing ? (
                      <span className={styles.OnSaleLabel}>On Sale</span>
                    ) : (
                      <span className={styles.NotOnSaleLabel}>
                        Not On Sale (will begin at {event.product.dateSalesFrom}
                        )
                      </span>
                    )}
                    <span>
                      Current Availability:{' '}
                      {event.product.availability ?? 'Unknown'}
                    </span>
                  </div>
                  <Button onClick={() => fetchEvent(event.product.id)}>
                    Refresh Information
                  </Button>
                </Card>
                <Card elevation={Elevation.TWO}>
                  <h3>Bot Settings</h3>
                  <div className={styles.SettingsRow}>
                    <span>Thread Count</span>
                    <div className={styles.BotSettings}>
                      <div className="bp4-input-group">
                        <input
                          type="number"
                          className="bp4-input"
                          placeholder="Enter a thread count..."
                          onChange={handleThreadCountChange}
                          value={context.value.threadCount}
                        />
                      </div>
                    </div>
                  </div>
                  <div className={styles.SettingsRow}>
                    <span>Thread Delay (ms)</span>
                    <div className={styles.BotSettings}>
                      <div className="bp4-input-group">
                        <input
                          type="number"
                          className="bp4-input"
                          placeholder="Enter a thread delay..."
                          onChange={handleThreadDelayChange}
                          value={context.value.threadDelay}
                        />
                      </div>
                    </div>
                  </div>
                  <div className={styles.SettingsRow}>
                    <span>Request Timeout (ms)</span>
                    <div className={styles.BotSettings}>
                      <div className="bp4-input-group">
                        <input
                          type="number"
                          className="bp4-input"
                          placeholder="Enter a request timeout..."
                          onChange={handleRequestTimeoutChange}
                          value={context.value.requestTimeout}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
                <Card elevation={Elevation.TWO}>
                  <h3>Ticket Settings</h3>
                  <span>
                    You can prioritize certain tickets by entering priority
                    items. Tickets gets prioritized by the variant name.
                    Priority items are not case sensitive. Max ammount of
                    priority items is 5. Do not leave any priority items empty.
                  </span>
                  <div className={styles.PriorityItemList}>
                    {priorityItems?.length > 0 &&
                      priorityItems.map(item => {
                        return (
                          <div key={item.id} className={styles.PriorityItem}>
                            <span>{item.id}.</span>
                            <div className="bp4-input-group">
                              <input
                                type="text"
                                className="bp4-input"
                                onChange={({ target }) => {
                                  handlePriorityItemChange(
                                    item.id,
                                    target.value
                                  )
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
                            <Button
                              icon="cross"
                              intent="danger"
                              onClick={() => handleRemovePriorityItem(item.id)}
                            />
                          </div>
                        )
                      })}
                  </div>
                  <Button
                    icon="plus"
                    text="Add New Priority Item"
                    onClick={() => handleAddPriorityItem()}
                    disabled={priorityItems.length >= 5}
                  />
                  {priorityItems.length > 0 && (
                    <div className={styles.AdditionalPrioritySettings}>
                      <Checkbox
                        checked={context.value.strictPriority}
                        onChange={handleStrictPriorityChange}
                        label="Skip Non Priority Tickets"
                      />
                    </div>
                  )}
                </Card>
              </div>
            ) : (
              <div className={styles.RunningStats}>
                {progress === 100 ? (
                  <div className={styles.BotStats}>
                    <div>Bot Active</div>
                    <label>Errors: {counts.request_error}</label>
                    <label>Success: {counts.request_success}</label>
                    <label>No Variants: {counts.no_available_variants}</label>
                    <label>Buy attempts: {counts.buy_attempts}</label>
                    <label>Strict Skips: {counts.strict_skips}</label>
                  </div>
                ) : (
                  <div className={styles.RunningStatsProgress}>
                    <h3>
                      Booting Threads ({workers.length} /
                      {context.value.threadCount}) ...
                    </h3>
                    <div class="bp4-progress-bar bp4-intent-primary .modifier">
                      <div
                        class="bp4-progress-meter"
                        style={{
                          width: progress + '%'
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
          <div className={styles.ControlsFooter}>
            <div>
              <Button
                icon="arrow-left"
                intent="danger"
                text="Go Back"
                onClick={() => handleGoBack()}
              />
            </div>
            <div>
              <Button
                icon="stop"
                intent="danger"
                onClick={() => handleStopBot()}
                disabled={botStatus === 'stopped' || botStatus === 'booting'}
                text="Stop Bot"
              />
              <Button
                icon="play"
                intent="success"
                onClick={() => handleStartBot()}
                disabled={
                  !allowBotStart() ||
                  botStatus === 'running' ||
                  botStatus === 'booting'
                }
                text="Start Bot"
              />
            </div>
          </div>
        </section>
      )}
    </>
  )
}

export default Controls
