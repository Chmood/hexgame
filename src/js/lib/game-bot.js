import CONFIG from './config'
import HEXLIB from '../vendor/hexlib'
import arrayShuffle from '../vendor/array-shuffle'

////////////////////////////////////////////////////////////////////////////////
// GAME BOT

const GameBot = (game, RNG) => {

  ////////////////////////////////////////
  // PUBLIC

  const bot = {
    // PLAY BOT
    // The current player is bot, auto-play it
    async playBot(player) {
      
      for (const unit of player.units) {
        // In case of newly created unit??
        if (unit.hasPlayed) { continue }
        
        let isUnitTurnFinished = false,
            mustStayInPlace = false
        const unitCell = game.map.getCellFromHex(unit.hex)

        // game.ui.mode = 'select'
        game.ui.focusUnit(unit)
        await game.wait(500)
        
        game.selectUnit(unit)
        // mode is 'move' now
        await game.wait(500)
        
        // GROUND UNIT ROUTINE
        // Conquer and defend

        // Can the unit conquer a building?
        if (unit.canConquer) {

          if (unitCell.building && unitCell.building.ownerId !== player.id) {
            await game.ACTION_DO({
              type: 'CONQUER',
              unit: unit
            })

            isUnitTurnFinished = true

          } else if (unitCell.building && unitCell.building.type === 'city') {
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
                game.getUnitsHexes(),
                unit.movement
              )
              if (path) {
                // Move to a building and conquer it
                await game.ACTION_DO({
                  type: 'MOVE',
                  unit: unit,
                  path: path
                })
            
                await game.ACTION_DO({
                  type: 'CONQUER',
                  unit: unit
                })
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
            // TODO: use a game function for this!
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
            // console.warn(`${targets.length} ennemies found, MOVE AND ATTACK`)
  
            const targetsHexes = []
            for (const target of targets) {
              targetsHexes.push(target.hex)
            }
            
            game.ui.moveZone = []
            game.ui.attackZone = targetsHexes
            game.updateRenderers('highlights')
            
            await game.wait(500)
    
            // Choose the target
            const ennemy = chooseEnnemy(unit, targets)
            // Choose a random victim
            // const ennemy = targets[Math.floor(RNG() * targets.length)]

            if (mustStayInPlace) {
              // ATTACK N PLACE
              await game.ACTION_DO({
                type: 'ATTACK',
                playerUnit: unit,
                ennemyUnit: ennemy
              })
              console.log('attack and stay in place')

            } else {
              game.ui.attackZone = [ennemy.hex]
              game.updateRenderers(['highlights'])
              
              await game.wait(500)
      
              // Find path to get close to the target
              const pathToTarget = await findPathToAttack(unit, ennemy)
      
              if (pathToTarget) {
                // console.log('PATH TO TARGET', pathToTarget)
                // game.ui.mode = 'move'
        
                game.ui.cursorPath = pathToTarget
                game.updateRenderers(['highlights'])
      
                await game.wait(500)
      
                if (pathToTarget.length > 0) {
                  // MOVE AND ATTACK
                  // console.warn('bot moving to shoot...')
                  await game.ACTION_DO({
                    type: 'MOVE',
                    unit: unit,
                    path: pathToTarget
                  })
        
                  await game.ACTION_DO({
                    type: 'ATTACK',
                    playerUnit: unit,
                    ennemyUnit: ennemy
                  })
                }
              } else {
                console.error('no path to attack target!!!')
              }
            }
    
          // GO TO BASE
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
    
        // End of turn
        // endUnitTurn() // TODO: this breaks the players change routine
        game.markUnitAsHavingPlayed(unit)

        // Try to build units
        await botBuildUnits(player)
      }

      // Try to build units (in case of no unit at all)
      await botBuildUnits(player)

      // await game.CHANGE_PLAYER()
      await game.ACTION_DO({
        type: 'CHANGE_PLAYER'
      })

    } // End of playBot()

  }

  ////////////////////////////////////////
  // PRIVATE

  const getNearestItem = (unit, items) => {
    if (!items) {
      console.error('getClosestItem() - no items provided')
      return false
    }
    let nearestItem, nearestItemDistance = 100000
    let isSimpleItem = items[0].hex ? false : true

    for (const item of items) {
      const path = game.map.findPath(
        unit.type,
        unit.hex, 
        isSimpleItem ? item : item.hex,
        true,
        game.getUnitsHexes()
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
      return false
    }
  }

  const getNearestBuilding = (unit) => {
    const conquerableBuildings = game.map.data.buildings.filter(
      (building) => ((building.ownerId === undefined) || (building.ownerId !== unit.playerId))
    )

    if (conquerableBuildings.length > 0) {
      const nearestBuilding = getNearestItem(unit, conquerableBuildings)

      if (nearestBuilding) {
        return nearestBuilding

      } else {
        console.warn('getNearestBuilding() - no nearest building!')  
        return false
      }

    } else {
      console.warn('getNearestBuilding() - no conquerable buildings!')
      return false
    }
    
  }

  const getEnnemiesInAttackZone = (unit) => {
    const ennemies = [],
          attackZone = game.getZones(unit).attack

    if (attackZone) {
      // console.log(`getEnnemiesInAttackZone() - attackZone length: ${attackZone.length}`)
      for (const hex of attackZone) {
        const ennemy = game.getUnitByHex(hex)
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
    const moveZone = game.getZones(unit).move
    const ennemyWeakZone = []
    
    // Just to compute cell costs
    game.map.findPath(
      'attack',
      ennemy.hex, 
      undefined, // no goal
      undefined, // no early exit
      game.getUnitsHexes(), // blacklist all units (TODO remove unit's tile from blacklist??)
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
    await game.wait(500)

    // Find a path to reach the ennemy weak zone
    const pathsToTarget = []
    if (ennemyWeakZone.length > 0) {

      for (const weakHex of ennemyWeakZone) {
        const pathToTarget = game.map.findPath(
          unit.type, // graph type
          unit.hex, // start hex
          weakHex, // goal hex
          true, // early exit
          game.getUnitsHexes() // blacklist
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
      game.getUnitsHexes()
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
        // game.getUnitsHexes()
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
    await game.wait(500)
    game.ui.cursorPath = []

    for (const longPathStep of longPath) {
      game.ui.cursor = longPathStep
      game.updateRenderers(['highlights'])
      await game.wait(125)
  
      const path = game.map.findPath(
        unit.type,
        unit.hex, 
        longPathStep,
        true,
        game.getUnitsHexes(),
        unit.movement
      )

      if (path && path.length > 0) {
        game.ui.cursorPath = path
        game.ui.cursor = path[path.length - 1]
        game.updateRenderers(['highlights'])
        await game.wait(500)
        
        await game.ACTION_DO({
          type: 'MOVE',
          unit: unit,
          path: path
        })

        return path

      } else {
        // console.log('MOVE TOWARDS path not found!')
      }
    }

    console.error('move towards fail!!!')
    return false
  }

  const moveUnitRandomly = async (unit) => {
    game.ui.moveZone = game.getZones(unit).move

    if (game.ui.moveZone.length === 1) { return false }

    const target = game.ui.moveZone[Math.floor(RNG() * game.ui.moveZone.length)] 
    const path = game.map.findPath(
      unit.type,
      unit.hex, 
      target,
      true,
      game.getUnitsHexes()
    )

    game.ui.cursorPath = path
    game.ui.cursor = path[path.length - 1]
    game.updateRenderers(['highlights'])
    await game.wait(500)

    await game.ACTION_DO({
      type: 'MOVE',
      unit: unit,
      path: path
    })
  }

  const chooseEnnemy = (unit, ennemies) => {
    let bestEnnemy, bestEnnemyValue = 10000 // the lesser the better
    for (const ennemy of ennemies) {
      // Manhattan distance (attack the closer)
      const distance = HEXLIB.hexDistance(unit.hex, ennemy.hex)
      // Ennemy health (attack the weakest)
      const health = ennemy.health

      // Hysterersis!
      // const value = health * 2 + distance * 4
      const value = health

      if (value < bestEnnemyValue) {
        bestEnnemyValue = value
        bestEnnemy = ennemy
      }

      return bestEnnemy
    }
  }

  const botBuildUnits = async (player) => {

    // Get the player's buildings that can build
    let playerBuildings = game.getBuildingsByPlayer(player).filter(
      // let playerBuildings = game.map.data.buildings.filter(
      (building) => 
      (
        building.type === 'factory' || 
        building.type === 'port' || 
        building.type === 'airport'
      ) && !building.hasBuilt
    )

    if (playerBuildings.length) {

      // Randomize the order of buildings
      playerBuildings = arrayShuffle(playerBuildings)

      const infantryTypes = ['soldier', 'bazooka', 'healer']
      const tankTypes = ['jeep', 'tank', 'heavy-tank']
      const navalTypes = ['boat']
      const airTypes = ['helicopter', 'fighter', 'bomber']

      for (const playerBuilding of playerBuildings) {
        if (player.money >= 1000) { // miimal unit price (TODO)

          // CHOOSING UNIT TYPE
          let unitTypes = Object.keys(CONFIG.game.units)
          
          if (playerBuilding.type === 'factory') {

            // Too few buildings owned, build infantry first to conquer
            if (
              game.getBuildingsByPlayer(player).length < 5 || // max owned buildings
              // Count player's infantry units
              player.units.filter((unit) => (
                infantryTypes.indexOf(unit.type) !== -1
              )).length < 5 // max infantry units
            ) {
              unitTypes = infantryTypes
            } else {
              unitTypes = tankTypes
            }

          } else if (playerBuilding.type === 'port') {
            unitTypes = navalTypes            

          } else if (playerBuilding.type === 'airport') {
            unitTypes = airTypes
          }

          // Choose random unit type, the more expensive the better
          let nMaxTry = 10, minCost = 10000, unitType

          while (!unitType && nMaxTry > 0) {
            nMaxTry--
            const type = unitTypes[Math.floor(RNG() * unitTypes.length)],
                  cost = CONFIG.game.units[type].cost

            if (cost <= player.money && cost >= minCost) {
              unitType = type
            }
            minCost -= 1000 // Lower the desired price
          }
  
          if (unitType) {
            await game.ACTION_DO({
              type: 'BUILD_UNIT',
              player: player, 
              building: playerBuilding, 
              unitType: unitType
            })
          }
        }
      }
    }
  }

  return bot
}

export default GameBot