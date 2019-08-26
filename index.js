require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person.js')


const PORT = process.env.PORT


app.use(cors())
app.use(bodyParser.json())
morgan.token('body', (req, res) => {
    return JSON.stringify(req.body)
})
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))
app.use(express.static('build'))



app.get('/', (req, res) => {
    res.send('<h1>Hello world!</h1>')
})

app.get('/info', (req, res) => {
    Person.collection.estimatedDocumentCount().then((count) => {
        const date = new Date()
        res.send(`<p>Phonebook has info for ${count} people</p>
    <p>${date}</p>`)
    })
})

app.get('/api/persons', (req, res) => {
    Person.find({}).then(result => {
        res.json(result)
    })
})

app.get('/api/persons/:id', (req, res, next) => {
    Person.findById(req.params.id)
    .then(result => {
        if(result){
            res.json(result.toJSON())
        }else{
            res.status(404).end()
        }
    })
    .catch(error => {
        next(error)
    })
})


/* const generateId = () => {
    const id = Math.floor(Math.random() * 1000000)
    console.log(`Generated id: ${id}`)
    return id
}
 */

app.post('/api/persons', (req, res, next) => {
    const body = req.body

    if(!body.name){
        return res.status(400).json({error: 'Name missing'})
    }
    if(!body.number){
        return res.status(400).json({error: 'Number missing'})
    }

    const person = new Person ({
        name: body.name,
        number: body.number
    })

    person.save()
    .then(result => {
        res.json(result.toJSON())
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (req, res, next) => {
    const body = req.body
    const person ={
        number: body.number
    }

    Person.findByIdAndUpdate(req.params.id, person, {new: true, runValidators:true, context:'query'})
    .then(updatedPerson => {
        res.json(updatedPerson.toJSON())
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (req, res, next) => {
    Person.findByIdAndDelete(req.params.id)
    .then(result => {
        res.status(204).end()
    })
    .catch(error => next(error))
})


const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

  
const errorHandler = (error, request, response, next) => {
    console.error(error.message)
  
    if (error.name === 'CastError' && error.kind == 'ObjectId') {
      return response.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
      return response.status(400).json({ error: error.message })
    }
  
    next(error)
  }

  app.use(errorHandler)


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})