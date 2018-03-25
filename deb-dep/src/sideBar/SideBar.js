import React, {Component} from 'react'
import './SideBar.css'

class MenuItem extends Component {
  render () {
    return (
      <li>
        <a>{this.props.name}</a>
      </li>
    )
  }
}

export default class extends Component {
  constructor(props) {
    super(props)
  }
  render() {
    return (
      <div className='side-bar'>a</div>
    )
  }
}
