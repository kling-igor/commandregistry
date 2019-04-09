export class CommandRegistry {
  // Map<String:Array>
  selectorBasedListenersByCommandName = {}

  add(selector, commandName, listener) {
    if (this.selectorBasedListenersByCommandName[commandName] == null) {
      this.selectorBasedListenersByCommandName[commandName] = []
    }

    const listenersForCommand = this.selectorBasedListenersByCommandName[commandName]
    const selectorListener = { didDispatch: listener, selector }
    listenersForCommand.push(selectorListener)

    return new Disposable(() => {
      listenersForCommand.splice(listenersForCommand.indexOf(selectorListener), 1)
      if (listenersForCommand.length === 0) {
        delete this.selectorBasedListenersByCommandName[commandName]
      }
    })
  }

  attach(root) {
    this.root = root
  }

  handleCommand(commandName, args) {
    // обработчик команды
    const listener = this.selectorBasedListenersByCommandName[commandName]

    // от корня будет искать обработчики
    let currentTarget = this.root // TODO: искать специальный таргет!!!

    const listeners = (this.selectorBasedListenersByCommandName[commandName] || []).filter(
      ({ selector }) => selector === target.tag
    )

    const matched = []

    while (true) {
      for (let i = listeners.length - 1; i >= 0; i--) {
        const listener = listeners[i]
        matched.push(listener.didDispatch.call(currentTarget, args))
      }

      if (currentTarget === this.root) {
        break
      }

      currentTarget = currentTarget.parent
    }

    return Promise.all(matched)
  }
}
