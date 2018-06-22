import HEXLIB from '../vendor/hexlib'
import seedrandom from 'seedrandom'

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

  // UI OVERLAY
  game.ui = {}

  // GAME RENDERERS
  game.renderer2d = Renderer2d(game, ctx)
  game.renderer3d = Renderer3d(game, canvas3d)

  // RNG seeds
  let gameSeed = CONFIG.game.seed
  const RNG = seedrandom(gameSeed)

  // UPDATE RENDERERS
  game.updateRenderers = (actions) => {
    if (actions) {
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
    }
    game.renderer2d.render() // Always refresh 2d canvas
  }

  // HELPER FUNCTIONS
  const clampValueInRange = (value, max, min = 0) => {
    if (value < min) { return min }
    if (value >= max) { return max }
    return value
  }
  const cycleValueInRange = (value, max, min = 0) => {
    if (value < min) { return value + (max - min) }
    if (value >= max) { return value - (max - min) }
    return value
  }

  ////////////////////////////////////////
  // GAME ACTIONS

  // ON KEY CHANGE
  game.onKeyDown = (keys) => {
    // Only catch key events if the standard camera is active
    if (game.renderer3d.activeCamera === 'camera') {
      if (game.renderer3d.debounce === 0) {
               if (keys['ArrowRight'] && 
                   keys['ArrowUp']) {     game.cursorMove('right-up')
        } else if (keys['ArrowRight'] && 
                   keys['ArrowDown']) {   game.cursorMove('right-down')
        } else if (keys['ArrowLeft'] && 
                   keys['ArrowUp']) {     game.cursorMove('left-up')
        } else if (keys['ArrowLeft'] && 
                   keys['ArrowDown']) {   game.cursorMove('left-down')
        } else if (keys['ArrowRight']) {  game.cursorMove('right')
        } else if (keys['ArrowLeft']) {   game.cursorMove('left')
        } else if (keys['ArrowUp']) {     game.cursorMove('up')
        } else if (keys['ArrowDown']) {   game.cursorMove('down')
          
        } else if (keys['x']) {           game.doAction()
        } else if (keys['c']) {           game.cancelAction()
        } else if (keys['v']) {           game.focusUnit('previous')
        } else if (keys['b']) {           game.focusUnit('next')

        } else if (keys['e']) {           game.renderer3d.updateCameraZoom('in')
        } else if (keys['r']) {           game.renderer3d.updateCameraZoom('out')
        } else if (keys['t']) {           game.renderer3d.updateCameraAlpha('counterclockwise')
                                          game.cameraDirection--
                                          game.cameraDirection = cycleValueInRange(game.cameraDirection, 6)
        } else if (keys['y']) {           game.renderer3d.updateCameraAlpha('clockwise')
                                          game.cameraDirection++
                                          game.cameraDirection = cycleValueInRange(game.cameraDirection, 6)
        }
      }
    }
  }

  // CHANGE CURRENT PLAYER
  game.changeCurrentPlayer = (playerId) => {
    if (game.currentPlayer === undefined) {
      // First call
      game.currentPlayer = game.players[0]

    } else if (playerId !== undefined) {
      game.currentPlayer = game.players[playerId]

    } else {
      // Clean up last player
      console.log(`Last player was ${game.currentPlayer.name}`)
      for (const unit of game.currentPlayer.units) {
        unit.hasPlayed = false
        game.renderer3d.changeUnitMaterial(unit, 'color')
      }
      // Set the next player
      let playerId = game.currentPlayer.id
      playerId++
      playerId = cycleValueInRange(playerId, game.players.length)
      game.currentPlayer = game.players[playerId]
      console.log(`It's player ${game.currentPlayer.name}'s turn`)
    }

    game.unitsToMove = game.currentPlayer.units
    game.focusedUnit = game.unitsToMove[0] 
    game.focusUnit(game.focusedUnit)
    game.mode = 'select'

    // Is the next player a bot?
    if (!game.currentPlayer.isHuman) {
      console.log(`Player ${game.currentPlayer.name} is a bot`)
      game.playBot()
    }
  } 

  // PLAY BOT
  game.playBot = async () => {
    for (const unit of game.currentPlayer.units) {
      game.selectedUnit = unit
      game.mode = 'select'
      game.focusUnit(unit)
      const zones = game.getMoveZones(unit),
            moveZone = zones.move,
            attackZone = zones.attack

      // RANDOM MOVE
      if (moveZone.length === 0) { continue }
      const target = moveZone[Math.floor(RNG() * moveZone.length)] 
      const path = game.map.findPath(
        unit.hex, 
        target,
        true,
        game.getUnitsHexes()
      )
      path.shift() // Remove the first element (that is unit/starting cell)
      await game.renderer3d.moveUnitOnPath(game.selectedUnit, path)

      // ATTACK
      game.ui.attackZone = game.getAttackTargets(game.selectedUnit)
      // Does the unit can attack any ennemy?
      if (game.ui.attackZone.length !== 0) {
        game.selectedTargetId = Math.floor(RNG() * game.ui.attackZone.length)
        await game.doAttack()
      }
  
      // End of turn
      // game.endUnitTurn()
      game.selectedUnit.hasPlayed = true
      game.renderer3d.changeUnitMaterial(game.selectedUnit, 'colorDesaturated') // WTF?
    }
    game.changeCurrentPlayer()
  }

  // GET UNITS HEXES
  // Return an array of all/friends/ennemies units hexes
  game.getUnitsHexes = (group) => {
    const unitsHexes = []
    if (!group || group === 'ennemies') {
      for (const player of game.players) {
        if (group === 'ennemies') {
          if (player === game.currentPlayer) {
            continue
          }
        }
        for (const unit of player.units) {
          unitsHexes.push(unit.hex)
        }
      }
    } else if (group === 'friends') {
      for (const unit of game.currentPlayer.units) {
        unitsHexes.push(unit.hex)
      }
  }
    return unitsHexes
  }
  
  // FOCUS UNIT
  // Give focus (camera and cursor) either to the given unit, or next or previous
  game.focusUnit = (param = 'next') => {
    // Prevents focusing during move or passive mode
    if (game.mode !== 'select') {
      console.log(`Focus can only be used in "select" mode!`)
      return
    }
    // Compute the unit to be focused
    if (typeof param === 'string') {
      // Get the list of movable units' ids
      const unitsRemainingIds = []
      for (const unit of game.currentPlayer.units) {
        if (!unit.hasPlayed) {
          unitsRemainingIds.push(unit.id)
        }
      }
      // Abort if no available unit
      if (unitsRemainingIds.length === 0) {
        return
      }

      let focusedUnitId = 0
      
      // Get the current focused unit id, or take the first unit id
      if (game.focusedUnit !== undefined) {
        focusedUnitId = game.focusedUnit.id
      }

      // Find the next/previous unit that still can play
      const idIncrement = param === 'previous' ? -1 : 1
      let found = false
      while (!found) {
        focusedUnitId += idIncrement
        focusedUnitId = cycleValueInRange(focusedUnitId, game.currentPlayer.units.length)
        if (!game.currentPlayer.units[focusedUnitId].hasPlayed) {
          found = true
        }
      }
      game.focusedUnit = game.currentPlayer.units[focusedUnitId]

    } else {
      // We passed a unit as param
      if (param.hasPlayed) {
        return
      } else {
        game.focusedUnit = param
      }
    }
    // Actually give focus to the unit
    const hex = game.focusedUnit.hex
    game.ui.cursor = hex
    game.ui.cursorBackup = hex
    game.updateRenderers(['highlights'])
    game.renderer3d.updateCameraPosition(hex)
    console.log(`Focus on unit ${game.focusedUnit.name}`)
  }

  // SELECT UNIT
  game.selectUnit = () => {
    let isSomethingSelected = false
    for (const player of game.players) {
      for (const unit of player.units) {
        if (HEXLIB.hexEqual(game.ui.cursor, unit.hex)) {
          // The player has selected a unit
          isSomethingSelected = true

          if (player === game.currentPlayer) {
            // The player selected one of its own units
            if (unit.hasPlayed) {
              console.log(`Unit ${unit.name} has already played!`)
              return
            }
            // The unit can move
            game.mode = 'move'
            game.selectedUnit = unit
            // Backup cursor in case of cancel
            game.ui.cursorBackup = game.ui.cursor
            // Highlight the whole movement zone
            console.log(`Unit selected: ${unit.name} `)
            
            const zones = game.getMoveZones(unit)
            game.ui.moveZone = zones.move
            game.ui.attackZone = zones.attack
            if (game.ui.moveZone.length === 0) {
              console.log('Nowhere to go, the unit is blocked!')
              game.cancelMove()
              // TODO: allow the unit to validate move "in place"
            }
            game.updateRenderers(['highlights'])

          } else {
            // The player selected one of another player's unit
            // TODO: info mode (ala Fire Emblem)
            console.log(`TODO: display infos about ${player.name}'s ${unit.name}`)
          }
        }
      }
    }
    // Empty selection
    if (!isSomethingSelected) {
      console.log('Nothing to select here!')
      // TODO: open game menu (ala Fire Emblem!)
    }
  }

  // SELECT DESTINATION
  game.selectDestination = async function() {
    // Avoid the user to move cursor or do other actions during movement
    const path = game.ui.cursorPath // Use the cursor path as movement path

    // Reset the UI
    game.mode = 'passive'
    game.ui.moveZone = []
    game.ui.attackZone = []
    game.ui.cursorPath = []
    game.updateRenderers(['highlights'])
    
    // Make the unit travel the path
    path.shift() // Remove the first element (that is unit/starting cell)

    await game.renderer3d.moveUnitOnPath(game.selectedUnit, path)
    console.log(`Unit moved: ${game.selectedUnit.name}`)

    // Attack phase
    game.selectAttack()
  }

  game.selectAttack = () => {
    game.ui.attackZone = game.getAttackTargets(game.selectedUnit)
    // Does the unit can attack any ennemy?
    if (game.ui.attackZone.length === 0) {
      game.endUnitTurn()
      return
    }

    game.mode = 'attack'
    // Target the first ennemy
    game.selectedTargetId = 0
    
    // Move the cursor
    game.updateCursor(game.ui.attackZone[0])
    game.renderer3d.updateCameraPosition(game.ui.attackZone[0])
    game.updateRenderers(['highlights'])
  }

  // DO ATTACK
  game.doAttack = async () => {
    // Get the ennemy
    const targetHex = game.ui.attackZone[game.selectedTargetId]
    for (const ennemy of game.players) {
      if (ennemy !== game.currentPlayer) {
        // Loop on all ennemies
        for (const ennemyUnit of ennemy.units) {
          if (HEXLIB.hexEqual(ennemyUnit.hex, targetHex)) {

            const player = game.currentPlayer,
                  playerUnit = game.selectedUnit
            // Do the attack
            game.mode = 'passive'
            console.log(`${player.name}'s ${playerUnit.name} attacks ${ennemy.name}'s ${ennemyUnit.name}`)
            const attackAnimation = game.renderer3d.attackUnit(playerUnit, ennemyUnit)
            await attackAnimation.waitAsync()

            // Compute damage
            const damage = playerUnit.strength - ennemyUnit.defense
            ennemyUnit.health -= damage
            game.renderer3d.updateHealthbar(ennemyUnit)

            // Is the ennemy dead?
            if (ennemyUnit.health > 0) {
              console.log(`${damage} damage done to ${ennemyUnit.name}, ${ennemyUnit.health} HP left`)
            } else {
              // Destroy ennemy
              console.warn(`${damage} damage done to ${ennemyUnit.name}, unit destroyed!`)

              const destroyAnimation = game.renderer3d.destroyUnit(ennemyUnit)
              await destroyAnimation.waitAsync()

              game.renderer3d.deleteUnit(ennemyUnit) // TODO: move to renderer3d???
              const ennemyUnitId = ennemy.units.indexOf(ennemyUnit)
              ennemy.units.splice(ennemyUnitId, 1)

              let outstring = ''
              for (const p of game.players) {
                outstring += `${p.name}: ${p.units.length} | `
              }
              console.warn(outstring)

              // Does the ennemy has unit left?
              if (ennemy.units.length === 0) {
                console.warn(`${ennemy.name} has lost, no more unit left!!!`)

                // Remove the ennemy player
                const ennemyId = game.players.indexOf(ennemy)
                game.players.splice(ennemyId, 1)

                // Do we have a winner?
                if (game.players.length === 1) {
                  // END GAME
                  console.log(`Player ${game.players[0]} has won the game!!!`)
                }
              }
            }

            game.ui.attackZone = []
            if (player.isHuman) {
              game.endUnitTurn()
            }
            break
          }
        }
      }
    }
  }

  // END UNIT TURN
  game.endUnitTurn = () => {
    // Mark the unit as having played
    game.selectedUnit.hasPlayed = true
    game.renderer3d.changeUnitMaterial(game.selectedUnit, 'colorDesaturated')

    // Automatic end of turn (ala Fire Emblem)
    const nUnitsRemaining = game.currentPlayer.units.filter(
      (unit) => !unit.hasPlayed
    ).length

    if (nUnitsRemaining === 0) {
      // No more unit to play with
      console.log(`${game.currentPlayer.name}'s turn is over`)
      game.changeCurrentPlayer()

    } else {
      console.log(`Still ${nUnitsRemaining} unit(s) to play`)
      game.mode = 'select'
      game.focusUnit('next')
    }
  }

  // DO ACTION
  game.doAction = () => {
    if (game.mode === 'select') {
      game.selectUnit()
    } else if (game.mode === 'move') {
      game.selectDestination()
    } else if (game.mode === 'attack') {
      game.doAttack()
    }
  }

  // CANCEL MOVE
  game.cancelMove = () => {
    game.mode = 'select'
    game.ui.cursor = game.ui.cursorBackup
    game.ui.cursorPath = []
    game.ui.moveZone = []
    game.ui.attackZone = []
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

    // DIRECTIONS:
    //  FLAT         POINTY
    //
    //    5           5  0
    // 4     0      4      1
    // 3     1        3  2
    //    2

    if (CONFIG.map.mapTopped === HEXLIB.FLAT) {
      // FLAT map
      if (direction === 'up') { directionIndex = 5 }
      else if (direction === 'down') { directionIndex = 2 }
      else if (direction === 'left-up') { directionIndex = 4 }
      else if (direction === 'left-down') { directionIndex = 3 }
      else if (direction === 'right-up') { directionIndex = 0 }
      else if (direction === 'right-down') { directionIndex = 1 }
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
      else if (direction === 'left-up') { directionIndex = 5 }
      else if (direction === 'left-down') { directionIndex = 3 }
      else if (direction === 'right-up') { directionIndex = 0 }
      else if (direction === 'right-down') { directionIndex = 1 }
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
    // Take camera orientation into account
    directionIndex = cycleValueInRange(directionIndex - game.cameraDirection, 6)

    return directionIndex
  }

  // MOVE CURSOR
  // Select, move or attack modes
  game.cursorMove = (direction) => {
    game.renderer3d.debounce = CONFIG.render3d.debounceKeyboardTime

    if (game.mode === 'select' || game.mode === 'move') {
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
    } else if (game.mode === 'attack') {
      // Left and right cycle between targets
      if (direction === 'left' || direction === 'right') {
        const increment = direction === 'left' ? -1 : 1
        game.selectedTargetId += increment
        game.selectedTargetId = cycleValueInRange(game.selectedTargetId, game.ui.attackZone.length)

        game.updateCursor(game.ui.attackZone[game.selectedTargetId])
        game.renderer3d.updateCameraPosition(game.ui.attackZone[game.selectedTargetId])
        game.updateRenderers(['highlights'])
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
  game.getCursorLine = (cursor, target) => {
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
  game.getMoveZones = (unit) => {
    // TODO: 
    // * make findPath return an array of cells in that range???
    // * use a second graph for attacking, with uniform move costs of 1???
    
    const moveZone = [],
          attackZone = [],
          friendsHexes = game.getUnitsHexes('friends')

    // MOVE ZONE
    // Scan the whole graph to compute cost of each tile
    // We call map.findPath() without the goal parameter
    // We also pass a blacklist as last parameter
    game.map.findPath(
      unit.hex, 
      undefined, // no goal
      undefined, // no early exit
      game.getUnitsHexes(), // blacklist
      unit.movement // cost higher limit
    )  
    game.updateRenderers() // Draw numbers on 2D map

    for (let y = 0; y < CONFIG.map.mapSize.height; y++) {
      for (let x = 0; x < CONFIG.map.mapSize.width; x++) {
        const cell = game.map.data[x][y]

        if (cell.cost <= unit.movement) {
          moveZone.push(cell.hex)
        }
      }
    }
    // ATTACK ZONES
    // Ugly code omg!
    for (const moveHex of moveZone) {

      game.map.findPath(
        moveHex,
        undefined, // no goal
        undefined, // no early exit
        undefined, // blacklist
        unit.attackRangeMax // cost higher limit
      )
  
      for (let y = 0; y < CONFIG.map.mapSize.height; y++) {
        for (let x = 0; x < CONFIG.map.mapSize.width; x++) {
          const cell = game.map.data[x][y]
  
          // Is the cell in the attack range?
          if (cell.cost <= unit.attackRangeMax) {
            // Unit can't attack its own friends
            if (HEXLIB.hexIndexOf(friendsHexes, cell.hex) === -1) {
              attackZone.push(cell.hex)
            }
          }
        }
      }
    }

    return {
      move: moveZone,
      attack: attackZone
    }
  }

  // GET ATTACK TARGETS
  game.getAttackTargets = (unit) => {
    const attackTargets = []

    game.map.findPath(
      unit.hex,
      undefined, // no goal
      undefined, // no early exit
      undefined, // blacklist
      unit.attackRangeMax // cost higher limit
    )

    for (const ennemyHex of game.getUnitsHexes('ennemies')) {
      const ennemyCell = game.map.getCellFromHex(ennemyHex)
      // Is the nnemy in the attack range?
      if (ennemyCell.cost <= unit.attackRangeMax) {
        attackTargets.push(ennemyHex)
      }
    }
    return attackTargets
  }

  // RESIZE GAME
  game.resizeGame = () => {
    main.setSize()

    game.updateRenderers(['resize'])
  }

  ////////////////////////////////////////
  // GENERATE GAME

  // Generate a new map (with or without a fresh seed) and players
  game.generate = (randomMapSeed = false) => {
    if (randomMapSeed) {
      game.map.randomizeSeed()
    } else {
      game.map.setSeed(CONFIG.map.seed)
    }

    let success = false,
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
      game.players = Players(CONFIG.players, game.map, RNG)

      success = true
    }

    if (success) {
      console.log(`Game generated in ${nTry} tries`)
      console.log('MAP DATA', game.map.data)

      game.renderer3d.createTiles()
      game.renderer3d.createUnits()

      game.ui.moveZone = []
      game.ui.attackZone = []
      game.mode = 'select'
      game.selectedUnit = undefined
      game.cameraDirection = 0

      // It's first player's turn
      game.changeCurrentPlayer(0)
      
    } else {
      console.error('Game generation has failed!')
    }
  }

  return game
}

export default Game