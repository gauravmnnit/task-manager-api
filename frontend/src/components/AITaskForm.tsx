import React, { useState } from 'react'
import api from '../api/axios.js'

const AITaskForm = ({ }) => {

    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)

    const createAITask = async () => {

        if (!description.trim()) {
            return
        }

        try {

            setLoading(true)

            // const token = localStorage.getItem('token')

            const response = await api.post('/tasks/ai', {
                description
            })

            if (!response) {
                throw new Error('Failed to create AI task')
            }

            const data = response.data

            console.log('AI Task:', data)

            setDescription('')

        } catch (e) {

            console.log(e)

            alert('AI task creation failed')

        } finally {

            setLoading(false)
        }
    }

    return (

    <div className="ai-task-form">

        {/* Add Task Form */}
        <div className="card mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create AI Task
            </h2>
            <form onSubmit={(e) => {
                e.preventDefault()
                if (!description.trim()) return
                    createAITask();
            }}
          className="flex gap-3">
            <input
                type='text'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task..."
                className="input-field flex-1"
            />
            <button
                type="submit"
                className="btn-primary whitespace-nowrap"
                disabled={loading}
            >
                {
                    loading
                        ? 'Generating...'
                        : 'Create AI Task'
                }
            </button>
            </form>
        </div>
      </div>

        // <div className="ai-task-form">

        //     <h3>Create AI Task</h3>

        //     <input
        //         type="text"
        //         placeholder="Enter task..."
        //         value={description}
        //         onChange={(e) => setDescription(e.target.value)}
        //     />

        //     <button
        //         onClick={createAITask}
        //         disabled={loading}
        //     >

        //         {
        //             loading
        //                 ? 'Generating...'
        //                 : 'Create AI Task'
        //         }

        //     </button>

        // </div>
    )
}

export default AITaskForm