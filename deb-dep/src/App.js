import React, { Component } from 'react'
import {BrowserRouter as Router, Route, Link, Redirect, withRouter } from 'react-router-dom'

import './App.css'
import ConfigRep from './configRep/ConfigRep'
import AddRep from './addRep/AddRep'

class App extends Component {
  componentWillMount () {
    // window.__define_url = 'http://localhost:8000/'
    window.__define_url = 'http://www.excute.cn/'
  }
  render () {
    return (
      <div>
        <Router>
          <div>
            <h3><Link to='/configrep'>配置仓库</Link></h3>
            <h3><Link to='/addrep'>添加仓库</Link></h3>
            <Route path='/configrep' component={ConfigRep}/>
            <Route path='/addrep' component={AddRep}/>
          </div>
        </Router>
      </div>
    )
  }
}

export default App
