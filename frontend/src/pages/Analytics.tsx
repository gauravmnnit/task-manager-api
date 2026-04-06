import React from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/axios.js'

interface TaskAnalytics {
  id: string
  description: string
  completed: boolean
  createdAt: string
  completedAt: string | null
  completionTimeMs: number | null
  completionTimeHours: number | null
  completionTimeDays: number | null
  isOverdue: boolean
}

interface ActivityData {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  currentStreak: number
  longestStreak: number
  weeklyActivity: Array<{
    date: string
    tasksCompleted: number
  }>
  monthlyActivity: Array<{
    date: string
    tasksCompleted: number
  }>
  taskAnalytics: TaskAnalytics[]
  avgCompletionTime: number | null
  avgCompletionTimeHours: number | null
  avgCompletionTimeDays: number | null
  tasksByWeek: Record<string, { created: number; completed: number }>
  tasksByMonth: Record<string, { created: number; completed: number }>
  pendingTasksByAge: {
    today: number
    thisWeek: number
    thisMonth: number
    older: number
  }
  fastestCompletion: number | null
  slowestCompletion: number | null
}

async function fetchAnalytics(): Promise<ActivityData> {
  const res = await api.get('/analytics/activity')
  return res.data
}

export default function Analytics() {
  const { data, isLoading, error } = useQuery(['analytics'], fetchAnalytics)

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
          Error loading analytics. Please try again.
        </div>
      </div>
    )
  }

  const maxWeeklyTasks = Math.max(...(data?.weeklyActivity.map(d => d.tasksCompleted) || [0]), 1)
  const maxMonthlyTasks = Math.max(...(data?.monthlyActivity.map(d => d.tasksCompleted) || [0]), 1)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics</h1>
        <p className="text-gray-600">Track your productivity and task completion patterns</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{data?.totalTasks || 0}</div>
          <div className="text-sm text-gray-500">Total Tasks</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{data?.completedTasks || 0}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">{data?.pendingTasks || 0}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">{Math.round(((data?.completedTasks || 0) / (data?.totalTasks || 1)) * 100)}%</div>
          <div className="text-sm text-gray-500">Completion Rate</div>
        </div>
      </div>

      {/* Streaks */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
            Current Streak
          </h3>
          <div className="text-center">
            <div className="text-6xl font-bold text-orange-600 mb-2">{data?.currentStreak || 0}</div>
            <div className="text-gray-600">consecutive days with completed tasks</div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Longest Streak
          </h3>
          <div className="text-center">
            <div className="text-6xl font-bold text-green-600 mb-2">{data?.longestStreak || 0}</div>
            <div className="text-gray-600">best consecutive day streak</div>
          </div>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className="card mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Weekly Activity (Last 7 Days)
        </h3>
        <div className="flex items-end justify-between h-64 gap-2">
          {data?.weeklyActivity.map((day, index) => (
            <div key={day.date} className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col items-center justify-end h-full">
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-700 hover:to-blue-500"
                  style={{
                    height: `${(day.tasksCompleted / maxWeeklyTasks) * 100}%`,
                    minHeight: day.tasksCompleted > 0 ? '8px' : '0px'
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-2 text-center">
                <div className="font-medium">{day.tasksCompleted}</div>
                <div>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Activity Chart */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Monthly Activity (Last 30 Days)
        </h3>
        <div className="h-64">
          <div className="flex items-end justify-between h-full gap-1">
            {data?.monthlyActivity.map((day, index) => (
              <div key={day.date} className="flex-1 flex flex-col items-center justify-end">
                <div
                  className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-sm transition-all duration-300 hover:from-purple-700 hover:to-purple-500"
                  style={{
                    height: `${(day.tasksCompleted / maxMonthlyTasks) * 100}%`,
                    minHeight: day.tasksCompleted > 0 ? '4px' : '0px'
                  }}
                ></div>
                {index % 7 === 0 && (
                  <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 text-center text-sm text-gray-500">
          Tasks completed per day over the last 30 days
        </div>
      </div>

      {/* Task Completion Analytics */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Completion Times
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average completion time:</span>
              <span className="font-semibold text-indigo-600">
                {data?.avgCompletionTimeDays ? `${data.avgCompletionTimeDays} days` :
                 data?.avgCompletionTimeHours ? `${data.avgCompletionTimeHours} hours` :
                 'No data'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Fastest completion:</span>
              <span className="font-semibold text-green-600">
                {data?.fastestCompletion ? `${Math.round(data.fastestCompletion / (1000 * 60 * 60))} hours` : 'No data'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Slowest completion:</span>
              <span className="font-semibold text-red-600">
                {data?.slowestCompletion ? `${Math.round(data.slowestCompletion / (1000 * 60 * 60 * 24))} days` : 'No data'}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pending Tasks by Age
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Created today:</span>
              <span className="font-semibold text-red-600">{data?.pendingTasksByAge.today || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">This week:</span>
              <span className="font-semibold text-orange-600">{data?.pendingTasksByAge.thisWeek || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">This month:</span>
              <span className="font-semibold text-yellow-600">{data?.pendingTasksByAge.thisMonth || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Older:</span>
              <span className="font-semibold text-gray-600">{data?.pendingTasksByAge.older || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Task Analytics Table */}
      <div className="card mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Recent Task Analytics
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Task</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Completed</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Time to Complete</th>
              </tr>
            </thead>
            <tbody>
              {data?.taskAnalytics.slice(0, 10).map((task) => (
                <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="max-w-xs truncate" title={task.description}>
                      {task.description}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      task.completed
                        ? 'bg-green-100 text-green-800'
                        : task.isOverdue
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.completed ? 'Completed' : task.isOverdue ? 'Overdue' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {task.completionTimeDays
                      ? `${task.completionTimeDays} days`
                      : task.completionTimeHours
                      ? `${task.completionTimeHours} hours`
                      : '-'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!data?.taskAnalytics || data.taskAnalytics.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            No tasks found
          </div>
        )}
      </div>

      {/* Task Creation vs Completion Trends */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Task Creation vs Completion Trends
        </h3>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">By Week (Recent)</h4>
            <div className="space-y-2">
              {Object.entries(data?.tasksByWeek || {})
                .sort(([a], [b]) => b.localeCompare(a))
                .slice(0, 5)
                .map(([week, stats]) => (
                  <div key={week} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{week}</span>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-blue-600">+{stats.created}</span>
                      <span className="text-green-600">✓{stats.completed}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-4">By Month (Recent)</h4>
            <div className="space-y-2">
              {Object.entries(data?.tasksByMonth || {})
                .sort(([a], [b]) => b.localeCompare(a))
                .slice(0, 5)
                .map(([month, stats]) => (
                  <div key={month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{month}</span>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-blue-600">+{stats.created}</span>
                      <span className="text-green-600">✓{stats.completed}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
