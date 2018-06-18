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
  // game.ui.cursor = HEXLIB.hex(-1, -1) // out of bound cursor
  // game.ui.cursorBackup = game.ui.cursor
  // game.ui.cursorPath = []
  // game.ui.moveZone = []

  // UPDATE RENDERERS
  game.updateRenderers = (actions) => {
    for (const action of actions) {

      if (action === 'resize') {
        game.renderer2d.init()
        game.renderer3d.engine.resize()

      } else if (action === 'highlights') {
        game.renderer3d.updateHighlights()

      } else if (action === 'players') {
        game.renderer3d.deleteUnits()
        game.renderer3d.createUnits()
        game.renderer3d.addToOceanRenderList() // TODO: overkill? (only players needed)
      }
    }
    game.renderer2d.render() // Always refresh 2d canvas
  }

  ////////////////////////////////////////
  // GAME ACTIONS

  // ON KEY CHANGE
  game.onKeyDown = (keys) => {
    // Only catch key events if the standard camera is active
    if (game.renderer3d.scene.activeCamera === game.renderer3d.camera) {
      if (game.renderer3d.debounce === 0) {
        if        (keys['ArrowRight']) {  game.cursorMove('right')
        } else if (keys['ArrowLeft']) {   game.cursorMove('left')
        } else if (keys['ArrowUp']) {     game.cursorMove('up')
        } else if (keys['ArrowDown']) {   game.cursorMove('down')
        } else if (keys['e']) {           game.renderer3d.updateCameraZoom('in')
        } else if (keys['r']) {           game.renderer3d.updateCameraZoom('out')
        } else if (keys['t']) {           game.renderer3d.updateCameraAlpha('counterclockwise')
        } else if (keys['y']) {           game.renderer3d.updateCameraAlpha('clockwise')
        } else if (keys['x']) {           game.doAction()
        } else if (keys['c']) {           game.cancelAction()
        }
      }
    }
  }

  // GET UNITS HEXES
  game.getUnitsHexes = () => {
    const unitsHexes = []
    for (const player of game.players) {
      for (const unit of player.units) {
        unitsHexes.push(unit.hex)
      }
    }
    return unitsHexes
  }

  // SELECT UNIT
  game.selectUnit = () => {
    let isSomethingSelected = false
    for (const player of game.players) {
      for (const unit of player.units) {
        if (HEXLIB.hexEqual(game.ui.cursor, unit.hex)) {
          isSomethingSelected = true
          game.mode = 'move'
          game.selectedUnit = unit
          // Backup cursor in case of cancel
          game.ui.cursorBackup = game.ui.cursor
          // Highlight the whole movement zone
          console.log(`Unit selected: ${unit.name} `)
          
          game.ui.moveZone = game.getMoveZone(unit)
          if (game.ui.moveZone.length === 0) {
            console.log('Nowhere to go, the unit is blocked!')
            game.cancelMove()
          }

          game.updateRenderers(['highlights'])
        }
      }
    }
    if (!isSomethingSelected) {
      console.log('Nothing to select here!')
      // TODO: open game menu (ala Fire Emblem!)
    }
  }

  // SELECT DESTINATION
  game.selectDestination = () => {
    // Avoid the user to move cursor or do other actions during movement
    game.mode = 'passive'
    game.ui.moveZone = []
    const path = game.ui.cursorPath
    path.shift()
    game.ui.cursorPath = []
    game.updateRenderers(['highlights'])
    game.renderer3d.moveUnitOnPath(game.selectedUnit, path)
  }

  // DO ACTION
  game.doAction = () => {
    if (game.mode === 'select') {
      game.selectUnit()
    } else if (game.mode === 'move') {
      game.selectDestination()
    }
  }

  // CANCEL MOVE
  game.cancelMove = () => {
    game.mode = 'select'
    game.ui.cursor = game.ui.cursorBackup
    game.ui.cursorPath = []
    game.ui.moveZone = []
    game.updateRenderers(['highlights'])
    // game.updateCursor(game.ui.cursor)
    game.renderer3d.updateCameraPosition(game.ui.cursor)
    console.log('Move has been cancelled')
  }

  // CANCEL ACTION
  game.cancelAction = () => {
    if (game.mode === 'select') {
      console.log('Nothing to cancel!')
      // Nothing to do
    } else if (game.mode === 'move') {
      game.cancelMove()
    }
  }

  // GET DIRECTION INDEX
  game.getDirectionIndex = (direction, hex) => {
    const cursorOffset = HEXLIB.hex2Offset(hex, CONFIG.map.mapTopped, CONFIG.map.mapParity)
    let directionIndex

    if (CONFIG.map.mapTopped === HEXLIB.FLAT) {
      // FLAT map
      if (direction === 'up') { directionIndex = 5 }
      else if (direction === 'down') { directionIndex = 2 }
      else if (
        cursorOffset.col % 2 === 0 && CONFIG.map.mapParity === HEXLIB.ODD ||
        cursorOffset.col % 2 !== 0 && CONFIG.map.mapParity === HEXLIB.EVEN
      ) {
        if (direction === 'left') { directionIndex = 3 }
        else if (direction === 'right') { directionIndex = 1 }
      } else {
        if (direction === 'left') { directionIndex = 4 }
        else if (direction === 'right') { directionIndex = 0 }
      }
    } else {
      // POINTY map
      if (direction === 'left') { directionIndex = 4 }
      else if (direction === 'right') { directionIndex = 1 }
      else if (
        cursorOffset.row % 2 === 0 && CONFIG.map.mapParity === HEXLIB.ODD ||
        cursorOffset.row % 2 !== 0 && CONFIG.map.mapParity === HEXLIB.EVEN
      ) {
        if (direction === 'up') { directionIndex = 0 }
        else if (direction === 'down') { directionIndex = 2 }
      } else {
        if (direction === 'up') { directionIndex = 5 }
        else if (direction === 'down') { directionIndex = 3 }
      }
    }
    return directionIndex
  }

  // MOVE CURSOR
  game.cursorMove = (direction) => {
    game.renderer3d.debounce = CONFIG.render3d.debounceKeyboardTime

    if (game.mode !== 'select' && game.mode !== 'move') {
      return
    }
    const directionIndex = game.getDirectionIndex(direction, game.ui.cursor)

    if (directionIndex !== undefined) {
      const hex = HEXLIB.hexNeighbors(game.ui.cursor)[directionIndex]
      if (game.map.isHexOnMap(hex)) {
        // In move mode, cursor can only move on valid tiles (aka move zone)
        if (game.mode === 'move') {
          let isValidMove = false
          
          for(const validHex of game.ui.moveZone) {
            if (HEXLIB.hexEqual(hex, validHex)) {
              isValidMove = true
              break
            }
          }
          if (!isValidMove) {
            console.log('Invalid move!')
            return
          }
        }
        // Move the cursor
        game.updateCursor(hex)
        game.renderer3d.updateCameraPosition(hex)

      } else {
        console.log('Cannot go there, edge of the map reached!')
      }
    }
  }

  // UPDATE CURSOR
  game.updateCursor = (hex) => {
    if (hex) { // May be called with invalid cursor hex
      if (!HEXLIB.hexEqual(hex, game.ui.cursor)) {
        // Cursor has moved
        game.ui.cursor = hex // Update the new cursor
        // Update the cursor line
        if (game.mode === 'move') {
          game.ui.cursorPath = game.getCursorLine(hex, game.selectedUnit.hex, game.selectedUnit)
        } else {
          game.ui.cursorPath = []
        }

        game.updateRenderers(['highlights'])
      }
    }
  }

  // CURSOR LINE
  game.getCursorLine = (cursor, target, unit) => {
    if (game.map.getCellFromHex(cursor) && game.map.getCellFromHex(cursor).isInGraph) {
      const cursorLine = game.map.findPath(
        target, 
        cursor,
        true,
        game.getUnitsHexes()
      )
      if (cursorLine) {
        return cursorLine
      }
    }
  }

  // GET MOVE ZONE
  // Grab all the tiles with a cost lower than the player movement value
  game.getMoveZone = (unit) => {
    // TODO: 
    // * add a movement parameter / Dijkstra mode
    // * make findPath return an array of cells in that range
    
    // Scan the whole graph to compute cost of each tile
    // We call map.findPath() without the goal parameter
    game.map.findPath(
      unit.hex, 
      undefined, // no goal
      undefined, // no early exit
      game.getUnitsHexes() // blacklist
    )
    game.renderer2d.render() // Draw numbers on 2D map

    const moveZone = []
    for (let y = 0; y < CONFIG.map.mapSize.height; y++) {
      for (let x = 0; x < CONFIG.map.mapSize.width; x++) {
        const tile = game.map.data[x][y]
        if (tile.cost <= unit.movement) {
          moveZone.push(tile.hex)
        }
      }
    }
    return moveZone
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

    let line,
        success = false,
        nTry = 0,
        nTryLeft = 100

    game.renderer3d.deleteTiles()
    game.renderer3d.deleteUnits()

    while (!success && nTryLeft >= 0) {
      nTryLeft--
      nTry++

      // MAP
      game.map.generate()
      // PLAYERS
      game.players = Players(CONFIG.players, game.map)

      success = true
      // Try to draw a path between the two first players
      // line = game.map.findPath(game.players[0].hex, game.players[1].hex)
    }

    if (success) {
      console.log('MAP DATA', game.map.data)
      // game.ui.line = line
      game.renderer3d.createTiles()
      game.renderer3d.createUnits()

      const startingHex = game.players[0].units[0].hex // Place the cursor on first player's first unit
      game.ui.cursor = startingHex
      game.ui.cursorBackup = startingHex
      game.renderer3d.updateCameraPosition(startingHex)

      game.ui.moveZone = []

      game.currentPlayerId = 0
      game.mode = 'select'
      game.selectedUnit = undefined

      game.updateRenderers(['players', 'highlights'])
      console.log(`Game generated in ${nTry} tries`)
      
    } else {
      console.error('Game generation has failed!')
    }
  }

  return game
}

export default Game