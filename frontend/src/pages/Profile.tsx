import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios.js'
import { clearToken } from '../utils/auth.js'
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account information</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-2">
          <div className="card">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mr-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{data?.name}</h2>
                <p className="text-gray-600">{data?.email}</p>
              </div>
            </div>

            {!isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">Full Name</div>
                    <div className="font-medium text-gray-900">{data?.name}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">Age</div>
                    <div className="font-medium text-gray-900">{data?.age ?? 'Not specified'}</div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Email</div>
                  <div className="font-medium text-gray-900">{data?.email}</div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={startEdit} className="btn-primary">
                    <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                  <button onClick={logout} className="btn-secondary text-red-600 hover:text-red-700 hover:bg-red-50">
                    <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="label">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                    className="input-field"
                    placeholder="Enter your age"
                    min="1"
                    max="120"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={save}
                    className="btn-primary"
                    disabled={updateMutation.isLoading}
                  >
                    {updateMutation.isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </div>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="btn-secondary"
                    disabled={updateMutation.isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Card */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Stats</h3>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">Active</div>
              <div className="text-sm text-gray-500">Account Status</div>
            </div>
            <div className="border-t pt-4">
              <div className="text-sm text-gray-500 mb-2">Member since</div>
              <div className="font-medium text-gray-900">
                {data?._id ? new Date(parseInt(data._id.substring(0, 8), 16) * 1000).toLocaleDateString() : 'Unknown'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
