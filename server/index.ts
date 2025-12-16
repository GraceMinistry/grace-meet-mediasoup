import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import cors from "cors"

const app = express()
app.use(cors())

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
})

io.on("connection", socket => {
  console.log("✅ user connected:", socket.id)

  socket.on("disconnect", () => {
    console.log("❌ user disconnected:", socket.id)
  })
})

const PORT = 4000

httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on http://localhost:${PORT}`)
})
