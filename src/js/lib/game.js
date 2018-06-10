import HEXLIB from '../vendor/hexlib'

import Map from './map'
import Players from './players'
import Renderer2d from './renderer2d'
import Renderer3d from './renderer3d'

////////////////////////////////////////////////////////////////////////////////
// GAME

const Game = (ctx, canvas3d, CONFIG, main) => {
  const game = {}

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

  // UPDATE RENDERERS
  game.updateRenderers = (actions) => {
    for (const action of actions) {

      if (action === 'resize') {
        game.renderer2d.init()
        game.renderer3d.engine.resize()

      } else if (action === 'highlights') {
        game.renderer3d.updateHighlights()

      } else if (action === 'players') {
        game.renderer3d.deletePlayers()
        game.renderer3d.createPlayers()
        game.renderer3d.addToOceanRenderList() // TODO: overkill? (only players needed)
      }
    }
    game.renderer2d.render() // Always refresh 2d canvas
  }

  ////////////////////////////////////////
  // GAME ACTIONS

  // UPDATE CURSOR
  game.updateCursor = (hex) => {
    if (hex) { // May be called with invalid cursor hex
      if (!HEXLIB.hexEqual(hex, game.ui.cursor)) {
        // Cursor has moved
        game.ui.cursor = hex // Update the new cursor
        // Update the cursor line
        game.ui.cursorPath = game.getCursorLine(hex, game.players[0].hex)

        game.updateRenderers(['highlights'])
      }
    }
  }

  // CURSOR LINE
  game.getCursorLine = (cursor, target) => {
    if (game.map.getFromHex(cursor) && game.map.getFromHex(cursor).isInGraph) {
      const cursorLine = game.map.findPath(target, cursor)
      if (cursorLine) {
        return cursorLine
      }
    }
  }

  // SET DESTINATION
  // Try to set the destination tile when clicking on a map (2d or 3d)
  game.setDestination = (hex) => {
    if (hex) { // May be called with invalid cursor hex
      const line = game.map.findPath(game.players[0].hex, hex)
      if (line) {
        // Update game
        game.players[1].moveToHex(hex)
        game.ui.line = game.map.findPath(game.players[0].hex, game.players[1].hex)

        game.updateRenderers(['players', 'highlights'])
      }
    }
  }

  // RESIZE GAME
  game.resizeGame = () => {
    main.setSize()

    game.updateRenderers(['resize'])
  }

  ////////////////////////////////////////
  // GENERATE GAME

  // Generate a new map (with or without a fresh seed) and players
  game.generate = (randomSeed = false) => {
    if (randomSeed) {
      game.map.randomizeSeed()
    }

    let line = undefined
    let tryLeft = 100

    game.renderer3d.deleteTiles()
    game.renderer3d.deletePlayers()

    while (!line && tryLeft >= 0) {
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
      game.ui.line = line
      game.renderer3d.createTiles()
      game.renderer3d.createPlayers()

      game.updateRenderers(['players', 'highlights'])
      
    } else {
      console.error('Game generation has failed!')
    }
  }

  return game
}

export default Game