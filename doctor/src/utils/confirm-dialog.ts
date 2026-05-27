interface ConfirmDialogOptions {
  message: string
  title?: string
  description?: string
  confirmText: string
  cancelText?: string
  showCancel?: boolean
  type?: 'default' | 'danger'
  icon?: 'warning'
}

const createButton = (text: string, className: string) => {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = `doctor-confirm-dialog__button ${className}`
  button.textContent = text
  return button
}

export const showConfirmDialog = (options: ConfirmDialogOptions) => {
  return new Promise<boolean>((resolve) => {
    const mask = document.createElement('div')
    mask.className = 'doctor-confirm-dialog__mask'

    const dialog = document.createElement('section')
    dialog.className = options.type === 'danger'
      ? 'doctor-confirm-dialog doctor-confirm-dialog--danger'
      : 'doctor-confirm-dialog'
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')

    const icon = document.createElement('div')
    icon.className = 'doctor-confirm-dialog__icon'
    icon.textContent = '!'

    const title = document.createElement('h2')
    title.className = 'doctor-confirm-dialog__title'
    title.textContent = options.title || ''

    const message = document.createElement('p')
    message.className = 'doctor-confirm-dialog__message'
    message.textContent = options.message

    const description = document.createElement('p')
    description.className = 'doctor-confirm-dialog__description'
    description.textContent = options.description || ''

    const actions = document.createElement('div')
    actions.className = options.showCancel === false
      ? 'doctor-confirm-dialog__actions doctor-confirm-dialog__actions--single'
      : 'doctor-confirm-dialog__actions'

    const cleanup = (result: boolean) => {
      mask.remove()
      resolve(result)
    }

    if (options.showCancel !== false) {
      const cancelButton = createButton(
        options.cancelText || '',
        'doctor-confirm-dialog__button--ghost'
      )
      cancelButton.addEventListener('click', () => cleanup(false))
      actions.append(cancelButton)
    }

    const confirmButton = createButton(options.confirmText, 'doctor-confirm-dialog__button--primary')
    confirmButton.addEventListener('click', () => cleanup(true))
    actions.append(confirmButton)

    if (options.type === 'danger' && options.icon === 'warning') {
      dialog.append(icon, title, message, description, actions)
    } else if (options.description) {
      dialog.append(message, description, actions)
    } else {
      dialog.append(message, actions)
    }
    mask.append(dialog)
    document.body.append(mask)
  })
}
