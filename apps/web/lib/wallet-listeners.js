export function registerManagerListeners(manager, listeners) {
  const entries = Object.entries(listeners)

  for (const [eventName, handler] of entries) {
    manager.on(eventName, handler)
  }

  return () => {
    for (const [eventName, handler] of entries) {
      manager.off(eventName, handler)
    }
  }
}

export function registerDomEventListeners(target, listeners) {
  const entries = Object.entries(listeners)

  for (const [eventName, handler] of entries) {
    target.addEventListener(eventName, handler)
  }

  return () => {
    for (const [eventName, handler] of entries) {
      target.removeEventListener(eventName, handler)
    }
  }
}
