const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/user')

const app=express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))

//server (emit)-> client (receive) - countUpdated
//client (emit)-> server (receive) - increment

io.on('connection', (socket) => {
    console.log("New websocket connection")

    socket.on('join',({ username, room }) => {
        const { error, user } = addUser({id:socket.id, username, room})
        if(error){
            return callback(error)
        }
        socket.join(room)
        
        socket.emit('message',generateMessage('Welcome!'))
        socket.broadcast.to(room).emit("message",generateMessage(username + " has joined!"))
        callback()
    })
    
    socket.on("sendMessage",(message,callback) => {
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed!')
        }
        io.to('Center City').emit('message',generateMessage(message))
        callback()
    })

    socket.on("disconnect",(message) => {
        io.emit('message',"A user has left!")
    })

    socket.on("sendLocation",(coords,callback) => {
        io.emit('locationMessage',generateLocationMessage('https://www.google.com/maps?q='+ coords.latitude + ',' + coords.longitude))
        callback()
    })
    
})
server.listen(port, () => {
    console.log(`Server is up on port `+port)
})