import { Disposable } from 'event-kit'

function humanizeEventName(name) {
  return name
}

const selectorCompare = (self, other) => self.sequenceNumber - other.sequenceNumber

let SEQUENCE_NUMBER = 0
export class CommandRegistry {
  // Map<String:Array>
  listenersByCommandName = {}

  clear() {
    this.listenersByCommandName = {}
  }

  attach(root) {
    this.root = root
  }

  add(selector, commandName, listener) {
    if (this.listenersByCommandName[commandName] == null) {
      this.listenersByCommandName[commandName] = [] // listener * ---- 1 command
    }

    const listenersForCommand = this.listenersByCommandName[commandName]

    const sequenceNumber = SEQUENCE_NUMBER++
    const selectorListener = {
      dispatch: listener,
      selector,
      commandName,
      description: humanizeEventName(commandName),
      sequenceNumber,
      compare: other => selectorCompare(selectorListener, other)
    }

    listenersForCommand.push(selectorListener)

    return new Disposable(() => {
      listenersForCommand.splice(listenersForCommand.indexOf(selectorListener), 1)
      if (listenersForCommand.length === 0) {
        delete this.listenersByCommandName[commandName]
      }
    })
  }

  handleCommand(target, commandName, args) {
    // от корня будет искать обработчики
    let currentTarget = target

    const matched = []

    while (true) {

      const listeners = (this.listenersByCommandName[commandName] || [])
        .filter(({ selector }) => selector === currentTarget.tag)
        .sort((a, b) => a.compare(b))

      for (let i = listeners.length - 1; i >= 0; i--) {
        const listener = listeners[i]
        matched.push(listener.dispatch.call(currentTarget, args))
      }

      if (currentTarget === this.root) {
        break
      }

      currentTarget = currentTarget.parent || this.root
    }

    return matched.length > 0 ? Promise.all(matched) : null
  }
}
