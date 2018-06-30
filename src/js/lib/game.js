import CONFIG from './config'
import HEXLIB from '../vendor/hexlib'
import seedrandom from 'seedrandom'

import Map from './map'
import Buildings from './buildings'
import Players from './players'
import Renderer2d from './renderer2d'
import Renderer3d from './renderer3d'

////////////////////////////////////////////////////////////////////////////////
// GAME

const Game = (ctx2d, canvas3d, dom, main) => {

  ////////////////////////////////////////
  // PUBLIC
  const game = {

    // Game map
    map: Map(CONFIG.map),

    // Players
    players: [],

    // Debounce countdown
    debounce: 0,

    // UI overlay
    ui: {
      cursor: undefined, // Hex
      cursorBackup: undefined, // Hex
      cursorPath: [], // [Hex]
      moveZone: [], // [Hex]
      attackZone: [] // [Hex]
    },

    // Current player
    currentPlayer: undefined, // Player

    // Buildings (cities, factories, ports and airports)
    buildings: [],

    // GENERATE GAME
    // Generate a new map (with or without a fresh seed) and players
    generate(randomMapSeed = false) {
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
        console.log(`Map generation (#${nTry} try)`)
        game.map.generate()

        // BULDINGS
        game.buildings = Buildings(game.map, RNG)

        // GRAPHS
        game.map.generateGraphs()

        // PLAYERS
        game.players = Players(CONFIG.players, game.map, RNG)

        if (game.buildings && game.players) {
          success = true
        }
      }

      if (success) {
        console.warn(`Game generated in ${nTry} tries`)
        console.log('MAP DATA', game.map.data)
        console.log('BULDINGS', game.buildings)

        game.renderer3d.createTiles()
        game.renderer3d.createUnits()

        game.ui.moveZone = []
        game.ui.attackZone = []
        mode = 'select'
        selectedUnit = undefined
        cameraDirection = 0

        // It's first player's turn
        changeCurrentPlayer(0)
        
      } else {
        console.error('Game generation has failed!')
      }
    },

    // RESIZE GAME
    resizeGame() {
      main.setSize()

      game.updateRenderers(['resize'])
    },

    // ON KEY CHANGE
    onKeyDown(keys) {
      // Only catch key events if the standard camera is active
      if (game.renderer3d.getActiveCamera().name === 'camera') {
        if (game.debounce === 0) {
          if (mode === 'game-menu-select' || mode === 'game-menu-move') {
                   if (keys['ArrowUp']) {     dom.moveGameMenu('up')
            } else if (keys['ArrowDown']) {   dom.moveGameMenu('down')
            } else if (keys['x']) {           dom.selectGameMenu()
            }

            if (mode === 'game-menu-select') {
              // Player can only close menu (with no item selected) during selection phase
                   if (keys['c']) {           dom.closeGameMenu()
                                              mode = 'select'
              }
            } else if (mode === 'game-menu-move') {
              // Closing the menu in move phase cancel the move
                   if (keys['c']) {           dom.closeGameMenu()
                                              // mode = 'move'
                                              cancelFinishedMove()
              }
            }

          } else {
                   if (keys['ArrowRight'] && 
                      keys['ArrowUp']) {      moveCursor('right-up')
            } else if (keys['ArrowRight'] && 
                      keys['ArrowDown']) {    moveCursor('right-down')
            } else if (keys['ArrowLeft'] && 
                      keys['ArrowUp']) {      moveCursor('left-up')
            } else if (keys['ArrowLeft'] && 
                      keys['ArrowDown']) {    moveCursor('left-down')
            } else if (keys['ArrowRight']) {  moveCursor('right')
            } else if (keys['ArrowLeft']) {   moveCursor('left')
            } else if (keys['ArrowUp']) {     moveCursor('up')
            } else if (keys['ArrowDown']) {   moveCursor('down')
              
            } else if (keys['x']) {           game.doAction()
            } else if (keys['c']) {           cancelAction()
            } else if (keys['v']) {           focusUnit('previous')
            } else if (keys['b']) {           focusUnit('next')

            } else if (keys['e']) {           game.renderer3d.updateCameraZoom('in')
            } else if (keys['r']) {           game.renderer3d.updateCameraZoom('out')
            } else if (keys['t']) {           game.renderer3d.updateCameraAlpha('counterclockwise')
                                              cameraDirection--
                                              cameraDirection = cycleValueInRange(cameraDirection, 6)
            } else if (keys['y']) {           game.renderer3d.updateCameraAlpha('clockwise')
                                              cameraDirection++
                                              cameraDirection = cycleValueInRange(cameraDirection, 6)
            }
          }
        }
      }
    },

    // RESET DEBOUNCE
    resetDebounce() {
      game.debounce = CONFIG.game.debounceKeyboardTime
    },

    // DO ACTION
    doAction(type = 'keyboard') {
      if (mode === 'select') {
        selectCell()

      } else if (mode === 'move') {
        if (type === 'keyboard') {
          // Moving cursor with keyboard force it to stay in move zone
          selectDestination()

        } else if (type === 'mouse') {
          // With mouse you can click on a cell outside the move zone
          // So we must validate the cursor position first
          if (validateMove(game.ui.cursor)) {
            selectDestination()
          } else {
            cancelMove()
          }
        }

      } else if (mode === 'attack') {
        if (type === 'keyboard') {
          // Selecting target with keyboard force to aim at a valid ennemy
          doAttack()
        } else if (type === 'mouse') {
          // Mouse aiming can click anywhere on the map
          if (validateTarget(game.ui.cursor)) {
            doAttack()
          } else {
            endUnitTurn()
          }
        }
      }
    },

    // UPDATE RENDERERS
    updateRenderers(actions) {
      if (actions) {
        for (const action of actions) {
    
          if (action === 'resize') {
            game.renderer2d.init()
            game.renderer3d.resizeEngine()
    
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
    },

    // UPDATE CURSOR
    updateCursor(hex) {
      if (hex) { // May be called with invalid cursor hex
        if (!HEXLIB.hexEqual(hex, game.ui.cursor)) {
          // Cursor has moved
          game.ui.cursor = hex // Update the new cursor
          // Update the cursor line
          if (mode === 'move') {
            game.ui.cursorPath = getCursorLine(hex, selectedUnit.hex, selectedUnit.type)
          } else {
            game.ui.cursorPath = []
          }

          game.updateRenderers(['highlights'])
        }
      }
    },

    // GAME MENU ITEMS
    gameMenuAttack() {
      // Attack phase
      selectAttack()
      dom.closeGameMenu()
    },
    gameMenuConquer() {
      conquer()
      // End the unit turn
      endUnitTurn()
      dom.closeGameMenu()
    },
    gameMenuWait() {
      // End the unit turn
      endUnitTurn()
      dom.closeGameMenu()
    },
    gameMenuBuildUnits() {
      dom.closeGameMenu()
      dom.openGameBuildMenu(selectedBuilding, game.currentPlayer.money)
    },
    gameMenuEndTurn() {
      changeCurrentPlayer()
      dom.closeGameMenu()
    },
    gameMenuBuildUnit(unitType) {
      buildUnit(unitType)
      dom.closeGameMenu()
    },
    gameMenuQuitGame() {
      // TODO
    }
  }

  // GAME RENDERERS
  game.renderer2d = Renderer2d(game, ctx2d)
  game.renderer3d = Renderer3d(game, canvas3d)

  ////////////////////////////////////////
  // PRIVATE

  // RNG seeds
  let gameSeed = CONFIG.game.seed
  const RNG = seedrandom(gameSeed)

  let mode = '', // 'passive', 'select', 'move', 'attack', 'game-menu-select', 'game-menu-move'
      selectedUnit = undefined, // Unit
      focusedUnit = undefined, // Unit
      unitsToMove = [], // [Unit]
      cameraDirection = undefined, // From 0 to 5
      selectedTargetId = undefined, // Number
      selectedBuilding = undefined // Building

  // CHANGE CURRENT PLAYER
  // TODO: broken when deleting players!
  const changeCurrentPlayer = async (playerId) => {
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

    await dom.displayBigBanner(`Player ${game.currentPlayer.name}'s turn`)

    dom.updateTopPanel(game.currentPlayer)
    earnMoney(game.currentPlayer)

    mode = 'select'
    unitsToMove = game.currentPlayer.units
    focusedUnit = unitsToMove[0] 
    focusUnit(focusedUnit)

    // Is the next player a bot?
    if (!game.currentPlayer.isHuman) {
      console.log(`Player ${game.currentPlayer.name} is a bot`)
      playBot()
    }
  } 

  // EARN MONEY
  // Compute the money income for the current player
  const earnMoney = (player) => {
    for (const building of game.buildings) {
      if (building.ownerId === player.id) {
        player.money += CONFIG.game.moneyEarnedPerBuilding
        dom.updateTopPanel(player)
      }
    }
  }

  // PLAY BOT
  // The current player is bot, auto-play it
  const playBot = async () => {
    for (const unit of game.currentPlayer.units) {
      selectedUnit = unit
      mode = 'select'
      focusUnit(unit)
      const zones = getMoveZones(unit),
            moveZone = zones.move,
            attackZone = zones.attack

      // RANDOM MOVE
      if (moveZone.length === 0) { continue }
      const target = moveZone[Math.floor(RNG() * moveZone.length)] 
      const path = game.map.findPath(
        unit.type,
        unit.hex, 
        target,
        true,
        getUnitsHexes()
      )
      path.shift() // Remove the first element (that is unit/starting cell)
      await game.renderer3d.moveUnitOnPath(selectedUnit, path)

      // ATTACK
      game.ui.attackZone = getAttackTargets(selectedUnit)
      // Does the unit can attack any ennemy?
      if (game.ui.attackZone.length !== 0) {
        selectedTargetId = Math.floor(RNG() * game.ui.attackZone.length)
        await doAttack()
      }
  
      // End of turn
      // endUnitTurn()
      selectedUnit.hasPlayed = true
      game.renderer3d.changeUnitMaterial(selectedUnit, 'colorDesaturated') // WTF?
    }
    changeCurrentPlayer()
  }

  // GET UNITS HEXES
  // Return an array of all/friends/ennemies units hexes
  const getUnitsHexes = (group) => {
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
  const focusUnit = (param = 'next') => {
    // Prevents focusing during move or passive mode
    if (mode !== 'select') {
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
      if (focusedUnit !== undefined) {
        focusedUnitId = focusedUnit.id
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
      focusedUnit = game.currentPlayer.units[focusedUnitId]

    } else {
      // We passed a unit as param
      if (param.hasPlayed) {
        return
      } else {
        focusedUnit = param
      }
    }
    // Actually give focus to the unit
    const hex = focusedUnit.hex
    game.ui.cursor = hex
    game.ui.cursorBackup = hex
    game.updateRenderers(['highlights'])
    game.renderer3d.updateCameraPosition(hex)
    console.log(`Focus on unit ${focusedUnit.name}`)
  }

  // SELECT UNIT
  const selectCell = () => {
    let isSomethingSelected = false
    const actions = ['EndTurn', 'QuitGame']

    // Check if a unit is selected
    for (const player of game.players) {
      for (const unit of player.units) {
        if (HEXLIB.hexEqual(game.ui.cursor, unit.hex)) {
          // The player has selected a unit
          isSomethingSelected = true

          if (player === game.currentPlayer) {
            // The player selected one of its own units
            selectPlayerUnit(unit)

          } else {
            // The player selected one of another player's unit
            // TODO: info mode (ala Fire Emblem)
            // Show ennemy attack range
            console.log(`TODO: display infos about ${player.name}'s ${unit.name}`)
          }
        }
      }
    }

    // Check if a building is selected
    if (!isSomethingSelected) { 
      const cell = game.map.getCellFromHex(game.ui.cursor)
      if (cell.building) {
        const building = cell.building
        // Does the building belongs to the active player?
        if (building.ownerId === game.currentPlayer.id) {
          // Is the building a factory, a port or an airport?
          if (building.canBuild) {
            // Is the building free to build a unit?
            if (!building.hasBuilt) {
              selectedBuilding = building
              actions.unshift('BuildUnits')
            } else {
              // TODO: infos on the unit that will be built
            }
          } else {
            // TODO: infos on player city/base
          }
        } else {
          // TODO: infos on ennemy's building
        }
      }
    }

    // Empty selection
    if (!isSomethingSelected) {
      // Open the game menu (ala Fire Emblem!)
      mode = 'game-menu-select'
      dom.openGameMenu(actions)
    }
  }

  // SELECT UNIT
  const selectPlayerUnit = (unit) => {
    if (unit.hasPlayed) {
      console.log(`Unit ${unit.name} has already played!`)
      return
    }

    console.log(`Unit selected: ${unit.name}`)
    // The unit can move
    mode = 'move'
    selectedUnit = unit
    // Backup cursor in case of cancel
    game.ui.cursorBackup = game.ui.cursor
    
    // Highlight the whole movement zone
    const zones = getMoveZones(unit)
    game.ui.moveZone = zones.move
    game.ui.attackZone = zones.attack
    if (game.ui.moveZone.length === 0) {
      console.log('Nowhere to go, the unit is blocked!')
    }
    game.updateRenderers(['highlights'])
  }

  // SELECT DESTINATION
  // Then open the move menu
  const selectDestination = async function() {
    const path = game.ui.cursorPath // Use the cursor path as movement path
    
    // Avoid the user to move cursor or do other actions during movement
    mode = 'passive'
    // Reset the UI
    game.ui.moveZone = []
    game.ui.attackZone = []
    game.ui.cursorPath = []
    game.updateRenderers(['highlights'])

    // Make the unit travel the path
    path.shift() // Remove the first element (that is unit/starting cell)

    await game.renderer3d.moveUnitOnPath(selectedUnit, path)
    console.log(`Unit moved: ${selectedUnit.name}`)

    mode = 'game-menu-move'
    const actions = ['Wait']
    if (canUnitAttack()) {
      actions.unshift('Attack')
    }
    if (canUnitConquer()) {
      actions.unshift('Conquer')
    }
    dom.openGameMenu(actions)
  }

  // CAN UNIT ATTACK
  const canUnitAttack = () => {
    game.ui.attackZone = getAttackTargets(selectedUnit)
    // Does the unit can attack any ennemy?
    return game.ui.attackZone.length > 0
  }

  // SELECT ATTACK
  const selectAttack = () => {
    mode = 'attack'
    // Target the first ennemy
    selectedTargetId = 0
    
    // Move the cursor
    game.updateCursor(game.ui.attackZone[0])
    game.renderer3d.updateCameraPosition(game.ui.attackZone[0])
    game.updateRenderers(['highlights'])
  }

  // DO ATTACK
  // TODO: split this into sub functions!
  const doAttack = async () => {
    // Get the ennemy
    const targetHex = game.ui.attackZone[selectedTargetId]
    for (const ennemy of game.players) {
      if (ennemy !== game.currentPlayer) {
        // Loop on all ennemies
        for (const ennemyUnit of ennemy.units) {
          if (HEXLIB.hexEqual(ennemyUnit.hex, targetHex)) {

            const player = game.currentPlayer,
                  playerUnit = selectedUnit
            // Do the attack
            mode = 'passive'
            console.log(`${player.name}'s ${playerUnit.name} attacks ${ennemy.name}'s ${ennemyUnit.name}`)
            const attackAnimation = game.renderer3d.attackUnit(playerUnit, ennemyUnit)
            await attackAnimation.waitAsync()

            // Compute ennemy's damage
            const damage = playerUnit.strength - ennemyUnit.defense
            ennemyUnit.health -= damage
            if (ennemyUnit.health < 0) {
              ennemyUnit.health = 0
            }
            // Animate ennemy's health bar
            const healthbarAnimation = game.renderer3d.updateHealthbar(ennemyUnit)
            await healthbarAnimation.waitAsync()

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
              endUnitTurn()
            }
            break
          }
        }
      }
    }
  }

  // AN UNIT CONQUER
  const canUnitConquer = () => {
    const cell = game.map.getCellFromHex(selectedUnit.hex)
    return (
      cell.building && 
      cell.building.ownerId !== game.currentPlayer.id &&
      selectedUnit.canConquer
    )
  }

  // CONQUER
  // Seize a building
  const conquer = () => {
    const cell = game.map.getCellFromHex(selectedUnit.hex)
    const building = cell.building

    building.ownerId = game.currentPlayer.id
    game.renderer3d.changeBuildingColor(cell, game.currentPlayer.id)
  }

  // BUILD UNIT
  const buildUnit = (unitType) => {
    const player = game.currentPlayer,
          unit = player.addUnit(unitType, selectedBuilding.hex)

    // New born unit can't play during the first turn
    unit.hasPlayed = true
    game.updateRenderers(['players'])

    // Remove unit cost from player's money
    player.money -= unit.cost
    dom.updateTopPanel(player)

    // Go back to select mode
    mode = 'select'
  }

  // END UNIT TURN
  const endUnitTurn = () => {
    // Mark the unit as having played
    selectedUnit.hasPlayed = true
    game.renderer3d.changeUnitMaterial(selectedUnit, 'colorDesaturated')

    // Automatic end of turn (ala Fire Emblem)
    const nUnitsRemaining = game.currentPlayer.units.filter(
      (unit) => !unit.hasPlayed
    ).length

    if (nUnitsRemaining === 0) {
      // No more unit to play with
      console.log(`${game.currentPlayer.name}'s turn is over`)
      changeCurrentPlayer()

    } else {
      console.log(`Still ${nUnitsRemaining} unit(s) to play`)
      mode = 'select'
      focusUnit('next')
    }
  }

  // CANCEL MOVE
  const cancelMove = () => {
    mode = 'select'
    game.ui.cursor = game.ui.cursorBackup
    game.ui.cursorPath = []
    game.ui.moveZone = []
    game.ui.attackZone = []
    game.updateRenderers(['highlights'])
    // game.updateCursor(game.ui.cursor)
    game.renderer3d.updateCameraPosition(game.ui.cursor)
    console.log('Move has been cancelled')
  }

  // CANCEL FINISHED MOVE
  // The player cancels the unit move with the game menu
  const cancelFinishedMove = async () => {
    await game.renderer3d.teleportUnit(
      selectedUnit, 
      game.ui.cursorBackup, // We use the cursor backup as the previous unit position
      0 // TODO: backup unit orientation too!
    )
    console.log('Move has been totally cancelled')

    // Reset UI, replace cursor and camera
    game.ui.cursor = game.ui.cursorBackup
    game.ui.cursorPath = []
    game.renderer3d.updateCameraPosition(game.ui.cursor)
    selectPlayerUnit(selectedUnit)
  }

  // CANCEL ACTION
  const cancelAction = () => {
    if (mode === 'select') {
      console.log('Nothing to cancel!')
      // Nothing to do
    } else if (mode === 'move') {
      cancelMove()
    }
  }

  // GET DIRECTION INDEX
  const getDirectionIndex = (direction, hex) => {
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
    directionIndex = cycleValueInRange(directionIndex - cameraDirection, 6)

    return directionIndex
  }

  // VALIDATE MOVE
  // Check (in move move) if the hex is in the unit move zone
  const validateMove = (hex) => {
    // In move mode, cursor can only move on valid tiles (aka move zone)
    if (mode === 'move') {
      let isValidMove = false
      
      for(const validHex of game.ui.moveZone) {
        if (HEXLIB.hexEqual(hex, validHex)) {
          isValidMove = true
          break
        }
      }
      if (!isValidMove) {
        console.log('Invalid move!')
        return false
      }
    }
    // Move the cursor
    game.updateCursor(hex)
    game.renderer3d.updateCameraPosition(hex)

    return true
  }

  // VALIDATE TARGET
  // Check (in attack mode) if the hex (chosen by mouse only) is a valid target
  // In this case, also update selectedTargetId
  const validateTarget = (hex) => {
    for (const [index, targetHex] of game.ui.attackZone.entries()) {
      // Did the player click on a valid target hex?
      if (HEXLIB.hexEqual(hex, targetHex)) {
        selectedTargetId = index
        return true
      }
    }

    return false
  }

  // MOVE CURSOR
  // From keyboard arrows to a direction to an hex position
  // Select, move or attack modes
  const moveCursor = (direction) => {
    game.resetDebounce()

    if (mode === 'select' || mode === 'move') {
      // Get the direction (6 possible)
      const directionIndex = getDirectionIndex(direction, game.ui.cursor)
  
      if (directionIndex !== undefined) {
        // Get the neighbor in that direction
        const hex = HEXLIB.hexNeighbors(game.ui.cursor)[directionIndex]
        // Don't go outside the map boundaries
        if (game.map.isHexOnMap(hex)) {
          validateMove(hex)
  
        } else {
          console.log('Cannot go there, edge of the map reached!')
        }
      }
    } else if (mode === 'attack') {
      // Left and right cycle between targets
      if (direction === 'left' || direction === 'right') {
        const increment = direction === 'left' ? -1 : 1
        selectedTargetId += increment
        selectedTargetId = cycleValueInRange(selectedTargetId, game.ui.attackZone.length)

        const targetHex = game.ui.attackZone[selectedTargetId]
        game.updateCursor(targetHex)
        game.renderer3d.updateCameraPosition(targetHex)
        game.updateRenderers(['highlights'])
      }
    }
  }

  // CURSOR LINE
  const getCursorLine = (cursor, target, type) => {
    if (game.map.getCellFromHex(cursor) && game.map.getCellFromHex(cursor).isInGraph) {
      const cursorLine = game.map.findPath(
        type,
        target, 
        cursor,
        true,
        getUnitsHexes()
      )
      if (cursorLine) {
        return cursorLine
      }
    }
  }

  // GET MOVE ZONE
  // Grab all the tiles with a cost lower than the player movement value
  const getMoveZones = (unit) => {
    // TODO: 
    // * make findPath return an array of cells in that range???
    
    const moveZone = [],
          attackZone = [],
          friendsHexes = getUnitsHexes('friends')

    // MOVE ZONE
    // Scan the whole graph to compute cost of each tile
    // We call map.findPath() without the goal parameter
    // We also pass a blacklist as last parameter
    game.map.findPath(
      unit.type,
      unit.hex, 
      undefined, // no goal
      undefined, // no early exit
      getUnitsHexes(undefined), // blacklist
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
    // Add the unit position to the move zone, since it can stay at the same location
    moveZone.push(unit.hex)

    // ATTACK ZONES
    // Ugly code omg!
    for (const moveHex of moveZone) {

      game.map.findPath(
        'attack',
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
  const getAttackTargets = (unit) => {
    const attackTargets = []

    game.map.findPath(
      'attack',
      unit.hex,
      undefined, // no goal
      undefined, // no early exit
      undefined, // blacklist
      unit.attackRangeMax // cost higher limit
    )

    for (const ennemyHex of getUnitsHexes('ennemies')) {
      const ennemyCell = game.map.getCellFromHex(ennemyHex)
      // Is the nnemy in the attack range?
      if (ennemyCell.cost <= unit.attackRangeMax) {
        attackTargets.push(ennemyHex)
      }
    }
    return attackTargets
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
  
  return game
}

export default Game