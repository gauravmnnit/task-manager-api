const express=require('express')
require('./db/mongoose')
const userRouter=require('./routers/user')
const taskRouter=require('./routers/task')

const app=express()
const port = process.env.PORT || 3000

const cors = require("cors");

app.use(
  cors({
    origin: "https://task-manager-api-hckt-7ywfivxy4-gaurav-s-projects19.vercel.app",
    credentials: true,
  })
);

app.use(express.json())
// Simple CORS middleware to allow frontend dev server to talk to backend
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    if (req.method === 'OPTIONS') return res.send()
    next()
})
app.use(userRouter)
app.use(taskRouter)

// Root route for quick sanity check
app.get('/', (req, res) => {
    res.send('Welcome to Task Manager API')
})

app.listen(port, ()=>{
    console.log("Server is up on port "+port)
})


