import CONFIG from './config'
import HEXLIB from '../vendor/hexlib'
import seedrandom from 'seedrandom'
import arrayShuffle from '../vendor/array-shuffle'

import Map from './map'
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

    // UI overlay
    ui: {
      cursor: HEXLIB.hex(1, 1), // Hex
      cursorBackup: ui.cursor, // Hex
      cursorPath: [], // [Hex]
      moveZone: [], // [Hex]
      attackZone: [] // [Hex]
    },

    // Current player
    currentPlayer: undefined, // Player

    // GENERATE GAME (step 0)
    // Generate a new map (with or without a fresh seed) and players
    async generate(randomMapSeed = false) {
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
        const generateMapSuccess = game.map.generateMap()

        // GRAPHS
        game.map.generateGraphs()

        // PLAYERS
        game.players = Players(CONFIG.players, game.map, RNG)

        if (generateMapSuccess && game.players) {
          success = true
        }
      }

      if (success) {
        console.warn(`Game generated in ${nTry} tries`)
        console.log('MAP DATA', game.map.data)
        console.log('BULDINGS', game.map.data.buildings)

  
        game.renderer3d.createTiles()
        game.renderer3d.createUnits()

        game.ui.moveZone = []
        game.ui.attackZone = []
        mode = 'select'
        selectedUnit = undefined
        cameraDirection = 0

        // It's first player's turn
        await game.CHANGE_PLAYER(0)
        
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
        if (mode === 'game-menu-select' || mode === 'game-menu-move') {
                  if (keys['ArrowUp']) {    dom.moveGameMenu('up')
          } else if (keys['ArrowDown']) {   dom.moveGameMenu('down')
          } else if (keys['x']) {           dom.selectGameMenu()
          }

          if (mode === 'game-menu-select') {
            // Player can only close menu (with no item selected) during selection phase
                  if (keys['c']) {          dom.closeGameMenu()
                                            mode = 'select'
            }
          } else if (mode === 'game-menu-move') {
            // Closing the menu in move phase cancel the move
                  if (keys['c']) {          dom.closeGameMenu()
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
    },

    // DO ACTION
    async doAction(type = 'keyboard') {
      if (mode === 'select') {
        selectCell()

      } else if (mode === 'move') {
        if (validateMove(game.ui.cursor)) {
          selectDestination()
        } else {
          cancelMove()
        }

      } else if (mode === 'attack') {
        if (validateTarget(game.ui.cursor)) {
          // Get the ennemy
          const targetHex = game.ui.attackZone[selectedTargetId],
                ennemyUnit = getEnnemyFromHex(targetHex)
          await game.ATTACK(selectedUnit, ennemyUnit)
        } else {
          endUnitTurn()
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
      dom.closeGameMenu()
      // Attack phase
      selectAttack()
    },
    gameMenuConquer() {
      dom.closeGameMenu()
      game.CONQUER(selectedUnit)
      // End the unit turn
      endUnitTurn()
    },
    gameMenuWait() {
      dom.closeGameMenu()
      // End the unit turn
      endUnitTurn()
    },
    gameMenuBuildUnits() {
      dom.closeGameMenu()
      dom.openGameBuildMenu(selectedBuilding, game.currentPlayer.money)
    },
    async gameMenuEndTurn() {
      dom.closeGameMenu()
      await game.CHANGE_PLAYER()
    },
    async gameMenuBuildUnit(unitType) {
      dom.closeGameMenu()
      await game.BUILD_UNIT(
        game.currentPlayer, 
        selectedBuilding, 
        unitType
      )
    },
    gameMenuQuitGame() {
      // TODO
    },

    // MAIN ACTIONS
    // Those mutates the game state

    // (step 1)
    CHANGE_PLAYER(playerId) {
      return new Promise(async (resolve) => {

        if (game.currentPlayer === undefined) {
          // First call
          game.currentPlayer = game.players[0]
    
        } else if (playerId !== undefined) {
          game.currentPlayer = game.players[playerId]
    
        } else {
          // Clean up last player
          console.log(`${game.currentPlayer.name}'s turn is over`)
          for (const unit of game.currentPlayer.units) {
            unit.hasPlayed = false
            unit.hasMoved = false
            unit.hasAttacked = false
            game.renderer3d.changeUnitMaterial(unit, 'color')
          }
          // Reset player buildings
          for (const building of game.map.data.buildings) {
            if (building.ownerId === game.currentPlayer.id) {
              if (
                building.type === 'factory' ||
                building.type === 'port' ||
                building.type === 'airport'
              ) {
                building.hasBuilt = false
              }
            }
          }
          // Set the next player
          let nMaxTry = game.players.length
          let playerId = game.currentPlayer.id
          playerId++
          playerId = cycleValueInRange(playerId, game.players.length)

          while (nMaxTry > 0 && !game.players[playerId].hasLost) {
            nMaxTry--
            playerId++
            playerId = cycleValueInRange(playerId, game.players.length)
          }
          game.currentPlayer = game.players[playerId]
          console.warn(`*** It's player ${game.currentPlayer.name}'s turn ***`)
        }
    
        // await dom.displayBigBanner(`Player ${game.currentPlayer.name}'s turn`)
    
        dom.updateTopPanel(game.currentPlayer)
    
        await game.EARN_MONEY(game.currentPlayer)
    
        mode = 'select'
        unitsToMove = game.currentPlayer.units
        focusedUnit = unitsToMove[0] 
        focusUnit(focusedUnit)
    
        // Is the next player a bot?
        if (!game.currentPlayer.isHuman) {
          console.log(`Player ${game.currentPlayer.name} is a bot`)
          playBot()
        }

        resolve()
      })
    },

    // (step 2)
    EARN_MONEY(player) {
      return new Promise(async (resolve) => {

        for (const building of game.map.data.buildings) {
          if (building.ownerId === player.id) {
    
            player.money += CONFIG.game.moneyEarnedPerBuilding
            dom.updateTopPanel(player)
            game.renderer3d.updateCameraPosition(building.hex)
    
            await wait()
          }
        }
        resolve()
      })
    },

    // (step 15)
    MOVE(unit, path) {
      return new Promise(async (resolve) => {
        path.shift() // Remove the first element (that is unit/starting cell)

        if (path.length > 0) {
          // Update unit's position
          const pathEnd = path[path.length - 1]
          unit.moveToHex(pathEnd, CONFIG.map.mapTopped, CONFIG.map.mapParity)

          unit.hasMoved = true

          await game.renderer3d.moveUnitOnPath(unit, path)
          console.log(`Unit moved: ${unit.name}`)
        }
        resolve()
      })
    },

    // (step 22)
    ATTACK(playerUnit, ennemyUnit) {
      return new Promise(async (resolve) => {

        const player = game.players[playerUnit.playerId]
        const ennemy = game.players[ennemyUnit.playerId]
        // Do the attack
        mode = 'passive'
        console.log(`${player.name}'s ${playerUnit.name} attacks ${ennemy.name}'s ${ennemyUnit.name}`)
        const attackAnimation = game.renderer3d.attackUnit(playerUnit, ennemyUnit)
        await attackAnimation.waitAsync()
        playerUnit.hasAttacked = true

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
          await game.DESTROY(ennemyUnit)
          console.warn(`${damage} damage done to ${ennemyUnit.name}, unit destroyed!`)
        }

        game.ui.attackZone = []

        // TODO: 'attack-n-run' units can move again here

        if (player.isHuman) {
          endUnitTurn()
        }

        resolve()
      })
    },

    DESTROY(unit) {
      return new Promise(async (resolve) => {
        const ennemy = game.players[unit.playerId]
        console.warn(`DESTROY() ennemy ${ennemy}`)
        console.warn(`DESTROY() ennemy units ${ennemy.units}`)
        
        const destroyAnimation = game.renderer3d.destroyUnit(unit)
        await destroyAnimation.waitAsync()
        game.renderer3d.deleteUnit(unit)
        
        const ennemyUnitId = ennemy.units.indexOf(unit)
        if (ennemyUnitId !== -1) {
          console.warn(`DESTROY() ennemyUnitId: ${ennemyUnitId}`)
          ennemy.units.splice(ennemyUnitId, 1)
          console.warn(`DESTROY() remaining units: ${ennemy.units.length}`)

          // Does the ennemy has unit left?
          if (ennemy.units.length === 0) {
            game.LOOSE(ennemy, 'all-units-dead')
          }
          resolve()
        }
      })  
    },

    LOOSE(player, loseType) {
      console.warn(`${player.name} has lost (${loseType})!!!`)
  
      // Make the ennemy player inactive
      // const ennemyId = game.players.indexOf(ennemy)
      // game.players.splice(ennemyId, 1)
      player.hasLost = true
      game.renderer3d.deleteUnits(player) // In case the loser still has units left
      player.units = []

      for (let building of game.map.data.buildings) {
        if (building.ownerId === player.id) {
          building.ownerId = undefined
        }
      }

      // Do we have a winner?
      let nActivePlayers = 0
          lastPlayer = undefined
      for (const player of game.players) {
        if (!player.hasLost) {
          nActivePlayers++
          lastPlayer = player
        }
      }
      if (nActivePlayers === 1) {
        // END GAME
        game.WIN(lastPlayer, 'last-man-standing')
      }
    },

    WIN(player, winType) {
      // TODO
      console.warn(`Player ${player.name} has won the game (${winType})!!!`)
    },

    CONQUER(unit) {
      const cell = game.map.getCellFromHex(unit.hex)
      const building = cell.building
  
      building.ownerId = game.currentPlayer.id
      game.renderer3d.changeBuildingColor(cell, game.currentPlayer.id)
    },

    BUILD_UNIT(player, building, unitType) {
      return new Promise(async (resolve) => {

        if (building.hasBuilt) {
          console.warn(`${building.name} has already built this turn!`)
          resolve ()
        }

        const unit = player.addUnit(unitType, building.hex)
    
        // New born unit can't play during the first turn
        unit.hasPlayed = true
        building.hasBuilt = true
        game.updateRenderers(['players'])
        game.renderer3d.updateCameraPosition(building.hex)
        const buildUnitAnimation = game.renderer3d.buildUnit(unit)
        await buildUnitAnimation.waitAsync()
    
        // Remove unit cost from player's money
        player.money -= unit.cost
        dom.updateTopPanel(player)
    
        // Go back to select mode
        mode = 'select'

        resolve()
      })
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

  const getUnitByHex = (hex) => {
    for (const player of game.players) {
      for (const unit of player.units) {
        if (HEXLIB.hexEqual(hex, unit.hex)) {
          return unit
        }
      }
    }
    return false
  }

  ////////////////////////////////////////
  // BOT AI (sort of)

  const getNearestItem = (unit, items) => {
    let nearestItem, nearestItemDistance = 100000
    let isSimpleItem = items[0].hex ? false : true

    for (const item of items) {
      const path = game.map.findPath(
        unit.type,
        unit.hex, 
        isSimpleItem ? item : item.hex,
        true,
        getUnitsHexes()
      )
      if (path && path.length < nearestItemDistance) {
        nearestItemDistance = path.length
        nearestItem = item
      }
    }

    if (nearestItem) {
      return nearestItem
    } else {
      console.error('getClosestItem() - no clothest item')
    }
  }

  const getNearestBuilding = (unit) => {
    const conquerableBuildings = game.map.data.buildings.filter(
      (building) => 
      building.ownerId === undefined || 
      building.ownerId !== unit.playerId
    )

    return getNearestItem(unit, conquerableBuildings)
  }

  const getEnnemiesInAttackZone = (unit) => {
    const ennemies = [],
          attackZone = getZones(unit).attack

    if (attackZone) {
      // console.log(`getEnnemiesInAttackZone() - attackZone length: ${attackZone.length}`)
      for (const hex of attackZone) {
        const ennemy = getUnitByHex(hex)
        if (ennemy) {
          ennemies.push(ennemy)
        }
      }
    } else {
      console.error(`getEnnemiesInAttackZone() - attackZone is empty!`)
    }

    // console.log(`getEnnemiesInAttackZone() - found ennemies: ${ennemies.length}`)
    return ennemies
  }

  const findPathToAttack = async (unit, ennemy) => {
    // Get the zone from which the ennemy can be attacked
    const moveZone = getZones(unit).move
    const ennemyWeakZone = []
    
    // Just to compute cell costs
    game.map.findPath(
      'attack',
      ennemy.hex, 
      undefined, // no goal
      undefined, // no early exit
      getUnitsHexes(), // blacklist all units (TODO remove unit's tile from blacklist??)
      unit.attackRangeMax // cost higher limit
    )  

    for (let y = 0; y < CONFIG.map.mapSize.height; y++) {
      for (let x = 0; x < CONFIG.map.mapSize.width; x++) {
        const cell = game.map.data.terrain[x][y]

        // Must be at attack range
        if (cell.cost <= unit.attackRangeMax) {
          // Must belong to the unit movement zone
          if (HEXLIB.hexIndexOf(moveZone, cell.hex)) {
            ennemyWeakZone.push(cell.hex)
          }
        }
      }
    }

    // console.log('findPathToAttack() - ennemyWeakZone.length', ennemyWeakZone.length)
    game.ui.attackZone = ennemyWeakZone
    game.updateRenderers('highlights')
    await wait(500)

    // Find a path to reach the ennemy weak zone
    const pathsToTarget = []
    if (ennemyWeakZone.length > 0) {

      for (const weakHex of ennemyWeakZone) {
        const pathToTarget = game.map.findPath(
          unit.type, // graph type
          unit.hex, // start hex
          weakHex, // goal hex
          true, // early exit
          getUnitsHexes() // blacklist
        )

        if (pathToTarget) {
          pathsToTarget.push(pathToTarget)
        }
      }
    } else {
      console.warn('findPathToAttack() - ennemyWeakZone is empty!')
    }

    if (pathsToTarget.length > 0) {
      if (pathsToTarget.length > 1) {
        // TODO: take terrain defense into account
        let shortestPath,
            shortestLength = 100000
        for (const path of pathsToTarget) {
          if (path.length < shortestLength) {
            shortestPath = path
            shortestLength = path.length
          }
        }
        return shortestPath
      } else {
        return pathsToTarget[0]
      }

    } else {
      console.error('findPathToAttack() - no path found!!!')
      return false
    }
  }

  const moveUnitTowards = async (unit, goal) => {
    // console.warn('MOVE TORWARDS', goal)

    let longPath
    longPath = game.map.findPath(
      unit.type,
      unit.hex, 
      goal,
      true,
      getUnitsHexes()
    )

    if (longPath) {
      // console.log('PATH TOWARDS - can reach', longPath)
    // No direct path, use attack graph
    } else {
      longPath = game.map.findPath(
        'attack',
        unit.hex, 
        goal,
        true
        // getUnitsHexes()
      )
      // console.log('PATH TOWARDS - won\'t reach', longPath)
    }

    if (!longPath || longPath.length === 0) {
      console.error('moveUnitTowards() - no longPath found!')
      return false
    }

    longPath = longPath.reverse()
    game.ui.cursorPath = longPath
    game.ui.cursor = longPath[longPath.length - 1]
    game.updateRenderers(['highlights'])
    await wait(500)
    game.ui.cursorPath = []

    let id = 0
    for (const longPathStep of longPath) {
      // console.log('PATHFIND step', id)
      id++

      game.ui.cursor = longPathStep
      game.updateRenderers(['highlights'])
      await wait(125)
  
      const path = game.map.findPath(
        unit.type,
        unit.hex, 
        longPathStep,
        true,
        getUnitsHexes(),
        unit.movement
      )

      if (path && path.length > 0) {
        game.ui.cursorPath = path
        game.ui.cursor = path[path.length - 1]
        game.updateRenderers(['highlights'])
        await wait(500)
        
        await game.MOVE(unit, path)
        
        return path

      } else {
        console.warn('MOVE TOWARDS path not found!')
      }
    }

    console.error('move towards fail!!!')
    return false
  }

  const moveUnitRandomly = async (unit) => {
    game.ui.moveZone = getZones(unit).move

    if (game.ui.moveZone.length === 1) { return false }

    const target = game.ui.moveZone[Math.floor(RNG() * game.ui.moveZone.length)] 
    const path = game.map.findPath(
      unit.type,
      unit.hex, 
      target,
      true,
      getUnitsHexes()
    )

    game.ui.cursorPath = path
    game.ui.cursor = path[path.length - 1]
    game.updateRenderers(['highlights'])
    await wait(500)

    await game.MOVE(unit, path)
  }

  const chooseEnnemy = (unit, ennemies) => {
    let bestEnnemy, bestEnnemyValue = 10000 // the lesser the better
    for (const ennemy of ennemies) {
      // Manhattan distance (attack the closer)
      const distance = HEXLIB.hexDistance(unit.hex, ennemy.hex)
      // Ennemy health (attack the weakest)
      const health = ennemy.health

      // Hysterersis!
      const value = health * 2 + distance * 4

      if (value < bestEnnemyValue) {
        bestEnnemyValue = value
        bestEnnemy = ennemy
      }

      return bestEnnemy
    }
  }

  const botBuildUnits = async (player) => {
    // Build things
    let playerBuildings = game.map.data.buildings.filter(
      (building) => 
      building.ownerId === player.id && 
      (
        building.type === 'factory' || 
        building.type === 'port' || 
        building.type === 'airport') &&
      !building.hasBuilt
    )

    if (playerBuildings.length) {

      playerBuildings = arrayShuffle(playerBuildings)

      for (const playerBuilding of playerBuildings) {
        if (player.money >= 1000) {

          // Choose random unit type
          const unitTypes = Object.keys(CONFIG.game.units)
          let nMaxTry = 10, unitType
    
          while (!unitType && nMaxTry > 0) {
            nMaxTry--
            const type = unitTypes[Math.floor(RNG() * unitTypes.length)]
            if (
              CONFIG.game.units[type].cost <= player.money &&
              (
                (
                  CONFIG.game.units[type].family === 'ground' &&
                  playerBuilding.type === 'factory'
                ) || (
                  CONFIG.game.units[type].family === 'sea' &&
                  playerBuilding.type === 'port'
                ) || (
                  CONFIG.game.units[type].family === 'air' &&
                  playerBuilding.type === 'airport'
                )
              )
            ) {
              unitType = type
            }
          }
  
          if (unitType) {
            await game.BUILD_UNIT(game.currentPlayer, playerBuilding, unitType)
          }
        }
      }
    }
  }

  // PLAY BOT (step 3)
  // The current player is bot, auto-play it
  const playBot = async () => {
    const player = game.currentPlayer
    
    for (const unit of game.currentPlayer.units) {
      let isUnitTurnFinished = false,
          mustStayInPlace = false
      const unitCell = game.map.getCellFromHex(unit.hex)

      mode = 'select'
      focusUnit(unit)
      await wait(500)
      
      selectPlayerUnit(unit)
      // mode is 'move' now
      await wait(500)
      
      // GROUND UNIT ROUTINE
      // Conquer and defend

      // Can the unit conquer a building?
      if (unit.canConquer) {

        if (unitCell.building && unitCell.building.ownerId !== player.id) {
          game.CONQUER(unit)
          isUnitTurnFinished = true
        }

        if (unitCell.building && unitCell.building.type === 'city') {
          // Defend the city
          mustStayInPlace = true
          console.warn('DEFEND THE CITY!')

        } else {
          const nearestBuilding = getNearestBuilding(unit)

          if (nearestBuilding) {
            // Is the building in the move zone?
            const path = game.map.findPath(
              unit.type,
              unit.hex, 
              nearestBuilding.hex,
              true,
              getUnitsHexes(),
              unit.movement
            )
            if (path) {
              // Move to a building and conquer it
              await game.MOVE(unit, path)
              game.CONQUER(unit)
              isUnitTurnFinished = true
            } else {
              // Get close to a distant building
              await moveUnitTowards(unit, nearestBuilding.hex)
              mustStayInPlace = true
            }
          }

        }
      }

      // MOVE AND ATTACK

      if (!isUnitTurnFinished) {

        let targets = getEnnemiesInAttackZone(unit)
        const pacificMode = false
  
        if (mustStayInPlace) {
          // Only attack targets close to us (no move required)
          targets = targets.filter(
            (target) => {
              const distance = HEXLIB.hexDistance(target.hex, unit.hex)
              // console.log('distance', distance, unit.attackRangeMin, unit.attackRangeMax)

              return distance <= unit.attackRangeMax &&
              distance >= unit.attackRangeMin
            }
          )
        }

        if (targets.length > 0 && !pacificMode) {
          console.warn(`${targets.length} ennemies found, MOVE AND ATTACK`)
  
          const targetsHexes = []
          for (const target of targets) {
            targetsHexes.push(target.hex)
          }
          
          game.ui.moveZone = []
          game.ui.attackZone = targetsHexes
          game.updateRenderers('highlights')
          
          await wait(500)
  
          // Choose the target
          const ennemy = chooseEnnemy(unit, targets)
          // Choose a random victim
          // const ennemy = targets[Math.floor(RNG() * targets.length)]

          if (mustStayInPlace) {
            await game.ATTACK(unit, ennemy)
            console.error('attack and stay in place')

          } else {
            game.ui.attackZone = [ennemy.hex]
            game.updateRenderers(['highlights'])
            
            await wait(500)
    
            const pathToTarget = await findPathToAttack(unit, ennemy)
    
            if (pathToTarget) {
              // console.log('PATH TO TARGET', pathToTarget)
              mode = 'move'
      
              game.ui.cursorPath = pathToTarget
              game.updateRenderers(['highlights'])
    
              await wait(500)
    
              if (pathToTarget.length > 0) {
                // console.warn('bot moving to shoot...')
                await game.MOVE(unit, pathToTarget)
    
                await game.ATTACK(unit, ennemy)  
              }
            } else {
              console.error('no path to attack target!!!')
            }
          }
          
  
        // No targets
        } else if (!mustStayInPlace) {
          // RANDOM MOVE
          // console.warn(`No ennemies, RANDOM MOVE`)
          // await moveUnitRandomly(unit)
  
          game.ui.moveZone = []
          game.ui.attackZone = []
          game.updateRenderers(['highlights'])
  
          const base = game.map.data.buildings.filter(
            (building) => 
            building.ownerId === game.currentPlayer.id &&
            building.type === 'base'
          )
  
          if (base.length > 0) {
            await moveUnitTowards(unit, base[0].hex)
          } else {
            console.error('move toward: no base found!')
          }
        }
      }
  
      if (player.money >= 1000) {
        await botBuildUnits(player)
      }

      // End of turn
      // endUnitTurn() // TODO: this breaks the players change routine
      selectedUnit.hasPlayed = true
      game.renderer3d.changeUnitMaterial(selectedUnit, 'colorDesaturated') // WTF?
    }

    await game.CHANGE_PLAYER()
  }

  // MOVE PHASE

  // MOVE CURSOR (step 4)
  // From keyboard arrows to a direction to an hex position
  // Select, move or attack modes
  const moveCursor = (direction) => {
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

  // GET DIRECTION INDEX (step 5)
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

  // VALIDATE MOVE (step 6)
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

  // SELECT PHASE

  // SELECT CELL (step 7)
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

  // SELECT PLAYER UNIT (step 8)
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
    const zones = getZones(unit)
    game.ui.moveZone = zones.move
    game.ui.attackZone = zones.attack
    if (game.ui.moveZone.length === 0) {
      console.log('Nowhere to go, the unit is blocked!')
    }
    game.updateRenderers(['highlights'])
  }

  // GET ZONES (step 9)
  // Grab all the tiles with a cost lower than the player movement value
  const getZones = (unit) => {
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
      getUnitsHexes(), // blacklist all units
      unit.movement // cost higher limit
    )  
    game.updateRenderers() // Draw numbers on 2D map

    for (let y = 0; y < CONFIG.map.mapSize.height; y++) {
      for (let x = 0; x < CONFIG.map.mapSize.width; x++) {
        const cell = game.map.data.terrain[x][y]

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
        undefined, // no blacklist
        unit.attackRangeMax // cost higher limit
      )
  
      for (let y = 0; y < CONFIG.map.mapSize.height; y++) {
        for (let x = 0; x < CONFIG.map.mapSize.width; x++) {
          const cell = game.map.data.terrain[x][y]
  
          // Is the cell in the attack range?
          if (cell.cost <= unit.attackRangeMax) {
            if (
              // Unit can't attack its own friends
              HEXLIB.hexIndexOf(friendsHexes, cell.hex) === -1 &&
              // Avoid duplicates
              HEXLIB.hexIndexOf(attackZone, cell.hex) === -1
            ) {
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

  // GET UNITS HEXES (step 10)
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

  // FOCUS UNIT (step 11)
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
  
  // CURSOR LINE (step 12)
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

  // CANCEL ACTION (step 13)
  const cancelAction = () => {
    if (mode === 'select') {
      console.log('Nothing to cancel!')
      // Nothing to do
    } else if (mode === 'move') {
      cancelMove()
    }
  }
 
  // CANCEL MOVE (step 14)
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

  // SELECT DESTINATION (step 15)
  // Then open the move menu
  const selectDestination = async function() {
    const path = game.ui.cursorPath // Use the cursor path as movement path
    
    // Avoid the user to move cursor or do other actions during movement
    mode = 'passive'
    // Reset the move mode UI
    game.ui.moveZone = []
    game.ui.attackZone = []
    game.ui.cursorPath = []
    game.updateRenderers(['highlights'])

    // Make the unit travel the path
    await game.MOVE(selectedUnit, path)

    // Next menu
    mode = 'game-menu-move'
    const actions = ['Wait']
    if (canUnitAttack(selectedUnit)) {
      actions.unshift('Attack')
    }
    if (canUnitConquer(selectedUnit)) {
      actions.unshift('Conquer')
    }
    dom.openGameMenu(actions)
  }

  // CAN UNIT ATTACK (step 16)
  const canUnitAttack = (unit) => {
    game.ui.attackZone = getAttackZone(unit)
    // Does the unit can attack any ennemy?
    return game.ui.attackZone.length > 0
  }

  // GET ATTACK ZONE (step 17)
  const getAttackZone = (unit) => {
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

  // CAN UNIT CONQUER (step 18)
  const canUnitConquer = (unit) => {
    const cell = game.map.getCellFromHex(unit.hex)
    return (
      cell.building && 
      cell.building.ownerId !== game.currentPlayer.id &&
      selectedUnit.canConquer
    )
  }

  // ATTACK PHASE

  // SELECT ATTACK (step 19)
  const selectAttack = () => {
    mode = 'attack'
    // Target the first ennemy
    selectedTargetId = 0
    
    // Move the cursor
    game.updateCursor(game.ui.attackZone[0])
    game.renderer3d.updateCameraPosition(game.ui.attackZone[0])
    game.updateRenderers(['highlights'])
  }

  // CANCEL FINISHED MOVE (step 20)
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

  // VALIDATE TARGET (step 21)
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
  
  // GET ENNEMY FROM HEX
  const getEnnemyFromHex = (targetHex) => {
    for (const ennemy of game.players) {
      if (ennemy !== game.currentPlayer) {
        // Loop on all ennemies
        for (const ennemyUnit of ennemy.units) {
          if (HEXLIB.hexEqual(ennemyUnit.hex, targetHex)) {
            return ennemyUnit
          }
        }
      }
    }

    // No ennemy unit on this hex
    return false
  }

  // END UNIT TURN
  const endUnitTurn = async () => {
    // Mark the unit as having played
    selectedUnit.hasPlayed = true
    game.renderer3d.changeUnitMaterial(selectedUnit, 'colorDesaturated')

    // Automatic end of turn (ala Fire Emblem)
    const nUnitsRemaining = game.currentPlayer.units.filter(
      (unit) => !unit.hasPlayed
    ).length

    // TODO: also check of buildings
    if (nUnitsRemaining === 0) {
      // No more unit to play with
      await game.CHANGE_PLAYER()

    } else {
      console.log(`Still ${nUnitsRemaining} unit(s) to play`)
      mode = 'select'
      focusUnit('next')
    }
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

  // WAIT
  // Simply wait for some time
  const wait = (time = 500) => {
    return new Promise((resolve) => {
      window.setTimeout(() => {
        resolve()
      }, time / CONFIG.game.animationsSpeed)
    })
  }
  
  return game
}

export default Game