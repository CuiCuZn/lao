export interface DesktopNotificationOptions {
  title: string
  body: string
  tag?: string
  onClick?: (event: Event, notification: Notification) => void
}

export type DesktopNotificationPermission = NotificationPermission | 'unsupported'

export function isDesktopNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getDesktopNotificationPermission(): DesktopNotificationPermission {
  if (!isDesktopNotificationSupported()) {
    return 'unsupported'
  }

  return Notification.permission
}

export async function requestDesktopNotificationPermission(): Promise<DesktopNotificationPermission> {
  const permission = getDesktopNotificationPermission()

  if (permission === 'unsupported' || permission !== 'default') {
    return permission
  }

  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

export function showDesktopNotification(options: DesktopNotificationOptions) {
  if (getDesktopNotificationPermission() !== 'granted') {
    return undefined
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      tag: options.tag
    })

    if (options.onClick) {
      notification.onclick = (event) => {
        options.onClick?.(event, notification)
      }
    }

    return notification
  } catch {
    return undefined
  }
}
