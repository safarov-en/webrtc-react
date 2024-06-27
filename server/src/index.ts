import express from "express"
import http from 'http'
import { Server } from "socket.io"
import cors from 'cors'

const port = 8080
const app = express()
app.use(cors)
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
})

io.on("connection", () => {
    console.log('user is connected')
})

server.listen(port, () => {
    console.log(port)
})
