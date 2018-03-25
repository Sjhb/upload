
import React, { Component } from 'react'
import {HashRouter as Router, Route } from 'react-router-dom'

import './App.css'
import ConfigRep from './configRep/ConfigRep'
import AddRep from './addRep/AddRep'
import TopBar from './topBar/TopBar'

class App extends Component {
  componentWillMount () {
    if (process.env.NODE_ENV === 'production') {
      window.__define_url = 'http://118.31.35.103:8888/'
    } else {
      window.__define_url = 'http://127.0.0.1:8000/'
    }
  }
  render () {
    return (
      <div>
        <Router>
          <div className='container'>
            <TopBar/>
            <Route exact path='/' component={AddRep}/>
            <Route path='/configrep' component={ConfigRep}/>
          </div>
        </Router>
      </div>
    )
  }
}

export default App
