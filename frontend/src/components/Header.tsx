import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getToken, clearToken } from '../utils/auth.js'
import { useNavigate } from 'react-router-dom'

export default function Header() {
  const token = getToken()
  const navigate = useNavigate()
  const location = useLocation()

  const logout = () => {
    clearToken()
    navigate('/login')
  }

  const homeLink = token ? '/dashboard' : '/'

  const getNavLinkClass = (path: string) => {
    const isActive = location.pathname === path
    return `px-4 py-2 font-medium rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
    }`
  }

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to={homeLink} className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Task Manager
          </span>
        </Link>

        <nav className="flex items-center space-x-2">
          {token ? (
            <>
              <Link
                to="/dashboard"
                className={getNavLinkClass('/dashboard')}
              >
                Dashboard
              </Link>
              <Link
                to="/analytics"
                className={getNavLinkClass('/analytics')}
              >
                Analytics
              </Link>
              <Link
                to="/profile"
                className={getNavLinkClass('/profile')}
              >
                Profile
              </Link>
              <button
                onClick={logout}
                className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 font-medium rounded-lg transition-all duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={getNavLinkClass('/login')}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={getNavLinkClass('/register')}
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
