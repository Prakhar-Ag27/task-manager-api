const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const Task = require('../models/task.js')
const User = require('../models/user.js')

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    
    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/tasks', auth, async (req, res) => {
try{
    const match = {}
    const sort = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    await req.user.populate({
        path: 'tasks',
        match,
        options: {
           limit: parseInt(req.query.limit),
           skip: parseInt(req.query.skip), 
           sort
        }
    })

    res.send(req.user.tasks)
} catch (e) {
    res.status(500).send()
}})

router.get('/task/:id', auth, async (req, res) => {
    try{
        const task = await Task.findOne({_id : req.params.id, owner: req.user._id})
        
        if (!task) {
            return res.status(404).send()
        }
        
        res.send(task)
        
    } catch (e) {
        res.status(500).send()
    }

})

router.patch('/task/:id', async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(404).send({error: 'Invalid Updates!'})
    }

    try { 
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true})
        
        if (!task) {
            return res.status(404).send()
        }

        res.send(task)

    } catch (e) {
        res.status(500).send()
    }
})

router.delete('/task/:id', async (req, res) => {
    try{ 
        const task = await Task.findByIdAndDelete(req.params.id)

        if (!task) {
            return res.status(404).send()
        }

        res.send(task)

    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router