import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { saveToken } from '../utils/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const res = await api.post('/users/login', { email, password })
      saveToken(res.data.token)
      navigate('/dashboard')
    } catch (err: any) {
      const serverErr = err?.response?.data?.error || err?.response?.data?.message || err?.response?.data || err?.message
      setError(serverErr || 'Login failed')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border px-2 py-1 rounded" />
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border px-2 py-1 rounded" />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded">Login</button>
        </div>
      </form>
    </div>
  )
}
