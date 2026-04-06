const express=require('express')
const Task=require('../models/task')
const auth=require('../middleware/auth')
const { sendTaskCreatedEmail, sendTaskCompletedEmail } = require('../emails/account')
const router=new express.Router()

router.post('/tasks', auth, async (req, res)=>{
    const task = new Task({
        ...req.body,
        owner:req.user._id
    })

    try{
        await task.save()

        // Send email notification for task creation
        sendTaskCreatedEmail(req.user.email, req.user.name, task.description)

        res.status(201).send(task)
    }catch(e){
        res.status(400).send(e)
    }
})

//GET /tasks?completed=true
//GET /tasks?limit=10&skip=0
//GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res)=>{
    const match={}
    const sort={}
    if(req.query.completed){
        match.completed = req.query.completed==='true'
    }

    if(req.query.sortBy){
        const parts=req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1:1
    }

    try{
        await req.user.populate({
            path:'tasks',
            match,
            options:{
                limit:parseInt(req.query.limit),
                skip:parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    }catch(e){
        res.status(500).send()
    }
})

router.get('/tasks/:id', auth, async (req, res)=>{
    const _id=req.params.id

    try{
        const task=await Task.findOne({_id, owner:req.user._id})

        if(!task){
            return res.status(404).send()
        }

        res.send(task)
    }catch(e){
        res.status(500).send()
    }
})

router.patch('/tasks/:id', auth, async (req, res)=>{

    const updates=Object.keys(req.body)
    const allowedUpdates=["description", "completed"]
    const isValidOperation=updates.every((update)=>allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send({error:"Invalid Update!"})
    }

    try{
        const task=await Task.findOne({_id:req.params.id, owner:req.user._id})

        if(!task){
            return res.status(404).send()
        }

        const wasCompletedBefore = task.completed
        const completionTime = task.completedAt && task.createdAt
            ? Math.round((task.completedAt - task.createdAt) / (1000 * 60 * 60 * 24) * 10) / 10
            : null

        updates.forEach((update)=>{
            task[update]=req.body[update]
            // Set completedAt when task is marked as completed
            if(update === 'completed' && req.body[update] === true){
                task.completedAt = new Date()
            }
            // Clear completedAt when task is marked as incomplete
            if(update === 'completed' && req.body[update] === false){
                task.completedAt = undefined
            }
        })
        await task.save()

        // Send email notification for task completion
        if(!wasCompletedBefore && task.completed){
            const newCompletionTime = task.completedAt && task.createdAt
                ? Math.round((task.completedAt - task.createdAt) / (1000 * 60 * 60 * 24) * 10) / 10
                : null
            sendTaskCompletedEmail(req.user.email, req.user.name, task.description, newCompletionTime)
        }

        res.send(task)
    }catch(e){
        res.status(500).send(e)
    }
})

router.delete('/tasks/:id', auth, async (req, res)=>{
    try{
        const task=await Task.findOneAndDelete({_id:req.params.id, owner:req.user._id})

        if(!task){
            return res.status(404).send()
        }

        res.send(task)
    }catch(e){
        res.status(500).send()
    }
})

// Analytics endpoint for activity tracking
router.get('/analytics/activity', auth, async (req, res)=>{
    try{
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        // Get all completed tasks for the user
        const allCompletedTasks = await Task.find({
            owner: req.user._id,
            completed: true,
            completedAt: { $exists: true }
        }).sort({ completedAt: -1 })

        // Calculate weekly activity (last 7 days)
        const weeklyActivity = []
        for(let i = 6; i >= 0; i--){
            const date = new Date(now)
            date.setDate(date.getDate() - i)
            const startOfDay = new Date(date.setHours(0, 0, 0, 0))
            const endOfDay = new Date(date.setHours(23, 59, 59, 999))

            const tasksCompleted = allCompletedTasks.filter(task =>
                task.completedAt >= startOfDay && task.completedAt <= endOfDay
            ).length

            weeklyActivity.push({
                date: startOfDay.toISOString().split('T')[0],
                tasksCompleted
            })
        }

        // Calculate monthly activity (last 30 days)
        const monthlyActivity = []
        for(let i = 29; i >= 0; i--){
            const date = new Date(now)
            date.setDate(date.getDate() - i)
            const startOfDay = new Date(date.setHours(0, 0, 0, 0))
            const endOfDay = new Date(date.setHours(23, 59, 59, 999))

            const tasksCompleted = allCompletedTasks.filter(task =>
                task.completedAt >= startOfDay && task.completedAt <= endOfDay
            ).length

            monthlyActivity.push({
                date: startOfDay.toISOString().split('T')[0],
                tasksCompleted
            })
        }

        // Calculate current streak
        let currentStreak = 0
        const today = new Date(now.setHours(0, 0, 0, 0))

        for(let i = 0; i < 365; i++){ // Check up to a year back
            const checkDate = new Date(today)
            checkDate.setDate(checkDate.getDate() - i)
            const startOfDay = new Date(checkDate.setHours(0, 0, 0, 0))
            const endOfDay = new Date(checkDate.setHours(23, 59, 59, 999))

            const tasksOnDay = allCompletedTasks.filter(task =>
                task.completedAt >= startOfDay && task.completedAt <= endOfDay
            ).length

            if(tasksOnDay > 0){
                currentStreak++
            } else {
                break
            }
        }

        // Calculate longest streak
        let longestStreak = 0
        let tempStreak = 0
        const sortedTasks = allCompletedTasks.sort((a, b) => a.completedAt - b.completedAt)

        for(let i = 0; i < sortedTasks.length; i++){
            const currentDate = new Date(sortedTasks[i].completedAt)
            currentDate.setHours(0, 0, 0, 0)

            if(i === 0){
                tempStreak = 1
            } else {
                const prevDate = new Date(sortedTasks[i-1].completedAt)
                prevDate.setHours(0, 0, 0, 0)

                const diffTime = currentDate - prevDate
                const diffDays = diffTime / (1000 * 60 * 60 * 24)

                if(diffDays === 1){
                    tempStreak++
                } else if(diffDays > 1){
                    longestStreak = Math.max(longestStreak, tempStreak)
                    tempStreak = 1
                }
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak)

        // Get total stats
        const totalTasks = await Task.countDocuments({ owner: req.user._id })
        const completedTasks = allCompletedTasks.length
        const pendingTasks = totalTasks - completedTasks

        // Get all tasks for detailed analytics
        const allTasks = await Task.find({ owner: req.user._id }).sort({ createdAt: -1 })

        // Calculate task-specific analytics
        const taskAnalytics = allTasks.map(task => {
            const completionTime = task.completedAt && task.createdAt
                ? task.completedAt - task.createdAt
                : null

            return {
                id: task._id,
                description: task.description,
                completed: task.completed,
                createdAt: task.createdAt,
                completedAt: task.completedAt,
                completionTimeMs: completionTime,
                completionTimeHours: completionTime ? Math.round(completionTime / (1000 * 60 * 60) * 10) / 10 : null,
                completionTimeDays: completionTime ? Math.round(completionTime / (1000 * 60 * 60 * 24) * 10) / 10 : null,
                isOverdue: !task.completed && (new Date() - task.createdAt) > (7 * 24 * 60 * 60 * 1000) // Over a week old
            }
        })

        // Calculate average completion times
        const completedTasksWithTime = taskAnalytics.filter(task => task.completionTimeMs !== null)
        const avgCompletionTime = completedTasksWithTime.length > 0
            ? completedTasksWithTime.reduce((sum, task) => sum + (task.completionTimeMs || 0), 0) / completedTasksWithTime.length
            : null

        // Group tasks by creation week/month
        const tasksByWeek = {}
        const tasksByMonth = {}

        allTasks.forEach(task => {
            const createdDate = new Date(task.createdAt)
            const weekKey = `${createdDate.getFullYear()}-W${Math.ceil((createdDate.getDate() - createdDate.getDay() + 1) / 7)}`
            const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`

            if (!tasksByWeek[weekKey]) tasksByWeek[weekKey] = { created: 0, completed: 0 }
            if (!tasksByMonth[monthKey]) tasksByMonth[monthKey] = { created: 0, completed: 0 }

            tasksByWeek[weekKey].created++
            tasksByMonth[monthKey].created++

            if (task.completed) {
                tasksByWeek[weekKey].completed++
                tasksByMonth[monthKey].completed++
            }
        })

        // Get pending tasks by age
        const pendingTasksByAge = {
            today: 0,
            thisWeek: 0,
            thisMonth: 0,
            older: 0
        }

        const currentTime = new Date()
        allTasks.filter(task => !task.completed).forEach(task => {
            const age = currentTime - task.createdAt
            const days = age / (1000 * 60 * 60 * 24)

            if (days < 1) pendingTasksByAge.today++
            else if (days < 7) pendingTasksByAge.thisWeek++
            else if (days < 30) pendingTasksByAge.thisMonth++
            else pendingTasksByAge.older++
        })

        res.send({
            totalTasks,
            completedTasks,
            pendingTasks,
            currentStreak,
            longestStreak,
            weeklyActivity,
            monthlyActivity,
            taskAnalytics,
            avgCompletionTime,
            avgCompletionTimeHours: avgCompletionTime ? Math.round(avgCompletionTime / (1000 * 60 * 60) * 10) / 10 : null,
            avgCompletionTimeDays: avgCompletionTime ? Math.round(avgCompletionTime / (1000 * 60 * 60 * 24) * 10) / 10 : null,
            tasksByWeek,
            tasksByMonth,
            pendingTasksByAge,
            fastestCompletion: completedTasksWithTime.length > 0 ? Math.min(...completedTasksWithTime.map(t => t.completionTimeMs || 0)) : null,
            slowestCompletion: completedTasksWithTime.length > 0 ? Math.max(...completedTasksWithTime.map(t => t.completionTimeMs || 0)) : null
        })

    }catch(e){
        console.error('Analytics error:', e)
        res.status(500).send({ error: 'Failed to fetch analytics' })
    }
})

module.exports=router
