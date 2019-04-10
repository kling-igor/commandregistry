import { uniq, flatten, pick, last } from 'ramda'

// https://github.com/atom/atom/blob/master/src/menu-helpers.js

const macModifierKeyMap = {
  cmd: '\u2318',
  ctrl: '\u2303',
  alt: '\u2325',
  option: '\u2325',
  shift: '\u21e7',
  enter: '\u23ce',
  left: '\u2190',
  right: '\u2192',
  up: '\u2191',
  down: '\u2193'
}

const nonMacModifierKeyMap = {
  cmd: 'Cmd',
  ctrl: 'Ctrl',
  alt: 'Alt',
  option: 'Alt',
  shift: 'Shift',
  enter: 'Enter',
  left: 'Left',
  right: 'Right',
  up: 'Up',
  down: 'Down'
}

// Human key combos should always explicitly state the shift key. This map is a disambiguator.
// 'shift-version': 'no-shift-version'
const shiftKeyMap = {
  '~': '`',
  _: '-',
  '+': '=',
  '|': '\\',
  '{': '[',
  '}': ']',
  ':': ';',
  '"': "'",
  '<': ',',
  '>': '.',
  '?': '/'
}

// hello --> Hello
export const capitalize = word => (word ? word[0].toUpperCase() + word.slice(1) : '')

// hello-world --> helloWorld; hello_world --> helloWorld
export const camelize = string => (string ? string.replace(/[_-]+(\w)/g, m => m[1].toUpperCase()) : '')

// helloWorld --> Hello World
export const uncamelcase = string => {
  if (!string) return ''

  const result = string.replace(/([A-Z])|_+/g, (match, letter = '') => ` ${letter}`)
  return capitalize(result.trim())
}

// hello-world --> Hello World
export const undasherize = string =>
  string
    ? string
      .split('-')
      .map(capitalize)
      .join(' ')
    : ''

// HelloWorld --> hello_world
export const underscore = string => {
  if (!string) return ''
  const str = string[0].toLowerCase() + string.slice(1)
  return str.replace(/([A-Z])|-+/g, (match, letter = '') => `_${letter.toLowerCase()}`)
}

// HelloWorld --> hello-world
export const dasherize = string => {
  if (!string) return ''

  const str = string[0].toLowerCase() + string.slice(1)
  return str.replace(/([A-Z])|(_)/g, (m, letter) => (letter ? '-' + letter.toLowerCase() : '-'))
}

// 'core:file-save' --> Core: File Save
export const humanizeEventName = (eventName, eventDoc) => {
  const [namespace, event] = eventName.split(':')
  if (!event) return undasherize(namespace)
  return `${undasherize(namespace)}: ${eventDoc ? eventDoc : undasherize(event)}`
}

// readable platform dependend KEY representation
export const humanizeKey = (key, platform = process.platform) => {
  if (!key) return

  const modifierKeyMap = platform === 'darwin' ? macModifierKeyMap : nonMacModifierKeyMap
  if (modifierKeyMap[key]) {
    return modifierKeyMap[key]
  } else if (key.length === 1 && shiftKeyMap[key]) {
    return [modifierKeyMap.shift, shiftKeyMap[key]]
  } else if (key.length === 1 && key == key.toUpperCase() && key.toUpperCase() !== key.toLowerCase()) {
    return [modifierKeyMap.shift, key.toUpperCase()]
  } else if (key.length === 1 || /f[0-9]{1,2}/.test(key)) {
    return key.toUpperCase()
  }

  return platform === 'darwin' ? key : plus.capitalize(key)
}

