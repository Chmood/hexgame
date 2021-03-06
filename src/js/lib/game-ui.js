import HEXLIB from '../vendor/hexlib'
import store from './store'

////////////////////////////////////////////////////////////////////////////////
// GAME UI

const GameUI = (game) => {

  const CONFIG = game.CONFIG

  // CHANGE MODE
  const changeMode = (mode) => {
    console.log('Mode changed to ', mode)
    game.dom.updateInfoMode(mode)
    ui.mode = mode
  }

  // ON KEY CHANGE
  const onKeyDown = (keys) => {
    // Only catch key events if the standard camera is active
    if (game.renderer3d.getActiveCamera().name === 'camera') {

      // Keys in game menus
      if (ui.mode === 'game-menu-select' || ui.mode === 'game-menu-move') {
                if (keys['ArrowUp']) {    game.dom.moveGameMenu('up')
        } else if (keys['ArrowDown']) {   game.dom.moveGameMenu('down')
        } else if (keys['x']) {           game.dom.selectGameMenu()
        }

        if (ui.mode === 'game-menu-select') {
          // Player can only close menu (with no item selected) during selection phase
                if (keys['c']) {          game.dom.closeGameMenu()
                                          changeMode('select')
          }
        } else if (ui.mode === 'game-menu-move') {
          // Closing the menu in move phase cancel the move
                if (keys['c']) {          game.dom.closeGameMenu()
                                          // changeMode('move')
                                          cancelFinishedMove()
          }
        }

      // Keys in game
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
          
        } else if (keys['x']) {           doAction()
        } else if (keys['c']) {           cancelAction()
        } else if (keys['v']) {           focusUnit('previous')
        } else if (keys['b']) {           focusUnit('next')

        } else if (keys['e']) {           game.renderer3d.updateCameraZoom('in')
        } else if (keys['r']) {           game.renderer3d.updateCameraZoom('out')
        } else if (keys['t']) {           game.renderer3d.updateCameraAlpha('counterclockwise')
                                          ui.cameraDirection--
                                          ui.cameraDirection = game.cycleValueInRange(ui.cameraDirection, 6)
        } else if (keys['y']) {           game.renderer3d.updateCameraAlpha('clockwise')
                                          ui.cameraDirection++
                                          ui.cameraDirection = game.cycleValueInRange(ui.cameraDirection, 6)
        }
      }
    }
  }

  // UPDATE CURSOR
  const updateCursor = (hex) => {
    if (hex) { // May be called with invalid cursor hex
      if (!HEXLIB.hexEqual(hex, ui.cursor)) {
        // Cursor has moved
        ui.cursor = hex // Update the new cursor
        // Update the cursor line
        if (ui.mode === 'move') {
          ui.cursorPath = getCursorLine(hex, ui.selectedUnit.hex, ui.selectedUnit.type)
        } else {
          ui.cursorPath = []
        }

        game.updateRenderers(['highlights'])

        if (ui.mode === 'attack') {
          updateInfosPanel(hex, ui.selectedUnit.hex)

        } else {
          updateInfosPanel(hex)
        }
      }
    }
  }

  // MOVE CURSOR
  // From keyboard arrows to a direction to an hex position
  // Select, move or attack modes
  const moveCursor = (direction) => {
    // SELECT AND MOVE MODE
    if (ui.mode === 'select' || ui.mode === 'move') {
      // Get the direction (out of the 6 possible ones)
      const directionIndex = getDirectionIndex(direction, ui.cursor)
  
      if (directionIndex !== undefined) {
        // Get the neighbor in that direction
        const hex = HEXLIB.hexNeighbors(ui.cursor)[directionIndex]

        // Don't go outside the map boundaries
        if (game.map.isHexOnMap(hex)) {

          // Constrain in unit move zone
          if (ui.mode === 'move' && !game.validateMove(ui.selectedUnit, hex)) {
            console.log('Unit cannot go there, out of move range!')
            return false
          }
          
          // Move the cursor
          ui.updateCursor(hex)
          game.renderer3d.updateCameraPosition(hex)

        } else {
          console.log('Cannot go there, edge of the map reached!')
        }
      }
    // ATTACK MODE
    } else if (ui.mode === 'attack') {
      // Left and right cycle between targets
      if (direction === 'left' || direction === 'right') {
        const increment = direction === 'left' ? -1 : 1
        ui.selectedTargetId += increment
        ui.selectedTargetId = game.cycleValueInRange(ui.selectedTargetId, ui.attackZone.length)

        const targetHex = ui.attackZone[ui.selectedTargetId]
        ui.updateCursor(targetHex)
        game.renderer3d.updateCameraPosition(targetHex)
        game.updateRenderers(['highlights'])
      }
    }
  }

  // DO ACTION
  // Fired when user click on something, or use action key('X' by default)
  // calls ACTION HEAL or ATTACK
  const doAction = async () => {
    if (ui.mode === 'configuration') return

    if (ui.mode === 'select') {
      selectCell()

    } else if (ui.mode === 'move') {
      if (game.validateMove(ui.selectedUnit, ui.cursor)) {
        selectDestination()
      } else {
        cancelMove()
      }

    } else if (ui.mode === 'attack') {
      if (validateTarget(ui.cursor)) {

        // Hide the combat panel
        store.commit('infos/setActive', { active: false })

        // Get the target
        const targetHex = ui.attackZone[ui.selectedTargetId],
              targetUnit = game.getUnitByHex(targetHex)

        await game.ACTION_DO({
          type: ui.selectedUnit.canHeal ? 'HEAL' : 'ATTACKS',
          playerUnit: ui.selectedUnit,
          ennemyUnit: targetUnit
        })

      } else {
        endUnitTurn()
      }
    }
  }

  // CANCEL ACTION
  const cancelAction = () => {
    if (ui.mode === 'select') {
      console.log('Nothing to cancel!')
      // Nothing to do
    } else if (ui.mode === 'move') {
      cancelMove()
    }
  }
 
  // CANCEL MOVE
  const cancelMove = () => {
    changeMode('select')
    ui.cursor = ui.cursorBackup
    ui.cursorPath = []
    ui.moveZone = []
    ui.attackZone = []
    ui.selectedUnit.hasMoved = false

    game.updateRenderers(['highlights'])
    game.renderer3d.updateCameraPosition(ui.cursor)

    console.log('Move has been cancelled')
  }

  // CANCEL FINISHED MOVE
  // The player cancels the unit move with the game menu
  const cancelFinishedMove = async () => {
    await game.renderer3d.teleportUnit(
      ui.selectedUnit, 
      ui.cursorBackup, // We use the cursor backup as the previous unit position
      0 // TODO: backup unit orientation too!
    )
    console.log('Move has been totally cancelled')

    // Reset UI, replace cursor and camera
    ui.cursor = ui.cursorBackup
    ui.cursorPath = []

    game.renderer3d.updateCameraPosition(ui.cursor)

    ui.selectedUnit.hasMoved = false

    selectUnit(ui.selectedUnit)
  }

  // FOCUS CELL
  // cursor and camera updates
  const focusHex = (hex) => {
    ui.cursor = hex
    ui.cursorBackup = hex
    game.updateRenderers(['highlights'])
    game.renderer3d.updateCameraPosition(hex)
  }

  // FOCUS UNIT
  // Give focus (camera and cursor) either to the given unit, or next or previous
  const focusUnit = (param = 'next') => {
    // Prevents focusing during move or passive mode
    if (ui.mode !== 'select') {
      // console.log(`Focus can only be used in "select" mode!`)
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
      if (ui.focusedUnit !== undefined) {
        focusedUnitId = ui.focusedUnit.id
      }

      // Find the next/previous unit that still can play
      const idIncrement = param === 'previous' ? -1 : 1
      let found = false
      while (!found) {
        focusedUnitId += idIncrement
        focusedUnitId = game.cycleValueInRange(focusedUnitId, game.currentPlayer.units.length)
        if (!game.currentPlayer.units[focusedUnitId].hasPlayed) {
          found = true
        }
      }
      ui.focusedUnit = game.currentPlayer.units[focusedUnitId]

    } else {
      // We passed a unit as param
      if (param.hasPlayed) {
        return
      } else {
        ui.focusedUnit = param
      }
    }

    // Actually give focus to the unit
    const hex = ui.focusedUnit.hex
    focusHex(hex)
    console.log(`Focus on unit ${ui.focusedUnit.name}`)
  }

  // SELECT UNIT
  const selectUnit = (unit, secondMove = false, extraMovement = 0) => {
    if (unit.hasPlayed) {
      console.log(`Unit ${unit.name} has already played!`)
      return
    }

    console.log(`Unit selected: ${unit.name}`)
    // The unit can move
    changeMode('move')
    ui.selectedUnit = unit
    // Backup cursor in case of cancel
    ui.cursor = unit.hex
    ui.cursorBackup = ui.cursor
    
    // Highlight the whole movement zone
    let zones
    if (secondMove) {
      zones = game.getZones(unit, extraMovement)
    } else {
      zones = game.getZones(unit)
    }

    ui.moveZone = zones.move

    if (ui.moveZone.length === 0) {
      console.log('Nowhere to go, the unit is blocked!')
    }

    if (!secondMove) {
      // Attack and heal zones
      if (!unit.canHeal) {
        ui.attackZone = zones.attack
      } else {
        ui.attackZone = zones.heal
      }
    } else {
      ui.attackZone = []
    }

    game.updateRenderers(['highlights'])
  }

  // SELECT ATTACK
  // And heal, too
  const selectAttack = () => {
    changeMode('attack')
    // Target the first ennemy
    ui.selectedTargetId = 0
    
    // Move the cursor
    ui.updateCursor(ui.attackZone[0])
    game.renderer3d.updateCameraPosition(ui.attackZone[0])
    game.updateRenderers(['highlights'])
  }

  // VALIDATE TARGET
  // Check (in attack mode) if the hex (chosen by mouse only) is a valid target
  // In this case, also update selectedTargetId
  const validateTarget = (hex) => {
    for (const [index, targetHex] of ui.attackZone.entries()) {
      // Did the player click on a valid target hex?
      if (HEXLIB.hexEqual(hex, targetHex)) {
        ui.selectedTargetId = index
        return true
      }
    }

    return false
  }
  
  const ui = {
    cursor: HEXLIB.hex(1, 1), // Hex
    cursorBackup: HEXLIB.hex(1, 1), // Hex
    cursorPath: [], // [Hex]
    moveZone: [], // [Hex]
    attackZone: [], // [Hex]
    mode: 'passive', // 'homepage', 'options', 'configuration', 'passive', 'select', 'move', 'attack', 'game-menu-select', 'game-menu-move'
    selectedUnit: undefined, // Unit
    focusedUnit: undefined, // Unit
    unitsToMove: [], // [Unit]
    selectedBuilding: undefined, // Building
    selectedTargetId: undefined, // Number
    cameraDirection: 0, // From 0 to 5

    // PUBLIC METHODS
    // moveCursor,
    // cancelAction, // Called via keyboard cancel boutton
    // cancelMove,
    // cancelFinishedMove,
    // selectDestination,
    // validateTarget,
    changeMode,
    onKeyDown,
    updateCursor,
    doAction,
    focusUnit,
    selectUnit,
    selectAttack, // Called via game menu

    resetUI() {
      ui.moveZone = []
      ui.attackZone = []
      ui.selectedUnit = undefined
      ui.cameraDirection = 0
    },

    // MAIN UI ACTIONS
    // Those updates the renderers, UI layers and 3D animations
    // They are called from game ACTIONS

    CHANGE_TURN(turn) {
      return new Promise(async (resolve) => {

        await game.dom.displayBigBanner(`TURN ${turn}`)

        resolve()
      })
    },

    CHANGE_PLAYER(playerId) {
      return new Promise(async (resolve) => {

        // await dom.displayBigBanner(`Player ${game.currentPlayer.name}'s turn`)
    
        game.dom.updateTopbar(game.currentPlayer)
    
        // Focus on the first base
        const base = game.getBuildingsByPlayer(game.currentPlayer).filter(
          (building) => building.type === 'base'
        )

        if (base.length > 0) {
          focusHex(base[0].hex)
        }

        changeMode('select')
        ui.unitsToMove = game.currentPlayer.units

        if (ui.unitsToMove.length > 0) {
          ui.focusedUnit = ui.unitsToMove[0] 
          ui.focusUnit(ui.focusedUnit)
        }
    
        // Is the next player a bot?
        if (!game.currentPlayer.isHuman) {
          console.log(`Player ${game.currentPlayer.name} is a bot`)
          game.bot.playBot(game.currentPlayer)
        }

        resolve()
      })
    },

    EARN_MONEY(player) {
      return new Promise(async (resolve) => {

        const buildings = game.map.data.buildings.filter((building) => 
          building.ownerId === player.id
        )

        for (const building of buildings) {
          // 'Forbidden' mutation that will be canceled in game.ACTION_DO('EARN_MONEY')
          player.money += game.CONFIG.players[player.id].moneyPerBuilding
      
          game.dom.updateTopbar(player)
          game.renderer3d.updateCameraPosition(building.hex)
  
          await game.wait()
        }
        resolve()
      })
    },

    MOVE(unit, path) {
      return new Promise(async (resolve) => {
        path.shift() // Remove the first element (that is unit/starting cell)

        if (path.length > 0) {
          await game.renderer3d.moveUnitOnPath(unit, path)
          console.log(`Unit moved: ${unit.name}`)

        } else {
          console.log('Unit didn\'t move, stay on place!')
        }
        resolve()
      })
    },

    ATTACK(player, playerUnit, ennemy, ennemyUnit) {
      return new Promise(async (resolve) => {

        // Do the attack
        changeMode('passive')
        console.log(`${player.name}'s ${playerUnit.name} attacks ${ennemy.name}'s ${ennemyUnit.name}`)
        const attackAnimation = game.renderer3d.attackUnit(playerUnit, ennemyUnit)
        await attackAnimation.waitAsync()

        resolve()
      })
    },

    DEAL_DAMAGE(unit) {
      return new Promise(async (resolve) => {
        focusHex(unit.hex)

        // Animate ennemy's health bar
        const healthbarAnimation = game.renderer3d.updateHealthbar(unit)
        await healthbarAnimation.waitAsync()

        ui.attackZone = []

        resolve()
      })
    },

    HEAL(player, playerUnit, friend, friendUnit) {
      return new Promise(async (resolve) => {

        // Do the heal
        changeMode('passive')
        console.log(`${player.name}'s ${playerUnit.name} heals ${friend.name}'s ${friendUnit.name}`)
        const healAnimation = game.renderer3d.attackUnit(playerUnit, friendUnit) // TODO: different animation
        await healAnimation.waitAsync()

        resolve()
      })
    },

    DESTROY(unit) {
      return new Promise(async (resolve) => {
        const destroyAnimation = game.renderer3d.destroyUnit(unit)
        await destroyAnimation.waitAsync()
        game.renderer3d.deleteUnit(unit)
        
        resolve()
      })  
    },

    LOOSE(player, loseType) {
      return new Promise(async (resolve) => {

        // TODO: lose banner?

        resolve()
      })
    },

    WIN(player, winType) {
      return new Promise(async (resolve) => {

        // TODO: winner banner?

        resolve()
      })
    },

    CONQUER(unit, cell) {
      return new Promise(async (resolve) => {

        const conquerAnimation1 = game.renderer3d.conquerBuilding(unit)
        await conquerAnimation1.waitAsync()
        const conquerAnimation2 = game.renderer3d.conquerBuilding(unit)
        await conquerAnimation2.waitAsync()
        game.renderer3d.changeBuildingColor(cell, game.currentPlayer.id)

        resolve()
      })

    },

    BUILD_UNIT(player, building, unit) {
      return new Promise(async (resolve) => {
        game.updateRenderers(['players'])
        game.renderer3d.updateCameraPosition(building.hex)
        const buildUnitAnimation = game.renderer3d.buildUnit(unit)
        await buildUnitAnimation.waitAsync()
    
        // Less money
        game.dom.updateTopbar(player)
    
        // Go back to select mode
        changeMode('select')

        resolve()
      })
    }

  } // End ui{}

  // PRIVATE

  // CURSOR LINE
  const getCursorLine = (cursor, target, type) => {
    if (game.map.getCellFromHex(cursor) && game.map.getCellFromHex(cursor).isInGraph) {
      const cursorLine = game.map.findPath(
        type,
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
    directionIndex = game.cycleValueInRange(directionIndex - ui.cameraDirection, 6)

    return directionIndex
  }

  // SELECT CELL
  // TODO: rewrite with Array.filter()
  const selectCell = () => {
    let isSomethingSelected = false
    const actions = ['EndTurn', 'QuitGame']

    // Check if a unit is selected
    for (const player of game.players) {
      for (const unit of player.units) {
        if (HEXLIB.hexEqual(ui.cursor, unit.hex)) {
          // The player has selected a unit
          isSomethingSelected = true

          if (player === game.currentPlayer) {
            // The player selected one of its own units
            selectUnit(unit)

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
      const cell = game.map.getCellFromHex(ui.cursor)
      if (cell.building) {
        const building = cell.building
        // Does the building belongs to the active player?
        if (building.ownerId === game.currentPlayer.id) {
          // Is the building a factory, a port or an airport?
          if (building.canBuild) {
            // Is the building free to build a unit?
            if (!building.hasBuilt) {
              ui.selectedBuilding = building
              actions.unshift('BuildUnits')
            } else {
              // TODO: infos on the player factory/port/airport
              console.warn('Selected building', building)
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
      changeMode('game-menu-select')
      game.dom.openGameMenu(actions)
    }
  }

  // SELECT DESTINATION
  // Then open the move menu
  // calls ACTION MOVE
  const selectDestination = async function() {
    const path = ui.cursorPath // Use the cursor path as movement path
    const unit = ui.selectedUnit

    // Avoid the user to move cursor or do other actions during movement
    changeMode('passive')
    // Reset the move mode UI
    ui.moveZone = []
    ui.attackZone = []
    ui.cursorPath = []
    game.updateRenderers(['highlights'])

    if (path.length > 0) {
      unit.rangeMoved = path.length
      // Make the unit travel the path
      await game.ACTION_DO({
        type: 'MOVE',
        unit: unit,
        path: path
      })
    }

    // Next menu
    changeMode('game-menu-move')
    const actions = ['Wait']

    if (canUnitAttack(unit)) { actions.unshift('Attack') }
    if (canUnitHeal(unit)) { actions.unshift('Heal') }
    if (canUnitConquer(unit)) { actions.unshift('Conquer') }

    game.dom.openGameMenu(actions)
  }

  // END OF MOVE ACTIONS

  // CAN UNIT ATTACK
  // ui.attackZone will be used later to choose target
  const canUnitAttack = (unit) => {
    if (
      !unit.canAttack ||
      (unit.canMoveOrFire && unit.rangeMoved > 0)
    ) return false

    ui.attackZone = game.getHexesFromItems(
      game.getEnnemiesInAttackRange(unit)
    )

    // Does the unit can attack any ennemy?
    return ui.attackZone.length > 0
  }

  // CAN UNIT HEAL
  const canUnitHeal = (unit) => {
    if (!unit.canHeal) return false

    ui.attackZone = game.getHexesFromItems(
      game.getFriendsInHealRange(unit)
    )

    // Does the unit can heal any friend?
    return ui.attackZone.length > 0
  }

  // CAN UNIT CONQUER
  const canUnitConquer = (unit) => {

    return game.validateConquer(unit)
  }

  ////////////////////////////////////////
  // INFOS PANEL

  const formatStat = (stat, terrainModifier, ennemyModifier) => {
    let statSum = stat
    let statString = `${stat}`

    if (terrainModifier && terrainModifier !== 0) {
      statString += `${terrainModifier > 0 ? '+' : ''}${terrainModifier}`
      statSum += terrainModifier
    }

    if (ennemyModifier && ennemyModifier !== 0) {
      statString += `${ennemyModifier > 0 ? '+' : ''}${ennemyModifier}`
      statSum += ennemyModifier
    }

    return {
      stat: statSum,
      details: statSum !== stat ? statString : null
    }
  }

  //
  const getHexInfos = (hex, ennemyHex) => {
    let cell = null,
        building = null,
        unit = null

    // Is there a cell for this hex?
    const cursorCell = game.map.getCellFromHex(hex)
    
    if (cursorCell) {

      cell = {
        biome: cursorCell.biome,
        biomeColor: CONFIG.map.terrain[cursorCell.biome].color,
        elevation: Math.round(cursorCell.elevation * 10) / 10,
        moisture: Math.round(cursorCell.moisture * 10) / 10
      }

      if (cursorCell.building) {
        building = {
          type: cursorCell.building.type,
          owner: cursorCell.building.ownerId !== undefined ? CONFIG.players[cursorCell.building.ownerId].name : null,
          ownerColor: cursorCell.building.ownerId !== undefined ? CONFIG.players[cursorCell.building.ownerId].color : '#666'
        }
      }

      const cursorUnit = game.getUnitByHex(hex)

      if (cursorUnit) {

        // Get the unit modifiers (terrain and buildings)
        const terrainModifiers = game.getTerrainModifiers(cursorUnit)

        let ennemyModifiers = {
          strength: null,
          defense: null
        }

        if (ennemyHex) {
          const ennemyUnit = game.getUnitByHex(ennemyHex)
          ennemyModifiers = game.getEnnemyModifiers(cursorUnit, ennemyUnit)
        }

        const statStrength = formatStat(
          cursorUnit.strength, 
          terrainModifiers.strength,
          ennemyModifiers.strength
        )
        const statDefense = formatStat(
          cursorUnit.defense, 
          terrainModifiers.defense,
          ennemyModifiers.defense
        )

        unit = {
          owner: CONFIG.players[cursorUnit.playerId].name,
          ownerColor: CONFIG.players[cursorUnit.playerId].color,
          type: cursorUnit.type,
          family: cursorUnit.family,
          health: cursorUnit.health,
          maxHealth: cursorUnit.maxHealth,

          strength:         statStrength.stat,
          strengthDetails:  statStrength.details,
          defense:          statDefense.stat,
          defenseDetails:   statDefense.details,

          movement: cursorUnit.movement,
          attackRangeMin: cursorUnit.attackRangeMin,
          attackRangeMax: cursorUnit.attackRangeMax,
          canConquer: cursorUnit.canConquer,
          canAttack: cursorUnit.canAttack,
          canHeal: cursorUnit.canHeal,
        }
      }

    } else {
      console.warn(`updateInfosPanel() - no cell for hex:`, hex)
    }

    return {cell, building, unit}
  }

  // UPDATE INFOS PANEL
  const updateInfosPanel = (hex, hexAttacker) => {
    
    if (hexAttacker) {
      store.commit('infos/setData', getHexInfos(hex, hexAttacker))
      store.commit('infos/setDataAttacker', getHexInfos(hexAttacker, hex))

    } else {
      store.commit('infos/setData', getHexInfos(hex))
    }
  }

  return ui
}

export default GameUI