import BABYLON from 'babylonjs'
import HEXLIB from '../vendor/hexlib.js'
import CONFIG from './config.js'

////////////////////////////////////////////////////////////////////////////////
// RENDERER 3D TILES

const Tiles = (map) => {

  const renderer = {}

  ////////////////////////////////////////
  // PUBLIC

  // CREATE TILES
  renderer.createTiles = (gameBuildings) => {
    buildings = gameBuildings
    console.warn('BULDINGS IN TILES', buildings)

    for (let x = 0; x < CONFIG.map.mapSize.width; x++) {
      for (let y = 0; y < CONFIG.map.mapSize.height; y++) {
        const cell = map[x][y]

        // BULDINGS
        // Is there a building on this tile?
        let gameBuilding
        for (const building of buildings) {
          if (HEXLIB.hexEqual(building.hex, cell.hex)) {
            gameBuilding = building
            break
          }
        }

        const tileAndBuilding = createTileAndBuilding(x, y, cell, gameBuilding)
        map[x][y].tile = tileAndBuilding.tile
        map[x][y].building = tileAndBuilding.building
      }
    }
  }

  // DELETE TILES
  renderer.deleteTiles = () => {
    for (let x = 0; x < CONFIG.map.mapSize.width; x++) {
      for (let y = 0; y < CONFIG.map.mapSize.height; y++) {
        if (map[x][y] && map[x][y].tile) {
          map[x][y].tile.dispose()
        }
      }
    }
  }

  // REDISTRIBUTE ELEVATION WITH GAP
  // TODO: rewrite all this crap! (not used by now)
  renderer.redistributeElevationWithGap = (height) => {
    // Increase height gap between lower land & higher sea tiles
    if (
      height > CONFIG.map.mapSeaMinLevel &&
      height < CONFIG.map.mapSeaMinLevel + 1
    ) {
      height = CONFIG.map.mapSeaMinLevel +
        (height - CONFIG.map.mapSeaMinLevel) * 3 / 4
    } else if (
      height > CONFIG.map.mapSeaMinLevel + 1 &&
      height < CONFIG.map.mapSeaMinLevel + 2
    ) {
      height = (CONFIG.map.mapSeaMinLevel + 1) + 0.25 +
        (height - (CONFIG.map.mapSeaMinLevel + 1)) * 3 / 4
    }
    return height
  }

  ////////////////////////////////////////
  // PRIVATE
  let scene, layout, materials, shadowGenerator, buildings

  // GET RANDOM DISP
  const getRandomDisp = () => (Math.random() - CONFIG.render3d.randomTileSizeOffset) * 2 * CONFIG.render3d.randomTileSizeFactor

  // GET RANDOM DISP SETS
  // One set is 6 random displacement Vector3
  const getRandomDispSets = (nSets) => {
    const sets = []
    for (let n = 0; n < nSets; n++) {
      sets[n] = []
      for(let c = 0; c < 6; c++) {
        sets[n][c] = new BABYLON.Vector3(
          getRandomDisp(),
          getRandomDisp(),
          getRandomDisp()
        )
      }
    }

    return sets
  }

  // GET HEXAPRISM VERTEX DATA
  const getHexaprismVertexData = (
    hex, 
    topHeight, 
    bottomHeight = 0, 
    topScaling = 1, 
    bottomScaling = 1,
    randomDispSets,
    type = 'tile'
  ) => {
    const cornersTop = HEXLIB.hexCorners(layout, hex, CONFIG.render3d.cellSize * topScaling),
          cornersBottom = HEXLIB.hexCorners(layout, hex, CONFIG.render3d.cellSize * bottomScaling)
          // cornersBottom = cornersTop // Same size


    // HACK: 
    // map X axis (width) => world Z axis
    // map Y axis (height) => world X axis
    // map Z axis (elevation) => world Y axis
    const positions = []

    if (type === 'tile') {
      // TILE
      // top
      for(let c = 0; c < 6; c++) {
        positions.push(
          cornersTop[c].y + randomDispSets[0][c].y, // X
          topHeight * CONFIG.render3d.cellStepHeight, // Y
          cornersTop[c].x + randomDispSets[0][c].x // Z
        )
      }
      // bottom
      for(let c = 0; c < 6; c++) {
        positions.push(
          cornersBottom[c].y + randomDispSets[1][c].y, // X
          bottomHeight * CONFIG.render3d.cellStepHeight, // Y
          cornersBottom[c].x + randomDispSets[1][c].x // Z
        )
      }
    } else {
      // BULDINGS
      const innerRatio = 0.8,
            cornersTopInner = HEXLIB.hexCorners(layout, hex, CONFIG.render3d.cellSize * topScaling * innerRatio),
            cornersBottomInner = HEXLIB.hexCorners(layout, hex, CONFIG.render3d.cellSize * bottomScaling * innerRatio)
      // top
      for(let c = 0; c < 6; c++) {
        positions.push(
          cornersTop[c].y + randomDispSets[0][c].y, // X
          topHeight * CONFIG.render3d.cellStepHeight, // Y
          cornersTop[c].x + randomDispSets[0][c].x // Z
        )
      }
      // bottom
      for(let c = 0; c < 6; c++) {
        positions.push(
          cornersBottom[c].y + randomDispSets[0][c].y, // X
          bottomHeight * CONFIG.render3d.cellStepHeight, // Y
          cornersBottom[c].x + randomDispSets[0][c].x // Z
        )
      }
      // top inner
      for(let c = 0; c < 6; c++) {
        positions.push(
          cornersTopInner[c].y + randomDispSets[0][c].y, // X
          topHeight * CONFIG.render3d.cellStepHeight, // Y
          cornersTopInner[c].x + randomDispSets[0][c].x // Z
        )
      }
      // bottom inner
      for(let c = 0; c < 6; c++) {
        positions.push(
          cornersBottomInner[c].y + randomDispSets[0][c].y, // X
          bottomHeight * CONFIG.render3d.cellStepHeight, // Y
          cornersBottomInner[c].x + randomDispSets[0][c].x // Z
        )
      }
    }

    let indices
    if (type === 'tile') {
      indices = [
        // Top
        0, 2, 1,
        0, 3, 2,
        0, 4, 3,
        0, 5, 4,
  
        // Sides
        0, 1, 6,
        7, 6, 1,
        1, 2, 7,
        8, 7, 2,
        2, 3, 8,
        9, 8, 3,
        3, 4, 9,
        10, 9, 4,
        4, 5, 10,
        11, 10, 5,
        5, 6, 11,
        0, 6, 5
  
        // TODO: Bottom facets (when needed)
      ]
    } else {
      indices = [
        // Inner bottom
        // 18, 20, 19,
        // 18, 21, 20,
        // 18, 22, 21,
        // 18, 23, 22,
  
        // Outer sides
        0, 1, 6,
        7, 6, 1,
        1, 2, 7,
        8, 7, 2,
        2, 3, 8,
        9, 8, 3,
        3, 4, 9,
        10, 9, 4,
        4, 5, 10,
        11, 10, 5,
        5, 6, 11,
        0, 6, 5,
  
        // Inner sides
        12, 18, 13,
        13, 18, 19,
        13, 19, 14,
        20, 14, 19,
        14, 20, 15,
        21, 15, 20,
        15, 21, 16,
        22, 16, 21,
        16, 22, 17,
        23, 17, 22,
        17, 23, 18,
        12, 17, 18,

        // Top sides
        0, 12, 1,
        1, 12, 13,
        1, 13, 2,
        2, 13, 14,
        2, 14, 3,
        3, 14, 15,
        3, 15, 4,
        4, 15, 16,
        4, 16, 5,
        5, 16, 17,
        5, 17, 0,
        0, 17, 12,
      ]
    }

    const vertexData = new BABYLON.VertexData()
    vertexData.positions = positions
    vertexData.indices = indices

    return vertexData
  }

  // CREATE TILE
  const createTileAndBuilding = (x, y, cell, gameBuilding) => {
    const offset = HEXLIB.hexOffset(x, y),
          hex = HEXLIB.offset2Hex(
            offset,
            CONFIG.map.mapTopped,
            CONFIG.map.mapParity
          ),
          position = HEXLIB.hex2Pixel(layout, hex), // center of tile top
          tile = new BABYLON.Mesh(`tile-${x}-${y}`, scene),
          height = cell.height,
          randomDispSets = getRandomDispSets(4)

    // BUILD MESH
    const vertexData = getHexaprismVertexData(
      hex, 
      // TODO: why the fuck is this +0.2 needed for the units to stick to the floor?!?!
      (height + 0.3), // top height
      0, // bottom height
      1, // top scaling
      1.25, // bottom scaling
      randomDispSets,
      'tile'
    )
    vertexData.applyToMesh(tile)

    // ROTATION
    // Set pivot (local center for transformations)
    tile.setPivotPoint(new BABYLON.Vector3(position.y, height * CONFIG.render3d.cellStepHeight, position.x))
    // Random rotation
    if (CONFIG.render3d.randomTileRotation) {
      tile.rotation = new BABYLON.Vector3(
        (Math.random() - 0.5) * 2 * Math.PI / 16 * CONFIG.render3d.randomTileRotationFactor, 
        0, 
        (Math.random() - 0.5) * 2 * Math.PI / 16 * CONFIG.render3d.randomTileRotationFactor
      )
    }

    // MATERIAL
    // Give the tile mesh a material
    tile.material = materials[cell.biome]
    // Make and receive shadows
    shadowGenerator.getShadowMap().renderList.push(tile)
    tile.receiveShadows = true;

    tile.freezeWorldMatrix()
 
    ////////////////////////////////////////
    // BULDING
    let building
    if (gameBuilding) {
      building = new BABYLON.Mesh(`building-${gameBuilding.type}-${x}-${y}`, scene)
      const buildingHeight = 1
      const buildingVertexData = getHexaprismVertexData(
        hex, 
        // TODO: why the fuck is this +0.2 needed for the units to stick to the floor?!?!
        (height + 0.3 + buildingHeight), // top height
        (height + 0.3), // bottom height
        1, // top scaling
        1, // bottom scaling
        randomDispSets,
        gameBuilding.type
      )
      buildingVertexData.applyToMesh(building)

      // ROTATION
      // Set pivot (local center for transformations)
      building.setPivotPoint(new BABYLON.Vector3(position.y, height * CONFIG.render3d.cellStepHeight, position.x))
      // Same rotation as the tile below it
      if (CONFIG.render3d.randomTileRotation) {
        building.rotation = tile.rotation
      }

      // MATERIAL
      // Give the tile mesh a material
      // building.material = materials['buildingGreyLight']
      building.material = materials.players[gameBuilding.ownerId][0]
      // Make and receive shadows
      shadowGenerator.getShadowMap().renderList.push(building)
      building.receiveShadows = true;

      building.freezeWorldMatrix()
    }

    return {tile, building}
  }

  // CREATE BUILDING
  const createBuilding = () => {

  }

  ////////////////////////////////////////
  // INIT
  renderer.init = (
    rendererScene, 
    rendererLayout, 
    rendererMaterials, 
    environementShadowGenerator
  ) => {
    scene = rendererScene
    layout = rendererLayout
    materials = rendererMaterials
    shadowGenerator = environementShadowGenerator
  }

  return renderer
}

export default Tiles
