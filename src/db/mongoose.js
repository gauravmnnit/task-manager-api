const mongoose = require('mongoose')

const mongoUrl = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/tasks-api'

;(async () => {
    try {
        await mongoose.connect(mongoUrl, {
            useNewUrlParser:true,
            useCreateIndex:true,
            useFindAndModify:false,
            useUnifiedTopology:true
        })

        console.log('Connected to MongoDB')
    } catch (err) {
        console.error('MongoDB connection error:', err && err.message ? err.message : err)
        // Do not throw — allow the app to continue running so routes can return clearer errors to clients.
    }
})()


