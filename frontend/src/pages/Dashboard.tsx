import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios.js'
import { Link } from 'react-router-dom'

type Task = {
  _id: string
  description: string
  completed: boolean
}

async function fetchTasks() {
  const res = await api.get('/tasks')
  return res.data
}

export default function Dashboard() {
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery(['tasks'], fetchTasks)

  const [description, setDescription] = useState('')

  const createTask = useMutation(
    async (newTask: { description: string }) => {
      const res = await api.post('/tasks', newTask)
      return res.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks'])
        setDescription('')
      }
    }
  )

  const updateTask = useMutation(
    async ({ id, updates }: { id: string; updates: { completed: boolean } }) => {
      const res = await api.patch(`/tasks/${id}`, updates)
      return res.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks'])
      }
    }
  )

  const deleteTask = useMutation(
    async (id: string) => {
      await api.delete(`/tasks/${id}`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks'])
      }
    }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md mx-auto">
        <div className="flex items-center">
          <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Error loading tasks. Please try again.
        </div>
      </div>
    )
  }

  const pendingTasks = data?.filter((task: Task) => !task.completed) || []
  const completedTasks = data?.filter((task: Task) => task.completed) || []

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Manage your tasks and stay organized</p>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card text-center">
          <div className="text-2xl font-bold text-orange-600 mb-2">{completedTasks.length}</div>
          <div className="text-sm text-gray-500">Tasks Completed Today</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">
            {Math.round((completedTasks.length / (completedTasks.length + pendingTasks.length || 1)) * 100)}%
          </div>
          <div className="text-sm text-gray-500">Completion Rate</div>
        </div>
        <div className="card text-center">
          <Link to="/analytics" className="text-blue-600 hover:text-blue-700 font-medium">
            <div className="text-2xl font-bold text-blue-600 mb-2">📊</div>
            <div className="text-sm">View Analytics</div>
          </Link>
        </div>
      </div>

      {/* Add Task Form */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Task
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!description.trim()) return
            createTask.mutate({ description: description.trim() })
          }}
          className="flex gap-3"
        >
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What needs to be done?"
            className="input-field flex-1"
            disabled={createTask.isLoading}
          />
          <button
            type="submit"
            className="btn-primary whitespace-nowrap"
            disabled={createTask.isLoading || !description.trim()}
          >
            {createTask.isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Adding...
              </div>
            ) : (
              'Add Task'
            )}
          </button>
        </form>
      </div>

      {/* Tasks Sections */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Pending Tasks */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pending Tasks ({pendingTasks.length})
          </h3>
          <div className="space-y-3">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                No pending tasks
              </div>
            ) : (
              pendingTasks.map((task: Task) => (
                <div key={task._id} className="bg-orange-50 border border-orange-200 rounded-lg p-4 hover:bg-orange-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">{task.description}</p>
                      <p className="text-sm text-orange-600 mt-1">Pending</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => updateTask.mutate({ id: task._id, updates: { completed: true } })}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Mark as completed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteTask.mutate(task._id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete task"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Completed Tasks ({completedTasks.length})
          </h3>
          <div className="space-y-3">
            {completedTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                No completed tasks yet
              </div>
            ) : (
              completedTasks.map((task: Task) => (
                <div key={task._id} className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">{task.description}</p>
                      <p className="text-sm text-green-600 mt-1">Completed</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => updateTask.mutate({ id: task._id, updates: { completed: false } })}
                        className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                        title="Mark as pending"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteTask.mutate(task._id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete task"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
