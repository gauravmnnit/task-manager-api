const mongoose = require('mongoose')

const taskSchema = mongoose.Schema({
    description:{
        type:String,
        required:true
    },
    completed:{
        type:Boolean,
        default:false
    },
    completedAt:{
        type:Date
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'User'
    },
    category: {
    type: String
    },

    priority: {
        type: String
    },

    subtasks: [{
        type: String
    }],
},{
    timestamps: true
})

const Task = mongoose.model('Task', taskSchema)

module.exports=Task