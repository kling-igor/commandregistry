import { expect } from 'chai'
import deepEql from 'deep-eql'

import { CommandRegistry } from '..'

class Workspace {
  parent = null

  children = []

  tag = 'workspace'

  add(child) {
    if (this.children.includes(child)) {
      console.log('already includes')
      return
    }

    this.children(child)
    child.setParent(this)
  }

  remove(removingChild) {
    const length = this.children.length

    this.children = this.children.filter(item => item != removingChild)

    if (this.children.length !== length) {
      removingChild.removeFromParent(this)
    }
  }

  closeAllFiles() {
    console.log('CLOSE ALL OPENED FILES')
  }
}

class TextEditor {
  tag = 'text-editor'

  setParent(parent) {
    this.parent = parent
  }

  removeFromParent(parent) {
    if (this.parent === parent) {
      this.parent = null
    }
  }
}

describe('command registry', () => {
  it('should be true', () => {
    const workspace = new Workspace()
    const textEditor = new TextEditor()
    workspace.add(textEditor)

    const commands = new CommandRegistry()

    commands.add('workspace', 'files:close-all', function(event) {
      this.closeAllFiles()
    })

    commands.attach(workspace)

    // expect(true).to.be.equals(true)
  })
})
