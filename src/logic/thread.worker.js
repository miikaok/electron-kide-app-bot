// Original filename: thread.worker.js

AbortSignal.timeout ??= function timeout(ms) {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.close(), ms);
  return ctrl.signal;
};

/**
 * Fetches the event data for a given event ID from the Kide API.
 *
 * @param {string} eventID - The ID of the event to fetch data for.
 * @param {number} [requestTimeout=5000] - Timeout for the request in milliseconds (default is 5000ms).
 *
 * @returns {Promise<Object|null>} Returns a promise that resolves to the event data object if successful, or `null` if an error occurred.
 * The returned object will contain the event details, including variants and other information.
 * If the response status is not 200, the function returns `null`.
 *
 * @throws {Error} Throws an error if the fetch request fails, which is caught and logged within the function.
 *
 * @example
 * getEventData('123', 3000)
 *   .then(eventData => console.log(eventData))
 *   .catch(error => console.error('An error occurred:', error));
 */
const getEventInformation = async (eventID, requestTimeout = 5000) => {
  try {
    const response = await fetch(`https://api.kide.app/api/products/${eventID}`, {
      method: "GET",
      headers: {
        "cache-control": "no-cache",
      },
      signal: AbortSignal.timeout(requestTimeout),
    });

    if (response.ok) return response.json();
  } catch (error) {
    console.error(`Error fetching event data for eventID ${eventID}:`, error);
    return null;
  }
};

/**
 * Gets the current user's reservation data (shopping cart) from the Kide API
 * @param {string} bearerToken Bearer token used to authenticate the request
 * @param {number} requestTimeout Timeout for the request in milliseconds
 * @returns {null | string[]} Returns null if an error occurred, otherwise returns an array of inventory IDs
 * @throws {Error} Throws an error if the fetch request fails
 * @example
 * const reservations = await getReservationData(bearerToken: 'your-token-here', requestTimeout: 3000);
 * console.log(reservations); // Output: ['inventoryId1', 'inventoryId2', ...]
 */
const getReservationState = async ({ bearerToken, requestTimeout = 5000 }) => {
  try {
    const response = await fetch("https://api.kide.app/api/reservations", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        cache: "no-cache",
      },
      signal: AbortSignal.timeout(requestTimeout),
    });

    if (response.ok) {
      const responseBody = await response.json();
      const reservations = responseBody.model?.reservations;

      if (reservations == null) return [];

      const itemsInCart = reservations.map((reservation) => reservation.inventoryId);
      return itemsInCart;
    } else {
      console.error(`Error fetching reservations: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error("An error occurred while fetching reservations:", error);
  }
  return null;
};

/**
 * Creates a reservation for a product variant
 * @param {string} bearerToken Bearer token used to authenticate the request
 * @param {string} inventoryId Inventory ID of the product variant
 * @param {number} quantity Quantity of the product variant to reserve
 * @param {number} requestTimeout Timeout for the request in milliseconds
 * @returns {boolean} Returns true if the reservation was successful, otherwise returns false
 * @example
 * const reservationSuccess = await createProductVariantReservation({
      bearerToken: 'your-token-here',
      inventoryId: 'inventory-id-here',
      quantity: 3,
      requestTimeout: 3000,
    });
 * console.log(reservationSuccess); // Output: true
 */
const createProductVariantReservation = async ({
  bearerToken,
  inventoryId,
  quantity,
  requestTimeout,
}) => {
  const response = await fetch("https://api.kide.app/api/reservations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearerToken}`,
      cache: "no-cache", // Corrected header name
    },
    body: JSON.stringify({
      toCancel: [],
      toCreate: [
        {
          inventoryId: inventoryId,
          productVariantUserForm: null,
          quantity: String(quantity),
        },
      ],
    }),
    signal: AbortSignal.timeout(requestTimeout),
  });
  return response.ok;
};

/**
 * Reserves a product variant
 * @param {string} bearerToken Bearer token used to authenticate the request
 * @param {number} requestTimeout Timeout for the request in milliseconds
 * @param {object} variant Product variant object
 * @param {boolean} useCustomCount Whether to use a custom ticket count
 * @param {number} ticketBuyCount Custom ticket count
 * @returns {undefined} The function does not return value
 */
const reserveProductVariant = async ({
  bearerToken,
  requestTimeout = 5000,
  variant,
  useCustomCount = false,
  ticketBuyCount = 0,
} = {}) => {
  try {
    const maxReservationCount = Math.min(
      variant.availability,
      variant.productVariantMaximumReservableQuantity
    );

    if (maxReservationCount === 0) return self.postMessage({ type: "buy_failed" });

    const cart = await getReservationState({
      bearerToken: bearerToken,
      requestTimeout: requestTimeout,
    });

    // If the cart is null the request has failed, return
    if (cart === null || typeof cart === "undefined") {
      return self.postMessage({ type: "request_error" });
    } else {
      self.postMessage({ type: "request_success" });
    }

    // If the item is already in the cart, return
    if (cart.includes(variant.inventoryId)) return self.postMessage({ type: "in_cart" });

    const quantity = useCustomCount
      ? Math.min(ticketBuyCount, maxReservationCount)
      : maxReservationCount;

    // Attempt to reserve the item
    const reservationSuccess = await createProductVariantReservation({
      bearerToken: bearerToken,
      inventoryId: variant.inventoryId,
      quantity: quantity,
      requestTimeout: requestTimeout,
    });

    // If the reservation failed, return
    if (!reservationSuccess) return self.postMessage({ type: "buy_failed" });

    // The reservation was successful
    self.postMessage({ type: "buy_success" });
  } catch (error) {
    console.error("An error occurred while processing the shopping request:", error);
    self.postMessage({ type: "buy_failed" });
  }
};

