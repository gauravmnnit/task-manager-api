import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'

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
        // refresh tasks list
        queryClient.invalidateQueries(['tasks'])
        setDescription('')
      }
    }
  )

  if (isLoading) return <div>Loading tasks...</div>
  if (error) return <div>Error loading tasks</div>

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Your tasks</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!description.trim()) return
          createTask.mutate({ description: description.trim() })
        }}
        className="mb-6 flex gap-2"
      >
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="New task description"
          className="flex-1 border px-3 py-2 rounded"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded"
          disabled={createTask.isLoading}
        >
          {createTask.isLoading ? 'Adding...' : 'Add Task'}
        </button>
      </form>

      <div className="space-y-3">
        {data && data.length === 0 && <div>No tasks yet</div>}
        {data && data.map((task: Task) => (
          <div key={task._id} className="p-3 border rounded bg-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{task.description}</div>
                <div className="text-sm text-gray-500">{task.completed ? 'Completed' : 'Pending'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
