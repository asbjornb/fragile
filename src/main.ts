import './style.css'
import { Game } from './core/game'

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div>
    <h1>Fragile</h1>
    <p>Click adjacent hexes to move your settler. Click "Settle Here" to found a city!</p>
    <div id="game-container" style="position: relative;"></div>
  </div>
`

const gameContainer = document.querySelector<HTMLDivElement>('#game-container')!
const game = new Game(gameContainer)

window.addEventListener('beforeunload', () => {
  game.destroy()
})