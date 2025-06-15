import './style.css'
import { Game } from './core/game'

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div>
    <h1>Fragile</h1>
    <p>Click adjacent hexes to move your settler</p>
    <div id="game-container"></div>
  </div>
`

const gameContainer = document.querySelector<HTMLDivElement>('#game-container')!
const game = new Game(gameContainer)

window.addEventListener('beforeunload', () => {
  game.destroy()
})