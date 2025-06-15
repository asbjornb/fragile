import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div>
    <h1>Fragile</h1>
    <p>An incremental rogue-civilization game</p>
    <div id="game-container"></div>
  </div>
`