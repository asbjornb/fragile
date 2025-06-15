import './style.css'
import { HexRenderer } from './core/renderer'

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div>
    <h1>Fragile</h1>
    <p>An incremental rogue-civilization game</p>
    <div id="game-container"></div>
  </div>
`

const gameContainer = document.querySelector<HTMLDivElement>('#game-container')!
const renderer = new HexRenderer(gameContainer)

window.addEventListener('beforeunload', () => {
  renderer.destroy()
})