import chai, { expect } from 'chai'
import deepEql from 'deep-eql'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from "chai-as-promised"

import { CommandRegistry } from '..'
import { Workspace } from '../workspace'
import { TextEditor } from '../text-editor'

chai.use(sinonChai);
chai.use(chaiAsPromised);


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

  it('should not execute unregistered command', () => {
    const workspace = new Workspace()
    const commands = new CommandRegistry()
    commands.attach(workspace)

    const result = commands.handleCommand(workspace, 'files:open-project')

    expect(result).to.be.null
  })

  it('should return promise on command execution', () => {
    const workspace = new Workspace()

    const commands = new CommandRegistry()

    const disposabel = commands.add('workspace', 'files:close-all', function (args) {
      this.closeAllFiles()
    })

    commands.attach(workspace)


    const promise = commands.handleCommand(workspace, 'files:close-all')

    expect(promise).to.be.fulfilled

    disposabel.dispose()
  })
})