/**
 * Handles an event message by repeatedly attempting to reserve product variants.
 * The function first attempts to reserve priority items if provided, and then randomly selects available variants.
 * The interval for attempting reservations is controlled by the `threadDelay` parameter.
 *
 * @param {Object} event - The event object containing the data for handling the message.
 * @param {string} event.data.eventID - The ID of the event to handle.
 * @param {number} event.data.threadDelay - The delay in milliseconds between attempts to reserve product variants.
 * @param {number} event.data.requestTimeout - Timeout for the request in milliseconds.
 * @param {boolean} event.data.strictPriority - Whether to strictly follow priority items and skip others if priority items are present.
 * @param {Object[]} event.data.priorityItems - An array of priority items to be reserved first.
 * @param {string} event.data.bearerToken - Bearer token used to authenticate the request.
 * @param {boolean} event.data.useCustomCount - Whether to use a custom ticket count.
 * @param {number} event.data.ticketBuyCount - Custom ticket count.
 *
 * @example
 * handleMessage({
 *   data: {
 *     eventID: '123',
 *     threadDelay: 1000,
 *     requestTimeout: 5000,
 *     strictPriority: false,
 *     priorityItems: [{ value: 'VIP' }],
 *     bearerToken: 'your-token-here',
 *     useCustomCount: true,
 *     ticketBuyCount: 2
 *   }
 * });
 */
const handleMessage = ({
  data: {
    eventID,
    threadDelay,
    requestTimeout,
    strictPriority,
    priorityItems,
    bearerToken,
    useCustomCount,
    ticketBuyCount,
  },
}) => {
  setInterval(async () => {
    const response = await getEventInformation(eventID, requestTimeout);

    self.postMessage({ type: "request_start" });

    if (response === null) return self.postMessage({ type: "request_error" });

    const event = response.model;
    const availableVariants = event.variants.filter((variant) => variant.isProductVariantActive);

    // If there are no matches, return
    if (availableVariants.length === 0) return self.postMessage({ type: "no_available_variants" });

    // Handle priority items
    if (priorityItems.length > 0) {
      const priorityHandled = handlePriorityItems(priorityItems, availableVariants, {
        bearerToken,
        requestTimeout,
        useCustomCount,
        ticketBuyCount,
      });

      if (!priorityHandled && strictPriority) return self.postMessage({ type: "strict_skip" });
    }

    // Select a random variant if there are no priority items
    const variantId = Math.floor(Math.random() * availableVariants.length);
    self.postMessage({
      type: "buy_attempt",
      value: availableVariants[variantId].name,
    });

    return reserveProductVariant({
      bearerToken,
      requestTimeout,
      variant: availableVariants[variantId],
      useCustomCount,
      ticketBuyCount,
    });
  }, threadDelay);
};

/**
 * Handles priority items by attempting to reserve product variants that match the priority values.
 * Iterates through the priority items and looks for available variants that include the priority value in their name.
 * If a matching variant is found, it attempts to reserve it and returns `true`.
 * If no matching variants are found, it returns `false`.
 *
 * @param {Object[]} priorityItems - An array of priority items to be reserved first. Each item should have a `value` property representing the priority value.
 * @param {Object[]} availableVariants - An array of available product variants. Each variant should have a `name` property.
 * @param {Object} options - Options for reserving the product variant.
 * @param {string} options.bearerToken - Bearer token used to authenticate the request.
 * @param {number} options.requestTimeout - Timeout for the request in milliseconds.
 * @param {boolean} options.useCustomCount - Whether to use a custom ticket count.
 * @param {number} options.ticketBuyCount - Custom ticket count.
 *
 * @returns {boolean} Returns `true` if a priority item was handled (reserved), otherwise returns `false`.
 *
 * @example
 * const priorityItems = [{ value: 'VIP' }];
 * const availableVariants = [{ name: 'VIP Ticket', isProductVariantActive: true }];
 * const options = {
 *   bearerToken: 'your-token-here',
 *   requestTimeout: 5000,
 *   useCustomCount: true,
 *   ticketBuyCount: 2
 * };
 * const result = handlePriorityItems(priorityItems, availableVariants, options);
 * console.log(result); // Output: true
 */
const handlePriorityItems = (priorityItems, availableVariants, options) => {
  for (const item of priorityItems) {
    const { value } = item;
    const variant = availableVariants.find((variant) =>
      variant.name.toLowerCase().includes(value.toLowerCase())
    );
    if (variant != null) {
      self.postMessage({ type: "buy_attempt", value: variant.name });
      reserveProductVariant({ ...options, variant });
      return true;
    }
  }
  return false;
};

// Listen for messages from the main thread
self.addEventListener("message", handleMessage);
