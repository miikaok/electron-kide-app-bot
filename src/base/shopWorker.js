const shopWorker = () => {
  const getEventData = async (eventID, requestTimeout) => {
    try {
      const response = await fetch(
        `https://api.kide.app/api/products/${eventID}`,
        {
          method: 'GET',
          timeout: requestTimeout,
          caches: 'no-cache'
        }
      )
      if (response.status === 200) return response.json()
    } catch (error) {
      console.error(error)
    }
    return null
  }

  const shop = async (bearerToken, requestTimeout, variant) => {
    const maxReservationCount =
      variant.availability >= variant.productVariantMaximumReservableQuantity
        ? variant.productVariantMaximumReservableQuantity
        : variant.availability

    const response = await fetch('https://api.kide.app/api/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearerToken}`,
        timeout: requestTimeout,
        caches: 'no-cache'
      },
      body: JSON.stringify({
        toCancel: [],
        toCreate: [
          {
            inventoryId: variant.inventoryId,
            productVariantUserForm: null,
            quantity: maxReservationCount
          }
        ]
      })
    })
    if (response.status === 200) {
      postMessage({ type: 'buy_success' })
      return
    }
    postMessage({ type: 'buy_failed' })
    return
  }

  onmessage = ({ data }) => {
    const {
      eventID,
      threadDelay,
      requestTimeout,
      strictPriority,
      priorityItems,
      bearerToken
    } = data

    setInterval(async () => {
      const response = await getEventData(eventID, requestTimeout)
      if (response === null) {
        postMessage({ type: 'request_error' })
        return
      }

      const event = response.model
      postMessage({ type: 'request_success' })

      const availableVariants = event.variants.filter(variant => {
        return variant.availability > 0 && variant.isProductVariantActive
      })

      // If there are no matches, return
      if (availableVariants.length === 0) {
        postMessage({ type: 'no_available_variants' })
        return // TODO send error to main thread
      }

      // Handle priority items
      if (priorityItems.length > 0) {
        priorityItems.forEach(item => {
          const { value } = item
          const variant = availableVariants.find(variant =>
            variant.name.includes(value)
          )
          if (variant != null) {
            postMessage({ type: 'buy_attempt', value: variant.name })
            return shop(bearerToken, requestTimeout, variant)
          }
        })
        // If strict priority is enabled, return
        if (strictPriority) {
          postMessage({ type: 'strict_skip' })
          return
        }
      }

      // Select a random variant of there are no priority items
      const variantId = Math.floor(Math.random() * availableVariants.length)
      postMessage({
        type: 'buy_attempt',
        value: availableVariants[variantId].name
      })
      return shop(bearerToken, requestTimeout, availableVariants[variantId])
    }, threadDelay)
  }
}

export default shopWorker
