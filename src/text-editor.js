export class TextEditor {
  tag = 'text-editor'

  setParent(parent) {
    this.parent = parent
  }

  removeFromParent(parent) {
    if (this.parent === parent) {
      this.parent = null
    }
  }

  foldAll() {
    // console.log('Fold All')
  }
}