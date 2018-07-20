import BABYLON from 'babylonjs'
import HEXLIB from '../vendor/hexlib.js'

////////////////////////////////////////////////////////////////////////////////
// RENDERER 3D TILES

const Tiles = (CONFIG_MAP, CONFIG_RENDER_3D, map) => {

  const renderer = {}

  ////////////////////////////////////////
  // PUBLIC

  // RANDOMIZE TILE DISP SETS
  // Create tiles and buildings
  renderer.randomizeTileDispSets = () => {

    for (let x = 0; x < CONFIG_MAP.mapSize.width; x++) {
      for (let y = 0; y < CONFIG_MAP.mapSize.height; y++) {
        // Get the cell
        const cell = map.terrain[x][y]

        cell.dispSets = getRandomDispSets(4)
      }
    }
  }

  // CREATE TILES
  renderer.createTiles = () => {

    for (let x = 0; x < CONFIG_MAP.mapSize.width; x++) {
      for (let y = 0; y < CONFIG_MAP.mapSize.height; y++) {
        // Get the cell
        const cell = map.terrain[x][y]

        const noTop = map.terrain[x][y].building && map.terrain[x][y].building.type !== 'port' ? true : false

        map.terrain[x][y].tile = createTile(x, y, cell, noTop)
      }
    }
  }

  // CREATE BUILDINGS
  renderer.createBuildings = () => {

    for (let x = 0; x < CONFIG_MAP.mapSize.width; x++) {
      for (let y = 0; y < CONFIG_MAP.mapSize.height; y++) {
        // Get the cell
        const cell = map.terrain[x][y]

        map.terrain[x][y].buildingMesh = createBuilding(x, y, cell, cell.building)
      }
    }
  }

  // CREATE TILES AND BUILDINGS
  renderer.createTilesAndBuildings = () => {
    renderer.createTiles()
    renderer.createBuildings()
  }

  // DELETE TILES
  renderer.deleteTiles = () => {

    for (let x = 0; x < CONFIG_MAP.mapSize.width; x++) {
      for (let y = 0; y < CONFIG_MAP.mapSize.height; y++) {

        if (map.terrain[x][y] && map.terrain[x][y].tile) {
          map.terrain[x][y].tile.dispose()
        }
      }
    }
  }

  // DELETE BUILDINGS
  renderer.deleteBuildings = () => {

    for (let x = 0; x < CONFIG_MAP.mapSize.width; x++) {
      for (let y = 0; y < CONFIG_MAP.mapSize.height; y++) {

        if (map.terrain[x][y] && map.terrain[x][y].buildingMesh) {
          map.terrain[x][y].buildingMesh.dispose()
        }
      }
    }
  }

  // DELETE TILES AND BUILDINGS
  renderer.deleteTilesAndBuildings = () => {
    renderer.deleteTiles()
    renderer.deleteBuildings()
  }

  // CHANGE BUILDING COLOR
  renderer.changeBuildingColor = (cell, playerId) => {
    cell.buildingMesh.material = materials.players[playerId][0]
  }

  // UPDATE BUILDINGS COLOR
  renderer.updateBuildingsColor = (cell, playerId) => {
    // cell.buildingMesh.material = materials.players[playerId][0]
  }

  // REDISTRIBUTE ELEVATION WITH GAP
  // TODO: rewrite all this crap! (not used by now)
  renderer.redistributeElevationWithGap = (height) => {
    // Increase height gap between lower land & higher sea tiles
    if (
      height > CONFIG_MAP.mapSeaMinLevel &&
      height < CONFIG_MAP.mapSeaMinLevel + 1
    ) {
      height = CONFIG_MAP.mapSeaMinLevel +
        (height - CONFIG_MAP.mapSeaMinLevel) * 3 / 4
    } else if (
      height > CONFIG_MAP.mapSeaMinLevel + 1 &&
      height < CONFIG_MAP.mapSeaMinLevel + 2
    ) {
      height = (CONFIG_MAP.mapSeaMinLevel + 1) + 0.25 +
        (height - (CONFIG_MAP.mapSeaMinLevel + 1)) * 3 / 4
    }
    return height
  }

  ////////////////////////////////////////
  // PRIVATE
  let scene, layout, materials, shadowGenerator, buildings

  // GET RANDOM DISP
  const getRandomDisp = () => (Math.random() - CONFIG_RENDER_3D.randomTileSizeOffset) * 2 * CONFIG_RENDER_3D.randomTileSizeFactor

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
    middleHeight = 0,
    bottomHeight = 0,
    topScaling = 1,
    middleScaling = 1,
    bottomScaling = 1,
    randomDispSets,
    type = 'tile',
    noTop = false
  ) => {
    const cornersTop = HEXLIB.hexCorners(layout, hex, CONFIG_RENDER_3D.cellSize * topScaling),
          cornersMiddle = HEXLIB.hexCorners(layout, hex, CONFIG_RENDER_3D.cellSize * middleScaling),
          cornersBottom = HEXLIB.hexCorners(layout, hex, CONFIG_RENDER_3D.cellSize * bottomScaling)

    // HACK: 
    // map X axis (width) => world Z axis
    // map Y axis (height) => world X axis
    // map Z axis (elevation) => world Y axis
    const positions = []

    if (type === 'tile') {
      // TILE
      // top outer (0 to 5)
      for(let c = 0; c < 6; c++) {
        positions.push(
          cornersTop[c].y + randomDispSets[0][c].y, // X
          topHeight * CONFIG_RENDER_3D.cellStepHeight, // Y
          cornersTop[c].x + randomDispSets[0][c].x // Z
        )
      }
      // bottom outer (6 to 11)
      for(let c = 0; c < 6; c++) {
        positions.push(
          cornersBottom[c].y + randomDispSets[1][c].y, // X
          bottomHeight * CONFIG_RENDER_3D.cellStepHeight, // Y
          cornersBottom[c].x + randomDispSets[1][c].x // Z
        )
      }
    } else {
      // BULDINGS
      const innerRatio = 0.8,
            cornersTopInner = HEXLIB.hexCorners(layout, hex, CONFIG_RENDER_3D.cellSize * topScaling * innerRatio),
            cornersMiddleInner = HEXLIB.hexCorners(layout, hex, CONFIG_RENDER_3D.cellSize * middleScaling * innerRatio),
            cornersBottomInner = HEXLIB.hexCorners(layout, hex, CONFIG_RENDER_3D.cellSize * bottomScaling * innerRatio)
      // top outer (0 to 5)
      for(let c = 0; c < 6; c++) {
        positions.push(
          cornersTop[c].y + randomDispSets[0][c].y, // X
          topHeight * CONFIG_RENDER_3D.cellStepHeight, // Y
          cornersTop[c].x + randomDispSets[0][c].x // Z
        )
      }
      // bottom outer (6 to 11)
      for(let c = 0; c < 6; c++) {
        positions.push(
          cornersBottom[c].y + randomDispSets[0][c].y, // X
          bottomHeight * CONFIG_RENDER_3D.cellStepHeight, // Y
          cornersBottom[c].x + randomDispSets[0][c].x // Z
        )
      }
      // middle outer (12 to 17) ///WIP
      for(let c = 0; c < 6; c++) {
        positions.push(
          cornersMiddle[c].y + randomDispSets[0][c].y, // X
          middleHeight * CONFIG_RENDER_3D.cellStepHeight, // Y
          cornersMiddle[c].x + randomDispSets[0][c].x // Z
        )
      }
      // top inner (18 to 23)
      for(let c = 0; c < 6; c++) {
        positions.push(
          cornersTopInner[c].y + randomDispSets[0][c].y, // X
          topHeight * CONFIG_RENDER_3D.cellStepHeight, // Y
          cornersTopInner[c].x + randomDispSets[0][c].x // Z
        )
      }
      // bottom inner (24 to 29)
      for(let c = 0; c < 6; c++) {
        positions.push(
          cornersBottomInner[c].y + randomDispSets[0][c].y, // X
          bottomHeight * CONFIG_RENDER_3D.cellStepHeight, // Y
          cornersBottomInner[c].x + randomDispSets[0][c].x // Z
        )
      }
      // middle inner (30 to 35) // WIP
      for(let c = 0; c < 6; c++) {
        positions.push(
          cornersMiddleInner[c].y + randomDispSets[0][c].y, // X
          middleHeight * CONFIG_RENDER_3D.cellStepHeight, // Y
          cornersMiddleInner[c].x + randomDispSets[0][c].x // Z
        )
      }
    }

    const 
    indicesOuterTopSide = [ // Closing exterior top hex side
      0, 2, 1,
      0, 3, 2,
      0, 4, 3,
      0, 5, 4
    ],
    indicesOuterSides = [ // Full height exterior
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
    ],
    indicesOuterSidesBottomToMiddle = [ // Lower half height exterior
      12, 13, 6,
      13, 7, 6,
      13, 14, 7,
      14, 8, 7,
      14, 15, 8,
      15, 9, 8,
      15, 16, 9,
      16, 10, 9,
      16, 17, 10,
      17, 11, 10,
      17, 12, 11,
      12, 6, 11
    ],
    indicesOuterSidesMiddleToTop = [ // Upper half height exterior
      0, 1, 12,
      13, 12, 1,
      1, 2, 13,
      14, 13, 2,
      2, 3, 14,
      15, 14, 3,
      3, 4, 15,
      16, 15, 4,
      4, 5, 16,
      17, 16, 5,
      5, 12, 17,
      0, 12, 5
    ],
    indicesInnerSidesBottomToMiddle = [ // Lower half height interior
      31, 30, 24,
      24, 25, 31,
      32, 31, 25,
      25, 26, 32,
      33, 32, 26,
      26, 27, 33,
      34, 33, 27,
      27, 28, 34,
      35, 34, 28,
      28, 29, 35,
      30, 35, 29,
      29, 24, 30
    ],
    indicesInnerSidesMiddleToTop = [ // Upper half height interior // TODO
    ],
    indicesInnerTopSide = [ // Closing interior top hex side
      18, 20, 19,
      18, 21, 20,
      18, 22, 21,
      18, 23, 22
    ],
    indicesInnerBottomSide = [ // Closing interior bottom hex side
      24, 26, 25,
      24, 27, 26,
      24, 28, 27,
      24, 29, 28
    ],
    indicesOuterBottomSide = [ // Closing exterior bottom hex side
      6, 8, 7,
      6, 9, 8,
      6, 10, 9,
      6, 11, 10
    ],
    indicesInnerToOuterSidesMiddle = [ // Middle closing walls
      13, 12, 30,
      30, 31, 13,
      14, 13, 31,
      31, 32, 14,
      15, 14, 32,
      32, 33, 15,
      16, 15, 33,
      33, 34, 16,
      17, 16, 34,
      34, 35, 17,
      12, 17, 35,
      35, 30, 12
    ]

    let indices = []

    if (type === 'tile') {
      indices = indices
      .concat(indicesOuterSides)

      if (!noTop) {
        indices = indices
        .concat(indicesOuterTopSide)
      }
    } else {
      // Buildings
      if (type === 'airport') {
        indices = indices
        .concat(indicesOuterBottomSide)
        .concat([
          15, 16, 9, // outer wall
          16, 10, 9,
          34, 33, 27, // inner wall
          27, 28, 34,
          15, 9, 33, // closing small walls
          9, 27, 33,
          16, 34, 10,
          10, 34, 28,
          34, 16, 33, // half roof
          3, 15, 33, // antenna small wall
          16, 15, 3, // antenna outer wall
          16, 3, 33 // antenna diagonal wall
        ])
      } else if (type === 'factory') {
        indices = indices
        .concat(indicesOuterBottomSide)
        .concat([
          // Bat 1 (full height)
          3, 4, 9, // outer wall
          4, 10, 9,
          22, 21, 27, // inner wall
          27, 28, 22,
          3, 9, 21, // closing small walls
          9, 27, 21,
          4, 22, 10,
          10, 22, 28,
          22, 4, 21, // roof
          21, 4, 3,

          // Bat 2
          17, 12, 11, // outer wall
          12, 6, 11,
          30, 35, 29, // inner wall
          29, 24, 30,
          17, 11, 35, // closing small walls
          11, 29, 35,
          12, 30, 6,
          6, 30, 24,
          30, 12, 35, // roof
          35, 12, 17,

          // Bat 3
          13, 14, 7, // outer wall
          14, 8, 7,
          32, 31, 25, // inner wall
          25, 26, 32,
          13, 7, 31, // closing small walls
          7, 25, 31,
          14, 32, 8,
          8, 32, 26,
          32, 14, 31, // roof
          31, 14, 13,
        ])
      } else if (type === 'base') {
        indices = indices
        .concat(indicesOuterSidesBottomToMiddle)
        .concat(indicesInnerSidesBottomToMiddle)
        .concat(indicesInnerBottomSide)
        .concat([
          13, 12, 30, // middle height roof
          30, 31, 13,
          14, 13, 1, // triangular outer wall
          31, 32, 19, // triangular inner wall
          1, 31, 19, // vertical upper wall
          13, 31, 1,
          1, 19, 14, // diagonal upper wall
          32, 14, 19,

          15, 14, 32, // middle height roof
          32, 33, 15,
          16, 15, 3, // triangular outer wall
          33, 34, 21, // triangular inner wall
          3, 33, 21, // vertical upper wall
          15, 33, 3,
          3, 21, 16, // diagonal upper wall
          34, 16, 21,

          17, 16, 34, // middle height roof
          34, 35, 17,
          12, 17, 5, // triangular outer wall
          35, 30, 23, // triangular inner wall
          5, 35, 23, // vertical upper wall
          17, 35, 5,
          5, 23, 12, // diagonal upper wall
          30, 12, 23,
        ])
      } else if (type === 'city' || type === 'port') {
        indices = indices
        .concat(indicesInnerToOuterSidesMiddle)
        .concat(indicesOuterSidesBottomToMiddle)
        .concat(indicesInnerSidesBottomToMiddle)
        
        if (type === 'city') {
          indices = indices
          .concat(indicesInnerBottomSide)
        }
      }
    }

    const vertexData = new BABYLON.VertexData()
    vertexData.positions = positions
    vertexData.indices = indices

    return vertexData
  }

  // CREATE TILE
  const createTile = (x, y, cell, noTop) => {
    const offset = HEXLIB.hexOffset(x, y),
          hex = HEXLIB.offset2Hex(
            offset,
            CONFIG_MAP.mapTopped,
            CONFIG_MAP.mapParity
          ),
          position = HEXLIB.hex2Pixel(layout, hex), // center of tile top
          tile = new BABYLON.Mesh(`tile-${x}-${y}`, scene),
          height = cell.height,
          randomDispSets = cell.dispSets

    // BUILD MESH
    const vertexData = getHexaprismVertexData(
      hex, 
      // TODO: why the fuck is this +0.2 needed for the units to stick to the floor?!?!
      (height + 0.3), // top height
      undefined, // middle height
      0, // bottom height
      undefined, // Middle scaling
      1, // top scaling
      1.125, // bottom scaling
      randomDispSets,
      'tile',
      noTop
      // gameBuilding && gameBuilding.type !== 'port' ? true : false // No tile top when a building is present
    )
    vertexData.applyToMesh(tile)

    // ROTATION
    // Set pivot (local center for transformations)
    tile.setPivotPoint(new BABYLON.Vector3(position.y, height * CONFIG_RENDER_3D.cellStepHeight, position.x))
    // Random rotation
    if (CONFIG_RENDER_3D.randomTileRotation) {
      tile.rotation = new BABYLON.Vector3(
        (Math.random() - 0.5) * 2 * Math.PI / 16 * CONFIG_RENDER_3D.randomTileRotationFactor, 
        0, 
        (Math.random() - 0.5) * 2 * Math.PI / 16 * CONFIG_RENDER_3D.randomTileRotationFactor
      )
    }

    // MATERIAL
    // Give the tile mesh a material
    tile.material = materials[cell.biome]
    // Make and receive shadows
    if (CONFIG_RENDER_3D.shadows) {
      shadowGenerator.getShadowMap().renderList.push(tile)
      tile.receiveShadows = true;
    }

    tile.freezeWorldMatrix()

    return tile
  }

  // CREATE BUILDING
  const createBuilding = (x, y, cell, gameBuilding) => {
    const offset = HEXLIB.hexOffset(x, y),
          hex = HEXLIB.offset2Hex(
            offset,
            CONFIG_MAP.mapTopped,
            CONFIG_MAP.mapParity
          ),
          position = HEXLIB.hex2Pixel(layout, hex), // center of tile top
          tile = cell.tile,
          height = cell.height,
          randomDispSets = cell.dispSets

    ////////////////////////////////////////
    // BULDING
    let building
    if (gameBuilding) {
      building = new BABYLON.Mesh(`building-${gameBuilding.type}-${x}-${y}`, scene)
      const buildingHeight = 1
      const buildingVertexData = getHexaprismVertexData(
        hex, 
        // TODO: why the fuck is this +0.2 needed for the units to stick to the floor?!?!
        (height + 0.3 + buildingHeight * 3), // top height
        (height + 0.3 + buildingHeight), // middle height
        (height + 0.3), // bottom height
        1, // top scaling
        1, // middle scaling
        1, // bottom scaling
        randomDispSets,
        gameBuilding.type
      )
      buildingVertexData.applyToMesh(building)

      // ROTATION
      // Set pivot (local center for transformations)
      building.setPivotPoint(new BABYLON.Vector3(position.y, height * CONFIG_RENDER_3D.cellStepHeight, position.x))
      // Same rotation as the tile below it
      if (CONFIG_RENDER_3D.randomTileRotation) {
        building.rotation = tile.rotation
      }

      // MATERIAL
      // Give the tile mesh a material
      if (gameBuilding.ownerId !== undefined) {
        building.material = materials.players[gameBuilding.ownerId][0]
      } else {
        building.material = materials['buildingGreyLight']
      }
      // Make and receive shadows
      if (CONFIG_RENDER_3D.shadows) {
        shadowGenerator.getShadowMap().renderList.push(building)
        building.receiveShadows = true;
      }
      // Not pickable by mouse
      building.isPickable = false

      building.freezeWorldMatrix()
    }

    return building
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
