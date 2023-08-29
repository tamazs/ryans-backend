
export function lerp (start: number, end: number, amt: number): number {
  return (1 - amt) * start + amt * end
}

export const mousePos = { x: 0, y: 0 }
export const mousePosInPage = { x: 0, y: 0 }

window.addEventListener('mousemove', e => {
  mousePos.x = e.clientX
  mousePos.y = e.clientY

  mousePosInPage.x = mousePos.x + window.scrollX
  mousePosInPage.y = mousePos.y + window.scrollY
})

window.addEventListener('scroll', () => {
  mousePosInPage.x = mousePos.x + window.scrollX
  mousePosInPage.y = mousePos.y + window.scrollY
})
