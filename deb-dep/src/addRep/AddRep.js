import React, {Component} from 'react'
import {Loading} from '../util/uitl'

import './AddRep.css'

class FormItem extends Component {
  constructor(props) {
    super(props)
    this.handleFocus = this.handleFocus.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.handleValueInput = this.handleValueInput.bind(this)
    this.state = {
      form: this.props.data,
      focused: false
    }
  }
  handleFocus(e) {
    this.setState({
      focused: true
    })
  }
  handleBlur(e) {
    this.setState({
      focused: false
    })
  }
  handleValueInput(e) {
    let rfrom = this.state.form
    let form = {
      name: rfrom.name,
      label: rfrom.label,
      placeholder: rfrom.placeholder,
      value: e.target.value
    }
    this.setState({form})
  }
  render () {
    let form = this.state.form
    let className = 'input-animation-border '
    className += this.state.focused ? 'active' : ''
    return (
      <div className='form-item'>
        <label className='control-label'>{form.label}</label>
        <input className='input' type='text' onFocus={this.handleFocus} onBlur={this.handleBlur} onChange={this.handleValueInput} value={form.value} placeholder={form.placeholder}/>
        <i className={className}></i>
      </div>
    )
  }
}

let formParams = [
  [
    'repName', {
      name: 'repName',
      label: '仓库名称',
      placeholder: '请务必保证与代码仓库名称一致',
      value: ''
    },
  ],
  [
    'repUrl', {
      name: 'repUrl',
      label: '仓库地址',
      placeholder: 'ssh地址',
      value: ''
    },
  ]
]

class AddRep extends Component {
  constructor (props) {
    super(props)
    this.submit = this.submit.bind(this)
    this.state = {
      form: new Map(formParams),
      loading: false
    }
  }
  shiftLoading () {
    this.setState((prevState) => ({
      loading: !prevState.loading
    }))
  }
  submit (e) {
    e.preventDefault()
    let req = {
      method: 'POST',
      body: JSON.stringify({
        name: this.state.form.get('repName').value,
        url: this.state.form.get('repUrl').value
      })
    }
    if (!req.body.name||!req.body.url) {
      alert('请填写完整信息')
      return
    }
    this.shiftLoading()
    fetch(window.__define_url + 'repConfig/createRep', req).then(response => {
      if (response.ok) {
        this.shiftLoading()
        response.json().then(data => {
          alert(data.content)
        }).catch(err => alert(err))
      } else {
        this.shiftLoading()
      }
    }).catch(err => {
      this.shiftLoading()
      console.log(err)
    })
  }
  render () {
    let items = []
    let isLoading = this.state.loading ? <Loading/> : ''
    this.state.form.forEach((value, key) => {
      items.push(<FormItem data={value} key={key}/>)
    })
    return (
      <div id='add-rep-area' >
        <form onSubmit={this.submit}>
          {isLoading}
          {items}
          <input className='btn' type='submit' value='提交'></input>
        </form>
      </div>
    )
  }
}

export default AddRep
