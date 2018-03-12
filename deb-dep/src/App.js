import React, { Component } from 'react'
import './App.css'

// 单独一项配置，提供修改功能
class SignalItem extends Component {
  handleInput (e) {
    this.props.changeValue(this.props.name, e.target.value)
  }
  render () {
    let configValue = this.props.configValue
    return (
      <li>
        <b>{this.props.name}：</b>
        <input type='text' placeholder='请输入' value={configValue} onChange={this.handleInput.bind(this)}/>
      </li>
    )
  }
}

// 单独一个又拍云空间配置：空间名、操作员、远程地址
class OneUpyunConfig extends Component {
  constructor (props) {
    super(props)
    this.handleInput = this.handleInput.bind(this)
    this.state = {
      repconfig: this.props.configList
    }
  }
  handleInput (key, value) {
    let config = this.state.repconfig
    config[key] = value
    this.setState({
      repconfig: config
    })
  }
  render () {
    let configList = this.props.configList
    let items = []
    for (let item in configList) {
      items.push(<SignalItem name={item} configValue={configList[item]} changeValue={this.handleInput} key={item}/>)
    }
    return (
      <ul>
        {this.props.children}
        {items}
      </ul>
    )
  }
}

// 一个仓库配置：预发、正式配置
class OneRep extends Component {
  constructor (props) {
    super(props)
    this.changeRepConfig = this.changeRepConfig.bind(this)
    this.state = {
      rep: this.props.rep
    }
  }
  changeRepConfig () {
    let req = {
      method: 'POST',
      body: JSON.stringify(this.state.rep)
    }
    fetch('http://localhost:8001/repConfig/configRep', req).then(response => {
      if (response.ok) {
        response.json().then(data => {
          alert(data.content)
        })
      }
    }).catch(err => {
      console.log(err)
    })
  }
  render () {
    return (
      <li className='one-rep'>
        <h3 className='rep-name'>{this.props.rep.name}:</h3>
        <input className='btn' type='button' value='变更配置' onClick={this.changeRepConfig}/>
        <OneUpyunConfig configList={this.state.rep.deploy}>
          <p>deployConfig</p>
        </OneUpyunConfig>
        <OneUpyunConfig configList={this.state.rep.preDeploy}>
          <p>preDeployConfig</p>
        </OneUpyunConfig>
      </li>
    )
  }
}

class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      repMap: new Map()
    }
  }
  componentWillMount () {
    fetch('http://localhost:8001/repConfig/getAllConfig', { method: 'GET'}).then(response => {
      if(response.ok) {
        response.json().then(data => {
          const reps = data.content
          let repTemp = this.state.repMap
          for (let rep in  reps) {
            repTemp.set(rep, reps[rep])
          }
          this.setState({
            repList: repTemp
          })
        })
      }
    }).catch(err => {
      console.log(err)
    })
  }
  render() {
    let componentList = []
    this.state.repMap.forEach((value, key) => {
      componentList.push(<OneRep rep={value} key={key}/>)
    })
    return (
      <div className='app-root'>
        <ul>
          {componentList}
        </ul>
      </div>
    )
  }
}

export default App
