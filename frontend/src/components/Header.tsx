import React from 'react'
import { Link } from 'react-router-dom'
import { getToken, clearToken } from '../utils/auth'
import { useNavigate } from 'react-router-dom'

export default function Header() {
  const token = getToken()
  const navigate = useNavigate()

  const logout = () => {
    clearToken()
    navigate('/login')
  }

  const homeLink = token ? '/dashboard' : '/'

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to={homeLink} className="font-semibold text-lg">Task Manager</Link>
        <div className="flex items-center gap-3">
          {token ? (
            <>
              <Link to="/dashboard" className="px-3 py-1">Dashboard</Link>
              <Link to="/profile" className="px-3 py-1">Profile</Link>
              <button onClick={logout} className="px-3 py-1 text-sm text-red-600">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-1">Login</Link>
              <Link to="/register" className="px-3 py-1">Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
