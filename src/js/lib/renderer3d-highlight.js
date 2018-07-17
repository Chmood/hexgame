import BABYLON from 'babylonjs'
import HEXLIB from '../vendor/hexlib.js'

////////////////////////////////////////////////////////////////////////////////
// RENDERER 3D HIGHLIGHT

const Highlight = (CONFIG_MAP) => {

  const renderer = {}

  ////////////////////////////////////////
  // PUBLIC

  // UPDATE HIGHLIGHTS
  renderer.updateHighlights = () => {
    // Clear all highlights
    for (let n = 0; n < highlightMeshes.length; n++) {
      for (const mesh of highlightMeshes[n]) {
        highlightLayer[n].removeMesh(mesh.mesh)
      }
      highlightMeshes[n] = []
    }
    
    // Attack zone
    for (const hex of ui.attackZone) {
      hightlightTile(hex, BABYLON.Color3.Red(), 0)
    }
    // Move zone
    for (const hex of ui.moveZone) {
      hightlightTile(hex, BABYLON.Color3.White(), 1)
    }
    // Cursor line
    highlightLine(ui.cursorPath, BABYLON.Color3.Blue(), 2)
    // Cursor tile
    hightlightTile(ui.cursor, BABYLON.Color3.Blue(), 2)

    // Add selected meshes to highlight layer
    for (let n = 0; n < highlightMeshes.length; n++) {
      for (let mesh of highlightMeshes[n]) {
        highlightLayer[n].addMesh(mesh.mesh, mesh.color)
      }
    }
  }

  ////////////////////////////////////////
  // PRIVATE
  let scene, ui, map, game

  const highlightLayer = [],
        highlightMeshes = []

  // HIGHTLIGHT TILE
  const hightlightTile = (hex, color = BABYLON.Color3.White(), n = 0) => {
    const offset = HEXLIB.hex2Offset(
            hex, 
            CONFIG_MAP.mapTopped, 
            CONFIG_MAP.mapParity
          )

    // Sanitize inputs
    if (offset.col !== undefined && offset.row !== undefined && 
        offset.col >= 0 && offset.row >= 0 &&
        offset.col < CONFIG_MAP.mapSize.width && offset.row < CONFIG_MAP.mapSize.height
      ) {
      // Add tile mesh to layer
      highlightMeshes[n].push({
        mesh: map.terrain[offset.col][offset.row].tile,
        color: color
      })

      // Is there a building on this tile?
      if (map.terrain[offset.col][offset.row].buildingMesh) {
        highlightMeshes[n].push({
          mesh: map.terrain[offset.col][offset.row].buildingMesh,
          color: color
        })
      }

      // Is there a unit on this tile?
      for (const player of game.players) {
        for (const unit of player.units) {
          if (HEXLIB.hexEqual(unit.hex, hex)) {
            // Loop on unit parts meshes
            for (const part in unit.meshes) {
              const mesh = unit.meshes[part]
              highlightMeshes[n].push({
                mesh: mesh,
                color: color
              })
            }
          }
        }
      }
    }
  }

  // HIGHLIGHT LINE
  const highlightLine = (line, color, n = 0) => {
    // Draw line tiles
    if (line) {
      for (let i = 0; i < line.length; i++) {
        hightlightTile(line[i], color, n)
      }
    }
  }

  // CREATE HIGHLIGHT LAYER
  const createHighlightLayer = (id) => {
    // Add the highlight layer
    const highlightLayer = new BABYLON.HighlightLayer(id, scene)
    highlightLayer.outerGlow = false
    return highlightLayer
  }

  ////////////////////////////////////////
  // INIT
  renderer.init = (rendererScene, gameUI, gameMap, nHightlighLayers, rendererGame) => {
    scene = rendererScene
    ui = gameUI
    map = gameMap
    game = rendererGame // TODO: So absurd to pass the whole Game here....

    // Create game highlights
    for (let n = 0; n < nHightlighLayers; n++) {
      highlightLayer[n] = createHighlightLayer(`highlightLayer${n}`)
      highlightMeshes[n] = []
    }
  }

  return renderer
}

export default Highlight