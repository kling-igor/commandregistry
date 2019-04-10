export class Workspace {
  parent = null

  children = []

  tag = 'workspace'

  add(child) {
    if (this.children.includes(child)) {
      console.log('already includes')
      return
    }

    this.children.push(child)
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
    // console.log('CLOSE ALL OPENED FILES')
  }
}