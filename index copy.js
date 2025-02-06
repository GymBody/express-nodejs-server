const PORT = 8000
// Old school (doesn't work in browsers)
//const express = require('express')

// New hotness (works in modern browsers)
import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import cors from 'cors'
import 'dotenv/config'

import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.DB_URL
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const app = express()
app.use(cors())
app.use(express.json())
app.listen(PORT, () => console.log('Server running on PORT ' + PORT))



app.get('/', async(req, res) => {
    //res.json('Node JS backend API')
 
        try {
          // Connect the client to the server	(optional starting in v4.7)
          await client.connect();
          // Send a ping to confirm a successful connection
          await client.db("admin").command({ ping: 1 });
          res.status(200).send("Pinged your deployment. You successfully connected to MongoDB!")
          console.log("Pinged your deployment. You successfully connected to MongoDB!");

        } finally {
          // Ensures that the client will close when you finish/error
          await client.close();
        }
     
})

app.post('/signup', async (req, res) => {
        const client = new MongoClient(uri) 
        const {email, password} = req.body

        const generatedUserId = uuidv4()
        const hashedPassword = await bcrypt.hash(password,10)// Number 10 is the sult
    try {
        await client.connect()
            const database = client.db('gym-data')
            const users = database.collection('users')
            const existUser = await users.findOne({email})
    

        if (existUser) {
            return res.status(409).send('User already exists. Please login')
        }

        const sanitizedEmail = email.toLowerCase()
        const data = {
            user_id: generatedUserId,
            email: sanitizedEmail,
            hashed_password: hashedPassword
        }
            const insertedUser = await users.insertOne(data)

            const token = jwt.sign(insertedUser, sanitizedEmail, {
                expiresIn: 60 * 24,
            })
            //res.status(201).json({ token, userId: generatedUserId, email: sanitizedEmail})
            res.status(201).json({ token })
    } catch (err) {
        console. log(err)
    } 
})


app.post('/login', async (req, res) => {
    const client = new MongoClient (uri)
    const { email, password } = req.body
    
    try {
        await client.connect()
        const database = client.db('app-data')
        const users = database.collection('users')
        
        const user = await users. findOne({ email })
        
        const correctPassword = await bcrypt.compare(password, user.hashed_password)
        
        if (user && correctPassword) {
            const token = jwt.sign(user, email, {
                expiresIn: 60 * 24
        })
        res.status(201).json({token, userId: user.user_id})
        }
        res.status(400).send('Invalid Credentials')
        } catch (err) {
            console. log(err)
        }
})


app.get('/users', async (req, res) => {
    const client = new MongoClient(uri) 
    try {
        await client.connect()
        const database = client.db('gym-data')
        const users = database.collection('users')//to access a colection
        
        const returnedUsers = await users.find().toArray()
        res.send(returnedUsers)
    } finally {
        await client.close()
    }
})


// Update a User in the Database
app.put('/user', async (req, res) => {
    const client = new MongoClient(uri)
    const formData = req.body.formData

    try {
        await client.connect()
        const database = client.db('gym-data')
        const users = database.collection('users')

        const query = {user_id: formData.user_id}

        const updateDocument = {
            $set: {
                first_name: formData.first_name,
                dob_day: formData.dob_day,
                dob_month: formData.dob_month,
                dob_year: formData.dob_year,
                show_gender: formData.show_gender,
                gender_identity: formData.gender_identity,
                gender_interest: formData.gender_interest,
                url: formData.url,
                about: formData.about,
                matches: formData.matches
            },
        }

        const updatetedUser = await users.updateOne(query, updateDocument)

        res.json(updatetedUser)

    } finally {
        await client.close()
    }
})
