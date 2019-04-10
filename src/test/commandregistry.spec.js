import chai, { expect } from 'chai'
import deepEql from 'deep-eql'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
chai.use(sinonChai);


import { CommandRegistry } from '..'
import { Workspace } from '../workspace'
import { TextEditor } from '../text-editor'



describe('command registry', () => {
  it('should execute registered command on Workspace', () => {

    const workspace = new Workspace()
    const textEditor = new TextEditor()
    workspace.add(textEditor)

    const commands = new CommandRegistry()

    const disposabel = commands.add('workspace', 'files:close-all', function (args) {
      this.closeAllFiles()
    })

    commands.attach(workspace)


    // setup
    sinon.spy(workspace, "closeAllFiles")

    commands.handleCommand(workspace, 'files:close-all')

    // expect(true).to.be.equals(true)

    expect(workspace.closeAllFiles).to.have.been.calledOnce

    // teardown
    workspace.closeAllFiles.restore()

    disposabel.dispose()
  })

  it('should execute registered command on TextEditor', () => {

    const workspace = new Workspace()
    const textEditor = new TextEditor()
    workspace.add(textEditor)

    const commands = new CommandRegistry()

    const disposabel = commands.add('text-editor', 'editor:fold-all', function (args) {
      this.foldAll()
    })

    commands.attach(workspace)


    // setup
    sinon.spy(textEditor, "foldAll")

    commands.handleCommand(textEditor, 'editor:fold-all')

    // expect(true).to.be.equals(true)

    expect(textEditor.foldAll).to.have.been.calledOnce

    // teardown
    textEditor.foldAll.restore()

    disposabel.dispose()
  })
})

