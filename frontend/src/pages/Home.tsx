import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="text-center mt-20">
      <h1 className="text-3xl font-bold mb-4">Task Manager</h1>
      <p className="mb-6">Simple tasks API client</p>
      <div className="flex items-center justify-center gap-4">
        <Link to="/register" className="px-4 py-2 bg-indigo-600 text-white rounded">Register</Link>
        <Link to="/login" className="px-4 py-2 border rounded">Login</Link>
      </div>
    </div>
  )
}
