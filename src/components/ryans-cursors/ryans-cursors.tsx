import { Component, Method, State, h } from '@stencil/core'
import io from 'socket.io-client'
import { lerp, mousePosInPage } from '../../utils'

type User = { id: string, pos: { x: number, y: number }, message: string, room: string }

@Component({
  tag: 'ryans-cursors',
  styleUrl: 'ryans-cursors.css',
  scoped: true,
})
export class RyansCursors {
  socket = io('/')

  @State() users: User[] = []
  @State() userDisplayPositions: { [id: string]: { x: number, y: number } } = {}

  @State() myMessage: string = undefined
  @State() myDisplayPosition: { x: number, y: number } = { x: undefined, y: undefined }

  componentWillLoad () {
    this.socket.on('welcome', (data: { users: { [id: string]: User } } ) => {
      Object.entries(data.users)
        .map(([id, user]) => ({ id, ...user }))
        .filter(u => u.id !== this.socket.id)
        .forEach(user => { this.userJoined(user) })

      this.trackMouse()
    })

    this.socket.on('user_joined', (data: { id: string, user: User }) => {
      console.info('user_joined', data.id)
      this.userJoined({ id: data.id, ...data.user })
    })

    this.socket.on('user_leaved', (data: { id: string }) => {
      console.info('user_leaved', data.id)
      this.userLeaved(data.id)
    })

    this.socket.on('new_message', (data: { from: string, message: string }) => {
      console.info('new_message', data.from, data.message)
      this.updateUserMessage(data.from, data.message)
    })

    this.socket.on('user_moved', (data: { id: string, pos: { x: number, y: number } }) => {
      this.updateUserPosition(data.id, data.pos)
    })

    this.animate()
  }

  @Method()
  async leaveRoom (): Promise<void> {
    this.users = []
    this.socket.emit('leaveroom')
    console.info('Leaved room')
  }

  @Method()
  async joinRoom (roomName: string): Promise<void> {
    this.users = []
    this.socket.emit('joinroom', { room: roomName })
    console.info('Joined', roomName)
  }

  trackMouse (): void {
    let oldmousePosInPage = { ...mousePosInPage }

    setInterval(() => {
      const movedX = Math.abs(mousePosInPage.x - oldmousePosInPage.x) / window.innerWidth > 0.01
      const movedY = Math.abs(mousePosInPage.y - oldmousePosInPage.y) / window.innerHeight > 0.01
      if (movedX || movedY) {
        this.socket.emit('mouse_move', { x: Math.round(100 * mousePosInPage.x / window.innerWidth), y: Math.round(100 * mousePosInPage.y / window.innerHeight) })
        oldmousePosInPage = { ...mousePosInPage }
      }
    }, 80)
  }

  @Method()
  async setMessage (message: string): Promise<void> {
    this.socket.emit('set_message', { message })
    this.myMessage = message
    console.info('New message:', message, this.myDisplayPosition)
  }

  userJoined (user: User): void {
    this.users = [...this.users, user]
    console.info('Welcome', user.id)
  }

  userLeaved (id: string): void {
    this.users = this.users.filter(u => u.id !== id)
    console.info('Bye', id)
  }

  updateUserMessage (id: string, message: string): void {
    const user = this.users.find(u => u.id === id)
    if (!user) return
    user.message = message
  }

  updateUserPosition (id: string, pos: { x: number, y: number }): void {
    const user = this.users.find(u => u.id === id)
    if (!user) return
    user.pos = pos
  }

  animate (): void {
    this.users.forEach(({ id, pos }) => {
      if (this.userDisplayPositions[id]?.x && this.userDisplayPositions[id]?.y) {
        this.userDisplayPositions = {
          ...this.userDisplayPositions,
          [id]: {
            x: lerp(this.userDisplayPositions[id].x, pos.x, 0.1),
            y: lerp(this.userDisplayPositions[id].y, pos.y, 0.1)
          }
        }
      } else if (pos.x && pos.y) this.userDisplayPositions[id] = pos
    })

    this.myDisplayPosition = {
      x: mousePosInPage.x,
      y: mousePosInPage.y,
    }

    requestAnimationFrame(this.animate.bind(this))
  }

  get displayableUsers () {
    return this.users.filter(u => this.userDisplayPositions[u.id] && this.userDisplayPositions[u.id].x && this.userDisplayPositions[u.id].y)
  }

  render() {
    return (
      <div class="cursors">
        {(this.myDisplayPosition.x && this.myDisplayPosition.y) ?
          <div class="user-cursor mine" style={{
            left: this.myDisplayPosition.x + 'px',
            top: this.myDisplayPosition.y + 'px'
          }}>
            {this.myMessage}
          </div>
        : null}

        {this.displayableUsers.map((user) =>
          <div class="user-cursor" style={{
            left: (this.userDisplayPositions[user.id].x || 0) + 'vw',
            top: (this.userDisplayPositions[user.id].y || 0) + 'vh'
          }}>
            {user.message}
          </div>
        )}
      </div>
    )
  }
}
