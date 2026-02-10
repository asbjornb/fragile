import './style.css'
import { Game } from './core/game'
import { SaveSystem } from './core/save'

const app = document.querySelector<HTMLDivElement>('#app')!

let game: Game | null = null

function showTitleScreen() {
  const hasSave = SaveSystem.hasSave()
  const summary = hasSave ? SaveSystem.getSaveSummary() : null

  let continueInfo = ''
  if (summary) {
    const date = new Date(summary.timestamp)
    const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const phaseStr = summary.phase === 'city'
      ? (summary.cityName || 'City')
      : 'Exploring'
    continueInfo = `<div style="font-size: 13px; color: #95a5a6; margin-top: 4px;">${phaseStr} - ${timeStr}</div>`
  }

  app.innerHTML = `
    <div id="title-screen" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #0f1419; color: white; font-family: Arial, sans-serif;">
      <h1 style="font-size: 64px; margin-bottom: 8px; color: #f39c12; text-shadow: 0 0 20px rgba(243, 156, 18, 0.3);">Fragile</h1>
      <p style="font-size: 16px; color: #7f8c8d; margin-bottom: 50px; font-style: italic;">An incremental rogue-civilization game</p>
      <div style="display: flex; flex-direction: column; gap: 16px; min-width: 240px;">
        ${hasSave ? `
          <button id="btn-continue" style="padding: 14px 32px; font-size: 18px; background: #27ae60; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: background 0.2s;">
            Continue
          </button>
          ${continueInfo}
        ` : ''}
        <button id="btn-new-game" style="padding: 14px 32px; font-size: 18px; background: ${hasSave ? '#34495e' : '#27ae60'}; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: background 0.2s;">
          New Game
        </button>
      </div>
    </div>
  `

  const newGameBtn = document.getElementById('btn-new-game')
  newGameBtn?.addEventListener('click', () => {
    if (hasSave) {
      if (!confirm('This will erase your current save. Are you sure?')) return
    }
    SaveSystem.deleteSave()
    startGame()
  })

  const continueBtn = document.getElementById('btn-continue')
  continueBtn?.addEventListener('click', () => {
    startGame(SaveSystem.load() ?? undefined)
  })
}

function startGame(saveData?: import('./core/save').SaveData) {
  app.innerHTML = `
    <div id="game-container" style="position: relative;"></div>
  `

  const gameContainer = document.querySelector<HTMLDivElement>('#game-container')!
  game = new Game(gameContainer, saveData)
}

showTitleScreen()

window.addEventListener('beforeunload', () => {
  if (game) {
    game.destroy()
  }
})
