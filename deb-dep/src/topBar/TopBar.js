import React from 'react'
import {withRouter, Link} from 'react-router-dom'
import './TopBar.css'

const paths = [{path: '/', name: '添加仓库'}, {path: '/configrep', name: '仓库操作'}]

let TopBar = ({match, location, history}) => {
  let links = paths.map(ele => {
    let className = location.pathname === ele.path ? 'active nav-cell' : 'nav-cell'
    return <li key={ele.path} className={className}><Link to={ele.path}>{ele.name}</Link></li>
  })
  return (
    <header id='top-bar'>
      <nav>
        <ul className='clearfix'>
          {links}
        </ul>
      </nav>
    </header>
  )
}

export default withRouter(TopBar)
