import barba from '@barba/core'
export { Components, JSX } from './components'

barba.init({ })

const messageInputEl = document.querySelector('#message') as HTMLInputElement
const btnEl = document.querySelector('#btn') as HTMLElement

const ryansCursors = document.querySelector('ryans-cursors')

barba.hooks.beforeLeave(() => {
  ryansCursors.leaveRoom()
})

barba.hooks.afterEnter((data) => {
  ryansCursors.joinRoom(data.next.namespace)
})

btnEl.addEventListener('click', () => { ryansCursors.setMessage(messageInputEl.value) })
