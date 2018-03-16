import React, { Component } from 'react'
import './ConfigRep.css'

// 单独一项配置，提供修改功能
class SignalItem extends Component {
  handleInput (e) {
    this.props.changeValue(this.props.name, e.target.value)
  }
  render () {
    let comp = null
    if (this.props.name === 'onlineCommit' || this.props.name === 'localCommit') {
      comp = <b>{this.props.configValue}</b>
    } else {
      comp = <input type='text' placeholder='请输入' value={this.props.configValue} onChange={this.handleInput.bind(this)}/>
    }
    return (
      <li>
        <b>{this.props.name}：</b>
        {comp}
      </li>
    )
  }
}

// 单独一个又拍云空间配置：空间名、操作员、远程地址、线上commit号、本地commit
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
    this.runNpmInstall = this.runNpmInstall.bind(this)
    this.runDeploy = this.runDeploy.bind(this)
    this.state = {
      rep: this.props.rep,
      pendding: false
    }
  }
  penddingState () {
    this.setState({
      pendding: true
    })
  }
  noPendding () {
    this.setState({
      pendding: false
    })
  }
  componentWillMount () {
    // 获取当前仓库的当前分支
    let req = {
      method: 'POST',
      body: JSON.stringify({
        name: this.state.rep.name
      })
    }
    fetch(window.__define_url + 'repConfig/getCurrentBranch', req).then(response => {
      if (response.ok) {
        response.json().then(data => {
          this.setState({
            branch: data.content
          })
        }).catch(err => alert(err))
      }
    }).catch(err => {
      console.log(err)
    })
  }
  // 变更配置
  changeRepConfig () {
    let req = {
      method: 'POST',
      body: JSON.stringify(this.state.rep)
    }
    this.penddingState()
    fetch(window.__define_url + 'repConfig/configRep', req).then(response => {
      this.noPendding()
      if (response.ok) {
        response.json().then(data => {
          alert(data.content)
        }).catch(err => alert(err))
      } else {
        alert('rong')
      }
    }).catch(err => {
      this.noPendding()
      console.log(err)
    })
  }
  // 执行安装包命令
  runNpmInstall () {
    let req = {
      method: 'POST',
      body: JSON.stringify({
        name: this.state.rep.name
      })
    }
    this.penddingState()
    fetch(window.__define_url + 'repConfig/runNpmInstall', req).then(response => {
      this.noPendding()
      if (response.ok) {
        response.json().then(data => {
          alert(data.content)
        }).catch(err => alert(err))
      }
    }).catch(err => {
      this.noPendding()
      console.log(err)
    })
  }
  // 执行发布命令
  runDeploy () {
    let req = {
      method: 'POST',
      body: JSON.stringify({
        name: this.state.rep.name
      })
    }
    this.penddingState()
    fetch(window.__define_url + 'repConfig/deploy', req).then(response => {
      this.props.refreshConfig()
      this.noPendding()
      if (response.ok) {
        response.json().then(data => {
          alert(data.content)
        }).catch(err => alert(err))
      }
    }).catch(err => {
      this.props.refreshConfig()
      this.noPendding()
      console.log(err)
    })
  }
  render () {
    let penddingText = this.state.pendding ? <b style={{color:'blue'}}>【请求中】</b> : ''
    return (
      <li className='one-rep'>
        <h2 className='rep-name'>{this.props.rep.name}:【当前分支:{this.state.branch}】{penddingText}</h2>
        <input className='btn' type='button' value='变更配置' onClick={this.changeRepConfig}/>
        <input className='btn' type='button' value='安装依赖包' onClick={this.runNpmInstall}/>
        <input className='btn' type='button' value='根据当前分支发布' onClick={this.runDeploy}/>
        <OneUpyunConfig configList={this.state.rep.deploy}>
          <h3>deployConfig</h3>
        </OneUpyunConfig>
        <p style={{color: 'blue'}}>{this.state.rep.prodLog}</p>
        <OneUpyunConfig configList={this.state.rep.preDeploy}>
          <h3>preDeployConfig</h3>
        </OneUpyunConfig>
        <p style={{color: 'blue'}}>{this.state.rep.preLog}</p>
      </li>
    )
  }
}

class ConfigRep extends Component {
  constructor (props) {
    super(props)
    this.state = {
      repMap: new Map()
    }
  }
  getAllConfig () {
    fetch(window.__define_url + 'repConfig/getAllConfig', { method: 'GET'}).then(response => {
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
  componentWillMount () {
    this.getAllConfig()
  }
  render() {
    let componentList = []
    this.state.repMap.forEach((value, key) => {
      componentList.push(<OneRep rep={value} key={key} refreshConfig={this.getAllConfig.bind(this)}/>)
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

export default ConfigRep
