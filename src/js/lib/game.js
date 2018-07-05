import CONFIG from './config'
import HEXLIB from '../vendor/hexlib'
import seedrandom from 'seedrandom'
import arrayShuffle from '../vendor/array-shuffle'

import Map from './map'
import Players from './players'
import GameBot from './game-bot'
import GameUI from './game-ui'
import Renderer2d from './renderer2d'
import Renderer3d from './renderer3d'

////////////////////////////////////////////////////////////////////////////////
// GAME

const Game = (ctx2d, canvas3d, dom, main) => {

  ////////////////////////////////////////
  // PRIVATE

  // RNG seeds
  let gameSeed = CONFIG.game.seed
  const RNG = seedrandom(gameSeed)

  // COMMON TOOLS
  // Functions that are also needed from game-bot.js

  const getUnitByHex = (hex) => getUnits().filter(
    (unit) => HEXLIB.hexEqual(hex, unit.hex)
  )[0]

  const getBuildingsByPlayer = (player) => game.map.data.buildings.filter(
    (building) => building.ownerId === player.id
  )

  // SELECT UNIT
  const selectUnit = (unit) => {
    if (unit.hasPlayed) {
      console.log(`Unit ${unit.name} has already played!`)
      return
    }

    console.log(`Unit selected: ${unit.name}`)
    // The unit can move
    game.ui.mode = 'move'
    game.ui.selectedUnit = unit
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

  // GET ZONES
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

  // GET UNITS
  // Get all units from an optional group ('friends' or 'ennemies', defaults to all units)
  // Also have a onlyHexes param, returning matching hexes instead of units
  const getUnits = (group, onlyHexes = false) => {
    const items = [] // can be Unit or Hex

    if (!group || group === 'ennemies') {
      for (const player of game.players) {
        if (group === 'ennemies') {
          if (player === game.currentPlayer) {
            continue
          }
        }
        for (const unit of player.units) {
          items.push(onlyHexes ? unit.hex : unit)
        }
      }
    } else if (group === 'friends') {
      for (const unit of game.currentPlayer.units) {
        items.push(onlyHexes ? unit.hex : unit)
      }
    }

    return items
  }

  // GET UNITS HEXES
  // Return an array of all/friends/ennemies units hexes
  const getUnitsHexes = (group) => getUnits(group, true)

  // MARK UNIT AS HAVING PLAYED
  const markUnitAsHavingPlayed = (unit, hasPlayed = true) => {
    if (!unit) return false

    unit.hasPlayed = hasPlayed

    if (hasPlayed) {
      game.renderer3d.changeUnitMaterial(unit, 'colorDesaturated')
    } else {
      game.renderer3d.changeUnitMaterial(unit, 'color')
    }
  }

  // UI NEEDED

  // MISC

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
  
  ////////////////////////////////////////
  // PUBLIC
  const game = {
    // DOM (backup)
    dom,

    // Game map
    map: Map(CONFIG.map),

    // Players
    players: [],

    // UI overlay
    ui: undefined,

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
        console.log('MAP TERRAIN', game.map.data.terrain)
        console.log('MAP BULDINGS', game.map.data.buildings)

        // BOT
        game.bot = GameBot(game, RNG)

        game.renderer3d.createTiles()
        game.renderer3d.createUnits()

        game.ui.resetUI()
        
        // It's first player's turn
        // await game.CHANGE_PLAYER(0)
        await game.ACTION_DO({
          type: 'CHANGE_PLAYER',
          playerId: 0
        })

        
      } else {
        console.error('Game generation has failed!')
      }
    },

    // COMMON FUNCTIONS

    // Used by GameBot
    getBuildingsByPlayer,
    selectUnit,
    getZones,
    // getUnits,
    getUnitsHexes,
    markUnitAsHavingPlayed,
    
    // Used by GameBot and UI
    getUnitByHex,
    cycleValueInRange,
    wait,
  
    ////////////////////////////////////////
    // UI

    // RESIZE GAME
    resizeGame() {
      main.setSize()

      game.updateRenderers(['resize'])
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

    // GAME MENU ITEMS
    gameMenuAttack() {
      dom.closeGameMenu()
      // Attack phase
      game.ui.selectAttack()
    },
    gameMenuWait() {
      dom.closeGameMenu()
      // End the unit turn
      endUnitTurn()
    },
    gameMenuBuildUnits() {
      dom.closeGameMenu()
      dom.openGameBuildMenu(game.ui.selectedBuilding, game.currentPlayer.money)
    },

    // ACTION GAME MENU ITEMS
    async gameMenuConquer() { // ACTION
      dom.closeGameMenu()
      await game.ACTION_DO({
        type: 'CONQUER',
        unit: game.ui.selectedUnit
      })
      // End the unit turn
      endUnitTurn()
    },
    async gameMenuEndTurn() { // ACTION
      dom.closeGameMenu()
      // await game.CHANGE_PLAYER()
      await game.ACTION_DO({
        type: 'CHANGE_PLAYER'
      })
  },
    async gameMenuBuildUnit(unitType) { // ACTION
      dom.closeGameMenu()
      await game.ACTION_DO({
        type: 'BUILD_UNIT',
        player: game.currentPlayer, 
        building: game.ui.selectedBuilding, 
        unitType: unitType
      })
    },
    gameMenuQuitGame() {
      // TODO
    },

    // MAIN ACTIONS
    // Those mutates the game state

    async ACTION_DO(action) {
             if (action.type === 'CHANGE_PLAYER') {

        if (action.playerId !== undefined) {

          // MUTATE game.currentPlayer
          game.currentPlayer = game.players[action.playerId]
    
        } else {
          // Clean up last player
          console.log(`${game.currentPlayer.name}'s turn is over`)
          for (const unit of game.currentPlayer.units) {

            // MUTATE player's units
            markUnitAsHavingPlayed(unit, false)
            unit.hasMoved = false
            unit.hasAttacked = false
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

          // MUTATE game.currentPlayer
          game.currentPlayer = game.players[playerId]

          console.warn(`*** It's player ${game.currentPlayer.name}'s turn ***`)
        }

        await game.ACTION_DO({
          type: 'EARN_MONEY'
        })
    
        game.ui.CHANGE_PLAYER(action.playerId)

      } else if (action.type === 'EARN_MONEY') {

        const player = game.currentPlayer
        
        const nBuildings = game.map.data.buildings.filter((building) => 
          building.ownerId === player.id
        ).length

        // Backup money, because earning UI animation will increase it
        const realPlayerMoney = player.money
        
        await game.ui.EARN_MONEY(player)

        // MUTATE player
        // Shouldn't change money amount
        player.money = realPlayerMoney + nBuildings * CONFIG.game.moneyEarnedPerBuilding

      } else if (action.type === 'MOVE') {

        const pathEnd = action.path[action.path.length - 1]
        // MUTATE unit
        action.unit.moveToHex(pathEnd, CONFIG.map.mapTopped, CONFIG.map.mapParity)
        action.unit.hasMoved = true

        await game.ui.MOVE(action.unit, action.path)

      } else if (action.type === 'CONQUER') {

        const cell = game.map.getCellFromHex(action.unit.hex)
        const building = cell.building
    
        // MUTATE Building
        building.ownerId = game.currentPlayer.id

        if (building.canBuild) {
          building.hasBuilt = true
        }

        await game.ui.CONQUER(action.unit, cell)
  
      } else if (action.type === 'BUILD_UNIT') {

        const player = action.player
        const building = action.building
        const unitType = action.unitType

        if (!building) {
          console.error(`BUID UNIT - no building provided!`)
          resolve()

        } else if (building.hasBuilt) {
          console.warn(`${building.type} has already built this turn!`)
          resolve ()

        } else {
          if (getUnitByHex(building.hex)) {
          console.warn(`${building.type} is occupied!`)
          resolve()
          }
        }

        const unit = player.addUnit(unitType, building.hex)
    
        // New born unit can't play during the first turn
        markUnitAsHavingPlayed(unit)
        building.hasBuilt = true
        // Remove unit cost from player's money
        player.money -= unit.cost

        await game.ui.BUILD_UNIT(player, building, unit)

      } else if (action.type === 'ATTACK') {

        const playerUnit = action.playerUnit
        const ennemyUnit = action.ennemyUnit

        const player = game.players[playerUnit.playerId]
        const ennemy = game.players[ennemyUnit.playerId]

        await game.ui.ATTACK(player, playerUnit, ennemy, ennemyUnit)

        playerUnit.hasAttacked = true

        // Compute ennemy's damage
        const damage = playerUnit.strength - ennemyUnit.defense
        if (damage < 0) {
          // No damage
          console.log(`No damage done to ${ennemyUnit.name}, still ${ennemyUnit.health} HP left`)

        } else {
          ennemyUnit.health -= damage
          if (ennemyUnit.health < 0) {
            ennemyUnit.health = 0
          }
        
          await game.ui.DEAL_DAMAGE(ennemyUnit)

          // Is the ennemy dead?
          if (ennemyUnit.health > 0) {
            console.log(`${damage} damage done to ${ennemyUnit.name}, ${ennemyUnit.health} HP left`)
          } else {
            // Destroy ennemy
            await game.ACTION_DO({
              type: 'DESTROY',
              unit: ennemyUnit
            })
                
            console.warn(`${damage} damage done to ${ennemyUnit.name}, unit destroyed!`)
          }
        }

        game.ui.attackZone = []

        // TODO: 'attack-n-run' units can move again here

        if (player.isHuman) {
          endUnitTurn()
        }

      } else if (action.type === 'DESTROY') {
        const unit = action.unit

        const ennemy = game.players[unit.playerId]
        console.warn(`DESTROY() ennemy ${ennemy}`)
        // console.warn(`DESTROY() ennemy units ${ennemy.units}`)
        
        await game.ui.DESTROY(unit)

        const ennemyUnitId = ennemy.units.indexOf(unit)
        if (ennemyUnitId !== -1) {
          // console.warn(`DESTROY() ennemyUnitId: ${ennemyUnitId}`)
          ennemy.units.splice(ennemyUnitId, 1)
          console.log(`DESTROY() remaining units: ${ennemy.units.length}`)

          // Does the ennemy has unit left?
          if (ennemy.units.length === 0) {

            await game.ACTION_DO({
              type: 'LOOSE',
              looseType: 'all-units-dead'
            })
          }
        }
      } else if (action.type === 'LOOSE') {

        const player = action.player,
              loseType = action.loseType

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

        await game.ui.LOOSE(player, loseType)

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
          await game.ACTION_DO({
            type: 'WIN',
            player: lastPlayer,
            winType: 'last-man-standing'
          })
      }

      } else if (action.type === 'WIN') {
        const player = action.player,
              winType = action.winType

        console.warn(`Player ${player.name} has won the game (${winType})!!!`)
        game.ui.WIN(player, winType)
      }
    }
  }

  // We need Game to be ready from now
  // GAME UI
  game.ui = GameUI(game)

  // Alias functions
  game.doAction = game.ui.doAction
  game.onKeyDown = game.ui.onKeyDown

  // GAME RENDERERS
  game.renderer2d = Renderer2d(game, ctx2d)
  game.renderer3d = Renderer3d(game, canvas3d)

  // END UNIT TURN
  const endUnitTurn = async () => {
    // Mark the unit as having played
    game.ui.selectedUnit.hasPlayed = true
    game.renderer3d.changeUnitMaterial(game.ui.selectedUnit, 'colorDesaturated')

    // Automatic end of turn (ala Fire Emblem)
    const nUnitsRemaining = game.currentPlayer.units.filter(
      (unit) => !unit.hasPlayed
    ).length

    const nBuildingsRemaining = game.map.data.buildings.filter(
      (building) => 
      building.ownerId === game.currentPlayer.id &&
      building.canBuild &&
      !building.hasBuilt 
    ).length

    if (nUnitsRemaining === 0 && nBuildingsRemaining === 0) {
      // No more unit to play with
      // await game.CHANGE_PLAYER()
      await game.ACTION_DO({
        type: 'CHANGE_PLAYER'
      })

    } else {
      if (nUnitsRemaining > 0) {
        console.log(`Still ${nUnitsRemaining} unit(s) to play`)
      }
      if (nBuildingsRemaining > 0) {
        console.log(`Still ${nBuildingsRemaining} building(s) to play`)
      }

      game.ui.mode = 'select'
      game.ui.focusUnit('next')
    }
  }

  return game
}

export default Game