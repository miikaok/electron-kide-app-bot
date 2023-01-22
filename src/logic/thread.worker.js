AbortSignal.timeout ??= function timeout(ms) {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.close(), ms);
  return ctrl.signal;
};

const getEventData = async (eventID, requestTimeout) => {
  try {
    const response = await fetch(`https://api.kide.app/api/products/${eventID}`, {
      method: "GET",
      caches: "no-cache",
      signal: AbortSignal.timeout(requestTimeout),
    });
    if (response.status === 200) return response.json();
  } catch (error) {
    return null;
  }
};

const getReservationData = async (bearerToken, requestTimeout) => {
  try {
    const response = await fetch("https://api.kide.app/api/reservations", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearerToken}`,
        caches: "no-cache",
      },
      signal: AbortSignal.timeout(requestTimeout),
    });
    if (response.status === 200) {
      const r = await response.json();
      if (r.model?.reservations == null) return [];
      const itemsInCart = r.model.reservations.map((r) => r.inventoryId);
      return itemsInCart;
    }
  } catch (error) {
    return null;
  }
};

const shop = async (bearerToken, requestTimeout, variant, useCustomCount, ticketBuyCount) => {
  const maxReservationCount =
    variant.availability >= variant.productVariantMaximumReservableQuantity
      ? variant.productVariantMaximumReservableQuantity
      : variant.availability;

  if (maxReservationCount === 0) {
    self.postMessage({ type: "buy_failed" });
    return;
  }

  const cart = await getReservationData(bearerToken, requestTimeout);

  if (cart === null) {
    self.postMessage({ type: "request_error" });
    return;
  }

  self.postMessage({ type: "request_success" });

  if (cart.includes(variant.inventoryId)) {
    self.postMessage({ type: "in_cart" });
    return;
  }

  const quantity = useCustomCount
    ? ticketBuyCount <= maxReservationCount
      ? ticketBuyCount
      : maxReservationCount
    : maxReservationCount;

  const response = await fetch("https://api.kide.app/api/reservations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearerToken}`,
      caches: "no-cache",
    },
    body: JSON.stringify({
      toCancel: [],
      toCreate: [
        {
          inventoryId: variant.inventoryId,
          productVariantUserForm: null,
          quantity: quantity,
        },
      ],
    }),
    signal: AbortSignal.timeout(requestTimeout),
  });

  if (response.status === 200) {
    self.postMessage({ type: "buy_success" });
    return;
  }
  self.postMessage({ type: "buy_failed" });
  return;
};

const handleMessage = (event) => {
  const {
    eventID,
    threadDelay,
    requestTimeout,
    strictPriority,
    priorityItems,
    bearerToken,
    useCustomCount,
    ticketBuyCount,
  } = event.data;

  setInterval(async () => {
    const response = await getEventData(eventID, requestTimeout);

    self.postMessage({ type: "request_start" });

    if (response === null) {
      self.postMessage({ type: "request_error" });
      return;
    }

    const event = response.model;

    const availableVariants = event.variants.filter((variant) => {
      return variant.isProductVariantActive;
    });

    // If there are no matches, return
    if (availableVariants.length === 0) {
      self.postMessage({ type: "no_available_variants" });
      return;
    }

    // Handle priority items
    if (priorityItems.length > 0) {
      priorityItems.forEach((item) => {
        const { value } = item;
        const variant = availableVariants.find((variant) =>
          variant.name.toLowerCase().includes(value.toLowerCase())
        );
        if (variant != null) {
          self.postMessage({ type: "buy_attempt", value: variant.name });
          return shop(bearerToken, requestTimeout, variant, useCustomCount, ticketBuyCount);
        }
      });
      // If strict priority is enabled, return
      if (strictPriority) {
        self.postMessage({ type: "strict_skip" });
        return;
      }
    }

    // Select a random variant of there are no priority items
    const variantId = Math.floor(Math.random() * availableVariants.length);
    self.postMessage({
      type: "buy_attempt",
      value: availableVariants[variantId].name,
    });
    return shop(
      bearerToken,
      requestTimeout,
      availableVariants[variantId],
      useCustomCount,
      ticketBuyCount
    );
  }, threadDelay);
};

self.addEventListener("message", handleMessage);
