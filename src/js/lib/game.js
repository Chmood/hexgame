import HEXLIB from '../vendor/hexlib'

import Map from './map'
import Players from './players'
import Renderer2d from './renderer2d'
import Renderer3d from './renderer3d'

////////////////////////////////////////////////////////////////////////////////
// GAME

const Game = (ctx, canvas3d, CONFIG) => {
  const game = {}

  // Canvas2D - Set destination tile
  game.onUIClick = (hex) => {
    const line = game.map.findPath(game.players[0].hex, hex)
    if (line) {
      game.players[1].moveToHex(hex)
      game.ui.line = game.map.findPath(game.players[0].hex, game.players[1].hex)
    }
  }

  // GAME MAP
  game.map = Map(CONFIG.map)

  // GAME RENDERERS
  game.renderer2d = Renderer2d(game, ctx)
  game.renderer3d = Renderer3d(game, canvas3d)

  // UI OVERLAY
  game.ui = {}
  game.ui.cursor = HEXLIB.hex(-1, -1) // out of bound cursor
  game.ui.line = []
  game.ui.cursorPath = []

  // GENERATE
  game.generate = () => {
    let line = undefined
    let tryLeft = 100

    game.renderer3d.deleteTiles()

    while (!line && tryLeft >= 0) { // TODO: potential infinity loop ?!
      tryLeft--
      // PLAYERS
      game.players = Players(
        CONFIG.players,
        CONFIG.map.mapTopped,
        CONFIG.map.mapParity
        //playerZoneRatio has default value
      )
      game.map.generate()

      // Try to draw a path between the two first players
      line = game.map.findPath(game.players[0].hex, game.players[1].hex)
    }

    if (line) {
      // Update 3d terrain
      game.renderer3d.createTiles()

      game.ui.line = line
      game.renderer3d.highlightLine()
    }
  }

  return game
}

export default Game