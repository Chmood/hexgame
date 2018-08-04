import HEXLIB from '../vendor/hexlib'
import seedrandom from 'seedrandom'

import store from './store'

import Map from './map'
import Players from './players'

import GameBot from './game-bot'
import GameUI from './game-ui'
import Renderer2d from './renderer2d'
import Renderer3d from './renderer3d'

////////////////////////////////////////////////////////////////////////////////
// GAME

// Store is ready, we get a reference to it
const CONFIG = store.getters['configuration/getGameConfig']

let hasGeneratedMap = false
let hasGeneratedBuildingsAndUnits = false

const Game = (ctx2d, canvas3d, dom, main) => {

  ////////////////////////////////////////
  // PRIVATE

  // GAME RNG
  const RNG = seedrandom()

  // COMMON TOOLS
  // Functions that are also needed from game-bot.js

  const getUnitByHex = (hex) => getUnits().filter(
    (unit) => HEXLIB.hexEqual(hex, unit.hex)
  )[0]

  const getBuildingsByPlayer = (player) => game.map.data.buildings.filter(
    (building) => building.ownerId === player.id
  )

  // GET HEXES FROM ITEMS
  const getHexesFromItems = (items) => {
    const hexes = []
    for (const item of items) {
      hexes.push(item.hex)
    }
    return hexes
  }

  // GET ZONES
  // Grab all the tiles with a cost lower than the player movement value
  const getZones = (unit, unitMovement = unit.movement) => {
    // TODO: 
    // * make findPath return an array of cells in that range???
    
    const moveZone = [],
          attackZone = [],
          healZone = [],
          friendsHexes = getUnitsHexes('friends')

    // MOVE ZONE
    // Scan the graph to compute the cost of each tile
    // We call map.findPath() without the goal parameter
    // We also pass a blacklist, ans a cost limit
    game.map.findPath(
      unit.type, // type of graph
      unit.hex, 
      undefined, // no goal
      undefined, // no early exit
      getUnitsHexes(), // blacklist all units
      unitMovement // cost higher limit
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

    // ATTACK ZONE
    if (unit.canAttack) {
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
    }

    // HEAL ZONE
    if (unit.canHeal) {
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
    
            const friendUnit = game.getUnitByHex(cell.hex)
  
            // Is the cell in the attack (read 'heal') range?
            if (cell.cost <= unit.attackRangeMax) {
              if (
                // Unit can't only heal friends
                HEXLIB.hexIndexOf(friendsHexes, cell.hex) !== -1 &&
                // Friend musn't be maxed HP
                friendUnit.health < friendUnit.maxHealth &&
                // Avoid duplicates
                HEXLIB.hexIndexOf(healZone, cell.hex) === -1
              ) {
                healZone.push(cell.hex)
              }
            }
          }
        }
      }
    }

    return {
      move: moveZone,
      attack: attackZone,
      heal: healZone
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

  // GET ENNEMIES IN ATTACK RANGE
  const getEnnemiesInAttackRange = (unit) => game.getUnits('ennemies').filter(
    (ennemy) => game.validateAttack(unit, ennemy)
  )

  const getEnnemiesInMoveThenAttackRange = (unit) => {
    const ennemies = [],
          attackZone = game.getZones(unit).attack

    if (attackZone) {
      // console.log(`getEnnemiesInMoveThenAttackRange() - attackZone length: ${attackZone.length}`)
      for (const hex of attackZone) {
        const ennemy = game.getUnitByHex(hex)
        if (ennemy && unit.canAttackTypes.indexOf(ennemy.type) !== -1) {
          ennemies.push(ennemy)
        }
      }
    } else {
      console.error(`getEnnemiesInMoveThenAttackRange() - attackZone is empty!`)
    }

    // console.log(`getEnnemiesInMoveThenAttackRange() - found ennemies: ${ennemies.length}`)
    return ennemies
  }

  // GET FRIENDS IN HEAL RANGE
  const getFriendsInHealRange = (unit) => game.getUnits('friends').filter(
    (friend) => game.validateHeal(unit, friend)
  )

  // MODIFIERS (ennemy and terrain)

  const getEnnemyModifiers = (unit, ennemyUnit) => {
    let stats = {}

    if (
      unit.modifiers && 
      unit.modifiers[ennemyUnit.type]
    ) {
      for (const stat of ['strength', 'defense']) {
        if (unit.modifiers[ennemyUnit.type][stat]) {
          stats[stat] = unit.modifiers[ennemyUnit.type][stat]

          // console.log(`unit ${unit.name} versus unit ${ennemyUnit.name}`, )
          // console.log(`${stat}: ${unit.modifiers[ennemyUnit.type][stat]}`)
        }
      }
    }

    return stats
  }

  const getTerrainModifiers = (unit) => {
    const cell = game.map.getCellFromHex(unit.hex)

    let stats = {}

    for (const stat of ['strength', 'defense']) {
      if (cell.building) {
        const ownerBonus = cell.building.ownerId === unit.playerId ? 1 : 0
        if (
          unit.modifiers && 
          unit.modifiers['buildings']
        ) {

          if (unit.modifiers['buildings'][stat]) {
            stats[stat] = unit.modifiers['buildings'][stat] + ownerBonus

            // console.log(`unit ${unit.name} terrain: buildings`, )
            // console.log(`${stat}: ${unit.modifiers['buildings'][stat]} + ${ownerBonus}`)
          }
        }

      } else {
        // Other biomes than buildings
        const biome = cell.biome

        if (
          unit.modifiers && 
          unit.modifiers[biome]
        ) {
          if (unit.modifiers[biome][stat]) {
            stats[stat] = unit.modifiers[biome][stat]

            // console.log(`unit ${unit.name} terrain: ${biome}`, )
            // console.log(`${stat}: ${unit.modifiers[biome][stat]}`)
          }
        }
      }
    }

    return stats
  }

  const getModifiers = (unit, ennemyUnit) => {
    const stats = {}

    const terrainMods = getTerrainModifiers(unit),
          ennemyMods = getEnnemyModifiers(unit, ennemyUnit)

    for (const stat of ['strength', 'defense']) {
      
      if (terrainMods[stat] || ennemyMods[stat]) {
        let statValue = 0

        if (terrainMods[stat]) {
          statValue += terrainMods[stat]
        }
        if (ennemyMods[stat]) {
          statValue += ennemyMods[stat]
        }
        stats[stat] = statValue
      }

    }
  }

  // VALIDATE MOVE
  const validateMove = (unit, hex) => {
    const movement = unit.movement - unit.rangeMoved

    const validationPath = game.map.findPath(
      unit.type,
      unit.hex, 
      hex,
      true, // early exit
      game.getUnitsHexes(),
      movement
    )
    
    if (!validationPath) {
      return false
    }
    
    if (
      unit.health > 0 &&
      !unit.hasMoved &&
      validationPath.length > 0
    ) {
      return validationPath
    }
  }

  // VALIDATE ATTACK
  const validateAttack = (playerUnit, ennemyUnit) => {
    const distance = HEXLIB.hexDistance(ennemyUnit.hex, playerUnit.hex)

    return (
      // Are the units still alive?
      playerUnit.health > 0 &&
      ennemyUnit.health > 0 &&

      // Can the player unit attack?
      playerUnit.canAttack &&
      !playerUnit.hasAttacked &&
      playerUnit.canAttackTypes.indexOf(ennemyUnit.type) !== -1 &&

      // Is the ennemy in the attack range?
      distance <= playerUnit.attackRangeMax &&
      distance >= playerUnit.attackRangeMin
    )
  }

  // VALIDATE HEAL
  const validateHeal = (playerUnit, friendUnit) => {
    const distance = HEXLIB.hexDistance(friendUnit.hex, playerUnit.hex)

    return (
      // Are the units still alive?
      playerUnit.health > 0 &&
      friendUnit.health > 0 &&

      // Can the player unit heal?
      playerUnit.canHeal &&
      friendUnit.health < friendUnit.maxHealth && 

      // Is the friend in the attack (read 'heal') range?
      distance <= playerUnit.attackRangeMax &&
      distance >= playerUnit.attackRangeMin
    )
  }

  // VALIDATE CONQUER
  const validateConquer = (unit) => {
    const cell = game.map.getCellFromHex(unit.hex)

    return (
      unit.health > 0 &&
      unit.canConquer &&
      cell.building && 
      cell.building.ownerId !== game.currentPlayer.id
    )
  }

  // MISC

  const getNextPlayerId = (id) => {
    id++
    id = cycleValueInRange(id, game.players.length)

    return id
  }

  const getNextPlayingPlayer = (player) => {
    // Get the next player
    let hasFound = false,
        nMaxTry = game.players.length,
        newPlayerId = getNextPlayerId(player.id)

    while (nMaxTry > 0) {
      nMaxTry--

      if (!game.players[newPlayerId].hasLost) {
        hasFound = true
        break
      }

      newPlayerId = getNextPlayerId(newPlayerId)
    }
    
    if (hasFound) {
      return game.players[newPlayerId]
    } else {
      console.warn('Get next playing player : not found!')
      return false
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
        // console.error('WAIT', time)
        resolve()
      }, time / CONFIG.game.animationsSpeed)
    })
  }
  
  ////////////////////////////////////////
  // PUBLIC

  const game = {
    // Backup CONFIG oberject reference
    CONFIG,

    // Inject DOM
    dom: dom,

    // Game map
    map: undefined,

    screen: undefined,

    // Players
    players: [],
    turn: 0, // elapsed game turns

    // UI overlay
    ui: undefined,

    // Current player
    currentPlayer: undefined, // Player

    async openScreen(screen) {
      // screen can be: 'homepage', 'options', 'configuration', 'game'
      
      const screenLast = game.screen
      game.screen = screen
      console.warn(`Open screen: from '${screenLast}' to '${screen}'`)

      dom.setPanel(screen)

      // Change mode
      if (screen === 'game') {
        // Game has its own modes
        
        // Reset the game UI
        game.ui.resetUI()

      } else {
        // Change UI mode
        game.ui.changeMode(screen)
      }

      // Create first map is needed
      if (screen === 'homepage') {
        if (!hasGeneratedMap) {
          hasGeneratedMap = true

          // CREATE MAP
          game.map = Map(
            CONFIG.map,
            CONFIG.game,
            CONFIG.players
          )

          // GAME RENDERERS
          game.renderer2d = Renderer2d(game, ctx2d)
          game.renderer3d = Renderer3d(game, canvas3d)
          
          // FIRST MAP CREATION
          game.generateTerrain()
        }
      }

      if (screen === 'configuration') {
        if (!hasGeneratedBuildingsAndUnits) {
          hasGeneratedBuildingsAndUnits = true

          // FIRST BULDINGS AND UNITS CREATION
          if (game.generateBuildings()) {
            if (game.generateUnits()) {
              console.log('FIRST MAP: buildings and units are ok :)')
            }
          }
        }
      }

      // Set free camera auto-rotation and controls
      if (screen !== 'intro') {
        // Intro screen may lack a camera (on first run)

        if (screen === 'homepage') {
          game.renderer3d.setCameraFreeAutorotate(true)
        } else {
          game.renderer3d.setCameraFreeAutorotate(false)
        }

        if (screen === 'configuration') {
          game.renderer3d.setCameraFreeControls(true)
        } else {
          game.renderer3d.setCameraFreeControls(false)
        }
      }

      // Resize game
      if (
        screen === 'homepage' ||
        (screenLast === 'homepage' && screen === 'configuration') ||
        (screenLast === 'game' && screen === 'configuration') ||
        (screen === 'game' && screenLast === 'configuration')
      ) {
        // await game.wait() // Wait the CSS transition time
        game.resizeGame()
      }

      // Set active camera
      if (screen === 'game') {
        // In-game camera
        game.renderer3d.setActiveCamera('camera')

      } else if (screen !== 'intro') {
        // Free camera
        game.renderer3d.setActiveCamera('cameraFree')
      }
    },

    isGameReady() {
      // console.warn('buildings', game.map.data.buildings.length, 'players', game.players.length)
      const isReady = (
        game.map.data.buildings.length > 0 && 
        game.players.length > 0
      )

      return isReady
    },

    async startGame () {
      if (!game.isGameReady) {
        console.warn('Cannot start game, missing buildings or players')
        return
      }

      console.warn('GAME STARTED')
      game.openScreen('game')
    
      // BOT
      game.bot = GameBot(game, CONFIG)

      // Show banner!
      await game.ACTION_DO({
        type: 'CHANGE_TURN',
      })

      // It's first player's turn
      // await game.CHANGE_PLAYER(0)
      await game.ACTION_DO({
        type: 'CHANGE_PLAYER',
        playerId: 0
      })
    },

    // GENERATE GAME
    // Generate a new map (with or without a fresh seed)
    generateTerrain(randomMapSeed = false) {
      // Seed
      if (randomMapSeed) {
        const randomSeed = game.map.randomizeTerrainSeed()

        store.commit('configuration/updateMapTerrainSeed', { seed: randomSeed })

      } else {
        game.map.setTerrainSeed(CONFIG.map.terrainSeed)
      }
      
      // Delete meshes
      game.renderer3d.deleteTilesAndBuildings()
      game.renderer3d.deleteUnits()
      
      // Re-init buildings and players
      game.map.data.buildings = []
      // game.players = []
      for (const player of game.players) {
        player.units = []        
      }

      store.commit('configuration/setReady', { 
        step: 'buildings',
        isReady: false
      })
      store.commit('configuration/setReady', { 
        step: 'units',
        isReady: false
      })
      
      game.map.generateMap()
      
      console.log('MAP TERRAIN', game.map.data.terrain)
      
      game.renderer3d.randomizeTileDispSets() // Should only execute if mapSize changes
      game.renderer3d.createTilesAndBuildings()
      game.updateRenderers() // 2D map updating
    },

    resynthMap() {
      // Delete meshes
      game.renderer3d.deleteTilesAndBuildings()
      game.renderer3d.deleteUnits()
      
      // Re-init buildings and players
      game.map.data.buildings = []
      game.players = []

      game.map.resynthMap()

      console.log('MAP TERRAIN', game.map.data.terrain)

      game.renderer3d.createTiles()
      game.updateRenderers() // 2D map updating
    },

    postprocessMap() {
      // Delete meshes
      game.renderer3d.deleteTilesAndBuildings()
      game.renderer3d.deleteUnits()
      
      // Re-init buildings and players
      game.map.data.buildings = []
      game.players = []

      game.map.postprocessMap()

      console.log('MAP TERRAIN', game.map.data.terrain)

      game.renderer3d.createTiles()
      game.updateRenderers() // 2D map updating
    },

    generateBuildings(randomMapSeed = false) {
      // Seed
      if (randomMapSeed) {
        const randomSeed = game.map.randomizeBuildingsSeed()

        store.commit('configuration/updateMapBuildingsSeed', { seed: randomSeed })

      } else {
        game.map.setBuildingsSeed(CONFIG.map.buildingsSeed)
      }

      let generateBuildingsSuccess = false,
          nTry = 1, // for logging purpose only
          nTryLeft = 100

      game.renderer3d.deleteTilesAndBuildings()
      game.renderer3d.deleteUnits()

      game.players = []

      while (!generateBuildingsSuccess && nTryLeft >= 0) {
        nTryLeft--
        nTry++

        // BUILDINGS
        console.log(`Buildings generation (#${nTry} try)`)
        generateBuildingsSuccess = game.map.generateBuildings()
      }

      if (generateBuildingsSuccess) {
        console.warn(`Buildings generated in ${nTry} tries`)
        console.log('MAP BULDINGS', game.map.data.buildings)

        game.renderer3d.createTilesAndBuildings()
        game.updateRenderers() // 2D map updating

        store.commit('configuration/setReady', { 
          step: 'buildings',
          isReady: true
        })

        return true

      } else {
        console.error('Buildings generation has failed!')

        store.commit('configuration/setReady', { 
          step: 'buildings',
          isReady: false
        })

        return false
      }
    },

    generateUnits() {
      // Try to place all players' units
      let generateUnitsSuccess = false,
          nTry = 1, // for logging purpose only
          nTryLeft = 100

      game.renderer3d.deleteUnits()

      while (!generateUnitsSuccess && nTryLeft >= 0) {
        nTryLeft--
        nTry++

        // PLAYERS
        console.log(`Units placement (#${nTry} try)`)
        game.players = Players(
          CONFIG.map, 
          CONFIG.game, 
          CONFIG.players, 
          game.map
        )

        if (game.players && game.players.length > 0) {
          generateUnitsSuccess = true
        }
      }

      if (generateUnitsSuccess) {
        console.warn(`Units placed in ${nTry} tries`)
        console.log('PLAYERS', game.players)
        game.renderer3d.createUnits()

        store.commit('configuration/setReady', { 
          step: 'units',
          isReady: true
        })

        return true

      } else {
        console.error('Units placement has failed!')

        store.commit('configuration/setReady', { 
          step: 'units',
          isReady: false
        })

        return false
      }
    },

    // COMMON FUNCTIONS

    // Used by GameBot
    getBuildingsByPlayer,
    getZones,
    getUnits,
    getUnitsHexes,
    markUnitAsHavingPlayed,
    getEnnemiesInMoveThenAttackRange,
    
    // Used by UI
    getHexesFromItems,
    getEnnemiesInAttackRange,
    getFriendsInHealRange,
    validateMove,
    validateAttack,
    validateHeal,
    validateConquer,

    getEnnemyModifiers,
    getTerrainModifiers,
    getModifiers,

    // Used by GameBot and UI
    getUnitByHex,
    cycleValueInRange,
    clampValueInRange,
    wait,
  
    ////////////////////////////////////////
    // UI

    // RESIZE GAME
    resizeGame() {
      
      if (hasGeneratedMap) {
        main.setSize()
        game.updateRenderers(['resize'])
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

    // GAME MENU ITEMS
    gameMenuAttack() {
      dom.closeGameMenu()
      // Attack phase
      game.ui.selectAttack()
    },
    gameMenuHeal() {
      dom.closeGameMenu()
      // Heal phase
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
      console.warn('TODO: quit game and go back to homepage')
    },

    // MAIN ACTIONS
    // Those mutates the game state

    async ACTION_DO(action) {
      if (action.type === 'CHANGE_TURN') {

        // New turn
        game.turn++
        // Reset players status
        game.players = game.players.map(
          (player) => {
            player.hasPlayed = false
            return player
        })

        game.ui.CHANGE_TURN(game.turn)

        // Banner?
      } else if (action.type === 'CHANGE_PLAYER') {
              const playerId = action.playerId
        if (playerId !== undefined) {

          // MUTATE game.currentPlayer
          game.currentPlayer = game.players[playerId]
    
        } else {
          // Clean up last player
          game.currentPlayer.hasPlayed = true
          console.log(`${game.currentPlayer.name}'s turn is over`)

          for (const unit of game.currentPlayer.units) {

            // MUTATE player's units
            markUnitAsHavingPlayed(unit, false)
            unit.hasMoved = false
            unit.hasAttacked = false
            unit.rangeMoved = 0
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

          // Check if the game turn is over
          const nPlayersLeftThisTurn = game.players.filter(
            (player) => 
            !player.hasLost &&
            !player.hasPlayed
          ).length

          if (nPlayersLeftThisTurn === 0) {
            await game.ACTION_DO({
              type: 'CHANGE_TURN',
            })
          }

          // MUTATE game.currentPlayer
          game.currentPlayer = getNextPlayingPlayer(game.currentPlayer)

          console.warn(`*** It's player ${game.currentPlayer.name}'s turn ***`)
        }

        // EARN MONEY

        await game.ACTION_DO({
          type: 'EARN_MONEY'
        })

        // HEAL UNITS ON CONQUERED BUILDINGS
        
        const playerBuildingsHexes = getHexesFromItems(
          game.getBuildingsByPlayer(game.currentPlayer)
        )

        for (const unit of game.currentPlayer.units) {
          // Is the unit on a conquered building?
          if (HEXLIB.hexIndexOf(playerBuildingsHexes, unit.hex) !== -1) {
            // Has the unit spare room for extra health?
            if (unit.health < unit.maxHealth) {
              console.log(`Unit ${unit.name} healed from building by 2 HP`)

              await game.ACTION_DO({
                type: 'DEAL_HEAL',
                unit: unit,
                healValue: 2 // Magic value
              })
            }
          }
        }

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
        player.money = realPlayerMoney + nBuildings * CONFIG.players[player.id].moneyPerBuilding

      } else if (action.type === 'MOVE') {
        const unit = action.unit,
              path = action.path

        const pathEnd = action.path[path.length - 1]
        // MUTATE unit
        unit.moveToHex(pathEnd, CONFIG.map.mapTopped, CONFIG.map.mapParity)

        if (!(unit.canAttackThenMove && unit.rangeMoved < unit.movement)) {
          unit.hasMoved = true
        }

        await game.ui.MOVE(unit, path)

      } else if (action.type === 'CONQUER') {

        const cell = game.map.getCellFromHex(action.unit.hex)
        const building = cell.building

        const lastOwnerId = building.ownerId
    
        // MUTATE Building
        building.ownerId = game.currentPlayer.id

        if (building.canBuild) {
          building.hasBuilt = true
        }

        await game.ui.CONQUER(action.unit, cell)

        // Check if a base is captured
        if (building.type === 'base') {
          const player = game.players[action.unit.playerId]
          const ennemy = game.players[lastOwnerId]

          console.warn(`${player.name} captured ${ennemy.name}'s base!`)

          // Check if ennemy has any base left
          const nBases = 0 // TODO

          if (nBases === 0) {

            await game.ACTION_DO({
              type: 'LOOSE',
              player: ennemy,
              loseType: 'all-bases-captured'
            })
          }
        }
  
      } else if (action.type === 'BUILD_UNIT') {

        const player = action.player
        const building = action.building
        const unitType = action.unitType

        if (!building) {
          console.error(`BUID UNIT - no building provided!`)
          return

        } else if (building.hasBuilt) {
          console.warn(`${building.type} has already built this turn!`)
          return

        } else {
          if (getUnitByHex(building.hex)) {
          console.warn(`${building.type} is occupied!`)
          return
          }

          if (!CONFIG.game.units[unitType]) {
            console.warn(`Unknown unit type: ${unitType}!`)
            return

          } else if (CONFIG.game.units[unitType].isDisabled) {
            console.warn(`'${unitType}' unit type is disabled!`)
            return
          }
        }

        const unit = player.addUnit(unitType, building.hex)
    
        // New born unit can't play during the first turn
        markUnitAsHavingPlayed(unit)
        building.hasBuilt = true
        // Remove unit cost from player's money
        player.money -= unit.cost

        await game.ui.BUILD_UNIT(player, building, unit)

        if (game.currentPlayer.isHuman) {
          if (isTurnEnded()) {
            // No more units or buildings to play with
            await game.ACTION_DO({
              type: 'CHANGE_PLAYER'
            })
          }
        }

      } else if (action.type === 'ATTACKS') {

        const playerUnit = action.playerUnit
        const ennemyUnit = action.ennemyUnit

        // Attack
        if (validateAttack(playerUnit, ennemyUnit)) {
          playerUnit.hasAttacked = true

          await game.ACTION_DO({
            type: 'ATTACK',
            playerUnit: playerUnit,
            ennemyUnit: ennemyUnit
          })
  
          if (validateAttack(ennemyUnit, playerUnit)) {
            // Counter attack
            await game.ACTION_DO({
              type: 'ATTACK',
              playerUnit: ennemyUnit,
              ennemyUnit: playerUnit
            })
          } else {
            // console.error(`ATTACKS - invalid counter-attack from ${ennemyUnit.name} to ${playerUnit.name}`)
          }
        } else {
          // console.error(`ATTACKS - invalid attack from ${playerUnit.name} to ${ennemyUnit.name}`)
        }

        // 'Attack-then-move' units can move again here
        if (
          playerUnit.canAttackThenMove && 
          playerUnit.rangeMoved < playerUnit.movement
        ) {
          const extraMovement = playerUnit.movement - playerUnit.rangeMoved
          console.error('EXTRA MOVE', extraMovement)
          // Re-select the unit
          game.ui.selectUnit(playerUnit, true, extraMovement)

        } else if (game.players[playerUnit.playerId].isHuman) {
          // console.log('HUMAN END UNIT TURN')
          endUnitTurn()
        }


      } else if (action.type === 'ATTACK') {

        const playerUnit = action.playerUnit
        const ennemyUnit = action.ennemyUnit

        const player = game.players[playerUnit.playerId]
        const ennemy = game.players[ennemyUnit.playerId]

        await game.ui.ATTACK(player, playerUnit, ennemy, ennemyUnit)

        // Compute ennemy's damage
        const damage = getDamage(playerUnit, ennemyUnit)
        if (damage <= 0) {
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

      } else if (action.type === 'HEAL') {

        const playerUnit = action.playerUnit
        const friendUnit = action.ennemyUnit

        const player = game.players[playerUnit.playerId]
        const friend = game.players[friendUnit.playerId]

        await game.ui.HEAL(player, playerUnit, friend, friendUnit)

        playerUnit.hasAttacked = true

        await game.ACTION_DO({
          type: 'DEAL_HEAL',
          unit: friendUnit,
          healValue: playerUnit.strength * 2 // Magic value
        })
        
        if (player.isHuman) {
          endUnitTurn()
        }

      } else if (action.type === 'DEAL_HEAL') {

        const unit = action.unit,
              healValue = action.healValue

        let realHealValue = healValue
        unit.health += healValue

        if (unit.health > unit.maxHealth) {
          // Maxed out health
          realHealValue -= unit.health - unit.maxHealth
          unit.health = unit.maxHealth
        }

        console.log(`Unit ${unit.name} restored ${realHealValue} HP`)

        await game.ui.DEAL_DAMAGE(unit) // Only updates the healthbar

      } else if (action.type === 'DESTROY') {
        const unit = action.unit

        const ennemy = game.players[unit.playerId]
        // console.warn(`DESTROY() ennemy ${ennemy}`)
        
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
              player: ennemy,
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

        // Don't work ???
        for (let building of game.map.data.buildings) {
          if (building.ownerId === player.id) {
            building.ownerId = undefined
          }
        }

        await game.ui.LOOSE(player, loseType)

        // Do we have a winner?
        let nActivePlayers = 0,
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

  const getDamage = (playerUnit, ennemyUnit) => {
    let playerTotalStrength = playerUnit.strength,
        ennemyTotalDefense = ennemyUnit.defense

    // Terrain modifiers
    const playerMods = getModifiers(playerUnit, ennemyUnit),
          ennemyMods = getModifiers(ennemyUnit, playerUnit)

    if (playerMods && playerMods.strength) {
      playerTotalStrength += playerMods.strength
    }
    if (ennemyMods && ennemyMods.defense) {
      ennemyTotalDefense += ennemyMods.defense
    }
            
    const damage = Math.round(
      (playerTotalStrength - ennemyTotalDefense) * 
      (playerUnit.health / playerUnit.maxHealth) // Use attacker's health as a damage modifier
    )

    return damage
  }

  // IS TURN ENDED
  const isTurnEnded = () => {
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

    if (nUnitsRemaining > 0) {
      console.log(`Still ${nUnitsRemaining} unit(s) to play`)
    }
    if (nBuildingsRemaining > 0) {
      console.log(`Still ${nBuildingsRemaining} building(s) to play`)
    }

    return (nUnitsRemaining === 0 && nBuildingsRemaining === 0)
  }

  // END UNIT TURN
  const endUnitTurn = async () => {
    // Mark the unit as having played
    game.ui.selectedUnit.hasPlayed = true
    game.renderer3d.changeUnitMaterial(game.ui.selectedUnit, 'colorDesaturated')

    // Automatic end of turn (ala Fire Emblem)
    if (isTurnEnded()) {
      // No more units or buildings to play with
      await game.ACTION_DO({
        type: 'CHANGE_PLAYER'
      })

    } else {
      game.ui.changeMode('select')
      game.ui.focusUnit('next')
    }
  }

  ////////////////////////////////////////
  // INIT

  // We need Game to be ready from now

  // GAME UI
  game.ui = GameUI(game)

  // Set DOM game reference
  // dom.setGame(game)

  // Alias functions
  game.doAction = game.ui.doAction
  game.onKeyDown = game.ui.onKeyDown
  game.updateCursor = game.ui.updateCursor

  // FIRST SCREEN INIT
  game.openScreen('intro')

  return game
}

export default Game