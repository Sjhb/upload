import React, {Component} from 'react'
import './util.css'

class Loading extends Component {
  render () {
    return (
      <div className='util-loading'>
        <i className='top-animation'></i>
      </div>
    )
  }
}

export {
  Loading
}