// 'alt-shift-a option-ctrl-b' -> Alt+Shift+A Alt+Ctrl+B;  'alt-shift-a option-ctrl-b' -> ⌥⇧A ⌥⌃B
export const humanizeKeystroke = (keystroke, platform = process.platform) => {
  if (!keystroke) return

  const keystrokes = keystroke.split(' ')
  const humanizedKeystrokes = []

  for (const keystroke of keystrokes) {
    let keys = []
    const splitKeystroke = keystroke.split('-')
    splitKeystroke.forEach((key, index) => {
      // Check for consecutive dashes such as cmd--
      let k = key === '' && splitKeystroke[index - 1] === '' ? '-' : key
      if (k) {
        keys.push(humanizeKey(k, platform))
      }
    })
    keys = uniq(flatten(keys))
    keys = platform === 'darwin' ? keys.join('') : keys.join('+')
    humanizedKeystrokes.push(keys)
  }

  return humanizedKeystrokes.join(' ')
}

// Returns a String containing the keystroke in a format that can be interpreted
// by Electron to provide nice icons where available.
export const acceleratorForKeystroke = keystroke => {
  if (!keystroke) return null

  let modifiers = keystroke.split(/-(?=.)/)
  const key = modifiers
    .pop()
    .toUpperCase()
    .replace('+', 'Plus')

  modifiers = modifiers.map(modifier =>
    modifier
      .replace(/shift/gi, 'Shift')
      .replace(/cmd/gi, 'Command')
      .replace(/ctrl/gi, 'Ctrl')
      .replace(/alt/gi, 'Alt')
  )

  const keys = [...modifiers, key]
  return keys.join('+')
}

// Add an item to a menu, ensuring separators are not duplicated.
export const addItemToMenu = (item, menu) => {
  const lastMenuItem = last(menu)
  const lastMenuItemIsSpearator = lastMenuItem && lastMenuItem.type === 'separator'
  if (!(item.type === 'separator' && lastMenuItemIsSpearator)) {
    menu.push(item)
  }
}

const ItemSpecificities = new WeakMap()

export const merge = (menu, item, itemSpecificity = Infinity) => {
  const itemClone = cloneMenuItem(item)

  ItemSpecificities.set(itemClone, itemSpecificity)

  const matchingItemIndex = findMatchingItemIndex(menu, itemClone)

  if (matchingItemIndex === -1) {
    addItemToMenu(itemClone, menu)
    return
  }

  const matchingItem = menu[matchingItemIndex]

  if (itemClone.submenu != null) {
    for (const submenuItem of itemClone.submenu) {
      merge(matchingItem.submenu, submenuItem, itemSpecificity)
    }
  } else if (itemSpecificity && itemSpecificity >= ItemSpecificities.get(matchingItem)) {
    menu[matchingItemIndex] = itemClone
  }
}

export const unmerge = (menu, item) => {
  const matchingItemIndex = findMatchingItemIndex(menu, item)
  if (matchingItemIndex === -1) {
    return
  }

  const matchingItem = menu[matchingItemIndex]
  if (item.submenu != null) {
    for (const submenuItem of item.submenu) {
      unmerge(matchingItem.submenu, submenuItem)
    }
  }

  if (matchingItem.submenu == null || matchingItem.submenu.length === 0) {
    menu.splice(matchingItemIndex, 1)
  }
}

const findMatchingItemIndex = (menu, { type, label, submenu }) => {
  if (type === 'separator') {
    return -1
  }
  for (let index = 0; index < menu.length; index++) {
    const item = menu[index]
    if (normalizeLabel(item.label) === normalizeLabel(label) && (item.submenu != null) === (submenu != null)) {
      return index
    }
  }
  return -1
}

export const normalizeLabel = label => {
  if (label == null) {
    return
  }
  return process.platform === 'darwin' ? label : label.replace(/&/g, '')
}

export const cloneMenuItem = item => {
  const clonedItem = pick(
    ['type',
      'label',
      'enabled',
      'visible',
      'command',
      'submenu',
      'commandDetail',
      'role',
      'accelerator',
      'before',
      'after',
      'beforeGroupContaining',
      'afterGroupContaining'],
    item
  )
  if (clonedItem.submenu != null) {
    clonedItem.submenu = clonedItem.submenu.map(submenuItem => cloneMenuItem(submenuItem))
  }
  return clonedItem
}
