import React, {Component} from 'react'

import './AddRep.css'

class AddRep extends Component {
  constructor (props) {
    super(props)
    this.submit = this.submit.bind(this)
    this.handleInputUrl = this.handleInputUrl.bind(this)
    this.handleInputRepName = this.handleInputRepName.bind(this)
    this.state = {
      repName: '',
      repUrl: '',
      loading: false
    }
  }
  handleInputRepName (e) {
    this.setState({
      repName: e.target.value
    })
  }
  handleInputUrl (e) {
    this.setState({
      repUrl: e.target.value
    })
  }
  submit (e) {
    e.preventDefault()
    this.setState({
      loading: true
    })
    let req = {
      method: 'POST',
      body: JSON.stringify({
        name: this.state.repName,
        url: this.state.repUrl
      })
    }
    fetch(window.__define_url + 'repConfig/createRep', req).then(response => {
      if (response.ok) {
        response.json().then(data => {
          alert(data.content)
          this.setState({
            loading: true
          })
        })
      }
    }).catch(err => {
      console.log(err)
    })
  }
  render () {
    let loading = this.state.loading ? '<span>请求中......</span>' : ''
    return (
      <div className='add-rep-area'>
        <form onSubmit={this.submit}>
          <span>仓库名称</span><input className='input' type='text' value={this.state.repName} onChange={this.handleInputRepName} placeholder='请务必保证与代码仓库名称一致'/><br/><br/>
          <span>仓库地址</span><input className='input' type='text' value={this.state.repUrl} onChange={this.handleInputUrl} placeholder='ssh地址'/><br/><br/>
          <input className='btn' type='submit' value='提交'></input>
          {loading}
        </form>
      </div>
    )
  }
}

export default AddRep
