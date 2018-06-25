import CONFIG from './config'
import HEXLIB from '../vendor/hexlib'

////////////////////////////////////////////////////////////////////////////////
// BULDINGS

const Buildings = (map, RNG) => {

  ////////////////////////////////////////
  // PUBLIC
  const buildings = [],
        buildingType = ['base', 'city', 'factory', 'port', 'airport'],
        startingZoneRatio = CONFIG.game.playerStartingZoneRatio * 0.66,
        occupiedhexes = [] // Hexes already taken by buildings

  // SET BUILDING RANDOM POSITION
  const setBuildingRandomPosition = (type, playerId) => {
    const building = {
      type: type,
      ownerId: playerId
    }
    let isValidPosition = false,
        nTryLeft = 10

    while (!isValidPosition) {
      nTryLeft--
      if (nTryLeft === 0) {
        return false
      }

      let col, row
      const randomCol = RNG(),
        randomRow = RNG(),
        colStart = Math.floor(CONFIG.map.mapSize.width * randomCol / startingZoneRatio),
        rowStart = Math.floor(CONFIG.map.mapSize.height * randomRow / startingZoneRatio),
        colEnd = Math.floor(CONFIG.map.mapSize.width * (1 - randomCol / startingZoneRatio)),
        rowEnd = Math.floor(CONFIG.map.mapSize.height * (1 - randomRow / startingZoneRatio))
  
      if (playerId === 0) {
        col = colStart // left
        row = rowEnd //bottom
      } else if (playerId === 1) {
        col = colEnd // right
        row = rowStart // top
      } else if (playerId === 2) {
        col = colEnd // right
        row = rowEnd // bottom
      } else if (playerId === 3) {
        col = colStart // left
        row = rowStart // top
      }
      
      building.hexOffset = HEXLIB.hexOffset(col, row)
      building.hex = HEXLIB.offset2Hex(building.hexOffset, CONFIG.map.mapTopped, CONFIG.map.mapParity)
  
      // Check if the building position is a valid biome cell
      const isValidBiome = map.isValidBiome(
        map.getCellFromHex(building.hex).biome,
        CONFIG.game.buildings[type].biomes
      )

      // Check if the building position is not already occupied by another building
      let isFreeHex = true
      for (const hex of occupiedhexes) {
        if (HEXLIB.hexEqual(hex, building.hex)) {
          isFreeHex = false
          break
        }
      }

      isValidPosition = isValidBiome && isFreeHex
    }

    buildings.push(building)
    occupiedhexes.push(building.hex)

    return true
  }

  let nBuildingsPlaced = 0
  for (const type of buildingType) {
    for (const player of CONFIG.players) {
      for (let n = 0; n < CONFIG.game.buildings[type].number; n++) {

        const isBuildingPlaced = setBuildingRandomPosition(type, player.id)
        if (isBuildingPlaced) {
          nBuildingsPlaced++
        } else {
          console.log(`Buildings placed: ${nBuildingsPlaced}`)
          console.log(`Building #${nBuildingsPlaced + 1} can't be placed!`)
          return false
        }
      }
    }
  }

  return buildings
}

export default Buildings
