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
  renderer.createTiles = () => {
    for (let x = 0; x < CONFIG.map.mapSize.width; x++) {
      for (let y = 0; y < CONFIG.map.mapSize.height; y++) {
        map[x][y].tile = createTile(x, y, map[x][y])
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
  let scene, layout, materials, shadowGenerator

  // GET HEXAPRISM VERTEX DATA
  const getHexaprismVertexData = (hex, topHeight, bottomHeight = 0, topScaling = 1, bottomScaling = 1) => {
    const cornersTop = HEXLIB.hexCorners(layout, hex, CONFIG.render3d.cellSize * topScaling),
          cornersBottom = HEXLIB.hexCorners(layout, hex, CONFIG.render3d.cellSize * bottomScaling)
          // cornersBottom = cornersTop // Same size

    const getRandomDisp = () => (Math.random() - CONFIG.render3d.randomTileSizeOffset) * 2 * CONFIG.render3d.randomTileSizeFactor

    // HACK: Reverse x and y for render
    // map X axis => world Z axis
    // map Y axis => world X axis
    const positions = []
    // top
    for(let c = 0; c < 6; c++) {
      positions.push(
        cornersTop[c].y + getRandomDisp(), // X
        topHeight * CONFIG.render3d.cellStepHeight, // Y
        cornersTop[c].x + getRandomDisp() // Z
      )
    }
    // bottom (base)
    for(let c = 0; c < 6; c++) {
      positions.push(
        cornersBottom[c].y + getRandomDisp(), // X
        bottomHeight * CONFIG.render3d.cellStepHeight, // Y
        cornersBottom[c].x + getRandomDisp() // Z
      )
    }
    const indices = [
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

    const vertexData = new BABYLON.VertexData()
    vertexData.positions = positions
    vertexData.indices = indices

    return vertexData
  }

  // CREATE TILE
  const createTile = (x, y, cell) => {
    const offset = HEXLIB.hexOffset(x, y),
          hex = HEXLIB.offset2Hex(
            offset,
            CONFIG.map.mapTopped,
            CONFIG.map.mapParity
          ),
          position = HEXLIB.hex2Pixel(layout, hex), // center of tile top
          tile = new BABYLON.Mesh(`tile-${x}-${y}`, scene),
          height = cell.height

    // BUILD MESH
    const vertexData = getHexaprismVertexData(
      hex, 
      // TODO: why the fuck is this +0.2 needed for the units to stick to the floor?!?!
      (height + 0.3), 
      0, 
      1, 
      1.25
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
    
    return tile
  }

  ////////////////////////////////////////
  // INIT
  renderer.init = (rendererScene, rendererLayout, rendererMaterials, environementShadowGenerator) => {
    scene = rendererScene
    layout = rendererLayout
    materials = rendererMaterials
    shadowGenerator = environementShadowGenerator
  }

  return renderer
}

export default Tiles
