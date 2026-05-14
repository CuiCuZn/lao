interface ConfirmDialogOptions {
  message: string
  confirmText: string
  cancelText?: string
  showCancel?: boolean
}

const createButton = (text: string, className: string) => {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = `assistant-confirm-dialog__button ${className}`
  button.textContent = text
  return button
}

export const showConfirmDialog = (options: ConfirmDialogOptions) => {
  return new Promise<boolean>((resolve) => {
    const mask = document.createElement('div')
    mask.className = 'assistant-confirm-dialog__mask'

    const dialog = document.createElement('section')
    dialog.className = 'assistant-confirm-dialog'
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')

    const message = document.createElement('p')
    message.className = 'assistant-confirm-dialog__message'
    message.textContent = options.message

    const actions = document.createElement('div')
    actions.className = options.showCancel === false
      ? 'assistant-confirm-dialog__actions assistant-confirm-dialog__actions--single'
      : 'assistant-confirm-dialog__actions'

    const cleanup = (result: boolean) => {
      mask.remove()
      resolve(result)
    }

    if (options.showCancel !== false) {
      const cancelButton = createButton(
        options.cancelText || '',
        'assistant-confirm-dialog__button--ghost'
      )
      cancelButton.addEventListener('click', () => cleanup(false))
      actions.append(cancelButton)
    }

    const confirmButton = createButton(options.confirmText, 'assistant-confirm-dialog__button--primary')
    confirmButton.addEventListener('click', () => cleanup(true))
    actions.append(confirmButton)

    dialog.append(message, actions)
    mask.append(dialog)
    document.body.append(mask)
  })
}
