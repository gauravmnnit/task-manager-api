import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'
import { clearToken } from '../utils/auth'
import { useNavigate } from 'react-router-dom'

async function fetchUser() {
  const res = await api.get('/users/me')
  return res.data
}

export default function Profile() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery(['me'], fetchUser)
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [age, setAge] = useState<number | ''>('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const logout = async () => {
    try {
      await api.post('/users/logout')
    } catch (e) {
      // ignore
    }
    clearToken()
    navigate('/login')
  }

  const updateMutation = useMutation(
    async (updates: { name?: string; email?: string; age?: number }) => {
      const res = await api.patch('/users/me', updates)
      return res.data
    },
    {
      onSuccess: (res) => {
        queryClient.invalidateQueries(['me'])
        setIsEditing(false)
        setError(null)
      },
      onError: (err: any) => {
        setError(err?.response?.data?.error || err?.message || 'Update failed')
      }
    }
  )

  const startEdit = () => {
    setName(data?.name || '')
    setEmail(data?.email || '')
    setAge(typeof data?.age === 'number' ? data.age : '')
    setIsEditing(true)
    setError(null)
  }

  const save = async () => {
    setError(null)
    const updates: any = {}
    if (name) updates.name = name
    if (email) updates.email = email
    if (age !== '') updates.age = Number(age)
    updateMutation.mutate(updates)
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Profile</h2>
      <div className="p-4 border rounded bg-white max-w-md">
        {!isEditing ? (
          <>
            <div className="mb-2"><strong>Name:</strong> {data?.name}</div>
            <div className="mb-2"><strong>Email:</strong> {data?.email}</div>
            <div className="mb-2"><strong>Age:</strong> {data?.age ?? '-'}</div>
            <div className="mt-4 flex gap-2">
              <button onClick={startEdit} className="px-4 py-2 bg-blue-600 text-white rounded">Edit</button>
              <button onClick={logout} className="px-4 py-2 bg-red-500 text-white rounded">Logout</button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-2">
              <label className="block text-sm">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border px-2 py-1 rounded" />
            </div>
            <div className="mb-2">
              <label className="block text-sm">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border px-2 py-1 rounded" />
            </div>
            <div className="mb-2">
              <label className="block text-sm">Age</label>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border px-2 py-1 rounded" />
            </div>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            <div className="mt-4 flex gap-2">
              <button onClick={save} className="px-4 py-2 bg-green-600 text-white rounded" disabled={updateMutation.isLoading}>{updateMutation.isLoading ? 'Saving...' : 'Save'}</button>
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded">Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
