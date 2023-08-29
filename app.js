const http = require('http')
const path = require('path')
const express = require('express')
const SocketIO = require('socket.io')
const expressLayouts = require('express-ejs-layouts')

const app = express()
const server = http.createServer(app)
const io = new SocketIO.Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

const PORT = process.env.PORT || 8000

app.use(expressLayouts)
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname, 'public')))
app.use('/dist', express.static(path.join(__dirname, 'dist')))
app.set('view engine', 'ejs')

server.listen(PORT, () => { console.log(`\n-> Listening on http://localhost:${PORT}\n`) })

// app.get('/', function (req, res) { res.render('index', {
//   routeName: 'index',
//   pageTitle: 'Ryans Hostels | Home',
// }) })

// app.get('/about', function (req, res) { res.render('about', {
//   routeName: 'about',
//   pageTitle: 'Ryans Hostels | About',
// }) })

// app.get('/book', function (req, res) { res.render('book', {
//   routeName: 'book',
//   pageTitle: 'Ryans Hostels | Book',
// }) })

const users = {}

io.on('connection', function (socket) {
  console.log('>> Connected succesfully to the socket:', socket.id)

  if (!users[socket.id])
    users[socket.id] = { pos: { x: undefined, y: undefined }, message: undefined, room: undefined }

  socket.on('joinroom', function ({ room }) {
    if (users[socket.id].room) {
      socket.leave(users[socket.id].room)
      io.to(users[socket.id].room).emit('user_leaved', { id: socket.id })
    }

    users[socket.id].room = room
    socket.emit('welcome', { users: Object.fromEntries(Object.entries(users).filter(([_id, u]) => u.room === room)) })
    socket.join(room)
    socket.to(room).emit('user_joined', { id: socket.id, user: users[socket.id] })

    const roomUsersCount = {}
    Object.values(users)
      .forEach(u => { roomUsersCount[u.room || 'undefined'] = roomUsersCount[u.room || 'undefined'] ? roomUsersCount[u.room || 'undefined'] + 1 : 1 })

    io.emit('count', { count: roomUsersCount })

    console.log('>> Joined room', room)
  })

  socket.on('leaveroom', function () {
    if (users[socket.id].room) {
      socket.leave(users[socket.id].room)
      io.to(users[socket.id].room).emit('user_leaved', { id: socket.id })
      console.log('>> Leaved room', users[socket.id].room)
    } else {
      console.log('>> User wasn\'t in a room')
    }

    users[socket.id].room = undefined

    const roomUsersCount = {}
    Object.values(users)
      .forEach(u => { roomUsersCount[u.room || 'undefined'] = roomUsersCount[u.room || 'undefined'] ? roomUsersCount[u.room || 'undefined'] + 1 : 1 })

    io.emit('count', { count: roomUsersCount })
  })

  socket.on('set_message', function ({ message }) {
    users[socket.id].message = message
    socket.to(users[socket.id].room).emit('new_message', { from: socket.id, message })

    console.log('>> New message:', message)
  })

  socket.on('mouse_move', function ({ x, y }) {
    users[socket.id].pos = { x, y }
    socket.to(users[socket.id].room).emit('user_moved', { id: socket.id, pos: { x, y } })
  })

  socket.on('disconnect', function () {
    socket.leave(users[socket.id].room)
    io.to(users[socket.id].room).emit('user_leaved', { id: socket.id })

    users[socket.id].room = undefined

    const roomUsersCount = {}
    Object.values(users)
      .forEach(u => { roomUsersCount[u.room || 'undefined'] = roomUsersCount[u.room || 'undefined'] ? roomUsersCount[u.room || 'undefined'] + 1 : 1 })

    io.emit('count', { count: roomUsersCount })

    console.log('>> Bye bye', socket.id)
  })
})
