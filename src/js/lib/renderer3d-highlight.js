import BABYLON from 'babylonjs'
import HEXLIB from '../vendor/hexlib.js'
import CONFIG from './config.js'

////////////////////////////////////////////////////////////////////////////////
// RENDERER 3D HIGHLIGHT

const Highlight = () => {

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
    // Path line
    highlightLine(ui.line, BABYLON.Color3.Red(), 2)
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
  let scene, ui, map

  const highlightLayer = [],
        highlightMeshes = []

  // HIGHTLIGHT TILE
  const hightlightTile = (hex, color = BABYLON.Color3.White(), n = 0) => {
    const offset = HEXLIB.hex2Offset(
            hex, 
            CONFIG.map.mapTopped, 
            CONFIG.map.mapParity
          )

    // Sanitize inputs
    if (offset.col !== undefined && offset.row !== undefined && 
        offset.col >= 0 && offset.row >= 0 &&
        offset.col < CONFIG.map.mapSize.width && offset.row < CONFIG.map.mapSize.height
      ) {
      // Add to layer
      highlightMeshes[n].push({
        mesh: map[offset.col][offset.row].tile,
        color: color
      })
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
  // Will be firead later (when scene will be ready)
  renderer.init = (rendererScene, gameUI, gameMap, nHightlighLayers) => {
    scene = rendererScene
    ui = gameUI
    map = gameMap

    // Create game highlights
    for (let n = 0; n < nHightlighLayers; n++) {
      highlightLayer[n] = createHighlightLayer(`highlightLayer${n}`)
      highlightMeshes[n] = []
    }
  }

  return renderer
}

export default Highlight