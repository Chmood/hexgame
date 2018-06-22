import BABYLON from 'babylonjs'
import HEXLIB from '../vendor/hexlib.js'
import CONFIG from './config.js'

import Camera from './renderer3d-camera'
import Highlight from './renderer3d-highlight'
import Materials from './renderer3d-materials'
import Postprocess from './renderer3d-postprocess'
import Environement from './renderer3d-environement'
import Tiles from './renderer3d-tiles'
import Units from './renderer3d-units'

import img1 from "../../img/TropicalSunnyDay_nx.jpg"
import img2 from "../../img/TropicalSunnyDay_ny.jpg"
import img3 from "../../img/TropicalSunnyDay_nz.jpg"
import img4 from "../../img/TropicalSunnyDay_px.jpg"
import img5 from "../../img/TropicalSunnyDay_py.jpg"
import img6 from "../../img/TropicalSunnyDay_pz.jpg"

////////////////////////////////////////////////////////////////////////////////
// RENDERER 3D

const Renderer3d = (game, canvas) => {
  const renderer = {},
        map = game.map.data,
        // External modules
        camera = Camera(canvas, game), // game is overkill, map is enough
        highlight = Highlight(),
        materials = Materials(),
        postprocess = Postprocess(),
        environement = Environement(),
        tiles = Tiles(map),
        units = Units(game, map, camera) // game is overkill, players is enough

  let layout

  ////////////////////////////////////////
  // MODULES PUBLIC METHODS
  // Those functions can be called from outside the renderer

  // Camera
  renderer.updateCameraPosition = camera.updateCameraPosition
  renderer.switchActiveCamera = () => {
    if (renderer.activeCamera === 'camera') {
      renderer.activeCamera = 'cameraFree'
    } else {
      renderer.activeCamera = 'camera'
    }
    camera.switchActiveCamera()
  }
  renderer.updateCameraZoom = camera.updateCameraZoom
  renderer.updateCameraAlpha = camera.updateCameraAlpha
  // Highlight
  renderer.updateHighlights = highlight.updateHighlights
  // Postprocess
  renderer.updatePosprocessPipeline = postprocess.updatePosprocessPipeline
  // Environement
  renderer.updateOcean = environement.updateOcean
  renderer.addToOceanRenderList = environement.addToOceanRenderList
  // Tiles
  renderer.createTiles = tiles.createTiles
  renderer.deleteTiles = tiles.deleteTiles
  // Units
  renderer.createUnits = units.createUnits
  renderer.createUnit = units.createUnit
  renderer.deleteUnits = units.deleteUnits
  renderer.deleteUnit = units.deleteUnit
  renderer.moveUnitOnPath = units.moveUnitOnPath
  renderer.attackUnit = units.attackUnit
  renderer.destroyUnit = units.destroyUnit
  renderer.updateHealthbar = units.updateHealthbar
  renderer.changeUnitMaterial = units.changeUnitMaterial

  ////////////////////////////////////////
  // BASE

  // CREATE LAYOUT
  const createLayout = () => {
    return HEXLIB.layout(
      CONFIG.map.mapTopped ? HEXLIB.orientationFlat : HEXLIB.orientationPointy, // topped
      {
        // cell size in px
        x: CONFIG.render3d.cellSize,
        y: CONFIG.render3d.cellSize
      },
      {
        // Origin
        // TODO: auto centering map
        x: -CONFIG.render3d.cellSize * CONFIG.map.mapSize.width * Math.sqrt(2) / 2,
        y: -CONFIG.render3d.cellSize * CONFIG.map.mapSize.height * Math.sqrt(3) / 2
      }
    )
  }

  ////////////////////////////////////////
  // PLOT CURSOR
  // Mouse position plotting
  renderer.plotCursor = () => {
    // We try to pick an object
  	const pick = renderer.scene.pick(renderer.scene.pointerX, renderer.scene.pointerY)
  	if (pick.hit) {
      if (pick.pickedMesh) {
        const idFragments = pick.pickedMesh.id.split('-'),
              x = parseInt(idFragments[1]),
              y = parseInt(idFragments[2]),
              cursorOffset = HEXLIB.hexOffset(x, y),
              cursorHex = HEXLIB.offset2Hex(cursorOffset, CONFIG.map.mapTopped, CONFIG.map.mapParity)
        return cursorHex
      }
  	}
  }

  ////////////////////////////////////////
  // INIT

  // INIT UPDATE LOOP
  // Lockstepped function that run before render
  renderer.initUpdateLoop = () => {
    renderer.scene.onBeforeStepObservable.add((scene) => {
      // console.log('Performing game logic, BEFORE animations and physics for stepId: ' + scene.getStepId());

      // Cheap debounce
      if (renderer.debounce > 0) {
        renderer.debounce--
      }
  
      // const fps = Math.floor(renderer.engine.getFps())
      // console.log(fps + ' FPS')

      if (CONFIG.render3d.cameraAutoRotate) {
        // Make the camera rotate around the island
        camera.cameraFree.alpha += 0.01
      }
    })
  }

  // START RENDER LOOP
  // Will be fired later
  renderer.startRenderLoop = () => {
    // Register a render loop to repeatedly render the scene
    renderer.engine.runRenderLoop(() => {
      renderer.scene.render()
    })
  }

  // INIT RENDERER
  // Creates all the Babylon magic!
    
  // Base
  layout = createLayout()

  renderer.engine = new BABYLON.Engine(canvas, true, {
    deterministicLockstep: true,
    lockstepMaxSteps: 4
  })
  renderer.scene = new BABYLON.Scene(renderer.engine)

  // Camera
  camera.init(renderer.scene, layout)
  renderer.scene.activeCamera = camera.camera
  renderer.activeCamera = 'camera'

  // Highlight layers
  // Last parameter is the number of highlight layers
  highlight.init(renderer.scene, game.ui, map, 3)

  // Materials
  renderer.materials = materials.createMaterials()

  // Environement
  environement.init(renderer.scene, renderer.materials, game.players, map)

  // Post-process
  postprocess.init(renderer.scene, camera.camera, camera.cameraFree)
  postprocess.updatePosprocessPipeline()

  // Tiles
  tiles.init(renderer.scene, layout, renderer.materials, environement.shadowGenerator)

  // Units
  units.init(renderer.scene, layout, renderer.materials, environement.shadowGenerator)

  // Debounce counter
  renderer.debounce = 0

  // Asset manager
  // TODO: figure out how this thing works
  // See: https://doc.babylonjs.com/how_to/how_to_use_assetsmanager
  renderer.assetsManager = new BABYLON.AssetsManager(renderer.scene)
  renderer.imageTask = renderer.assetsManager.addImageTask('img1', img1)
  renderer.imageTask = renderer.assetsManager.addImageTask('img2', img2)
  renderer.imageTask = renderer.assetsManager.addImageTask('img3', img3)
  renderer.imageTask = renderer.assetsManager.addImageTask('img4', img4)
  renderer.imageTask = renderer.assetsManager.addImageTask('img5', img5)
  renderer.imageTask = renderer.assetsManager.addImageTask('img6', img6)
  renderer.assetsManager.onFinish = function (tasks) {
    renderer.initUpdateLoop()
    renderer.startRenderLoop()
    // console.warn('ASSETS LOADED!', tasks)
  }
  renderer.assetsManager.load()

  // Freeze the active meshes
  // TODO: seems too agressive, maybe use it with mesh.alwaysSelectAsActiveMesh = true
  // renderer.scene.freezeActiveMeshes()

  // // ACTION MANAGER
  // // Clean way to capture keyboard event, but requires the canvas to have focus
  // renderer.keys = {} //object for multiple key presses
  // renderer.scene.actionManager = new BABYLON.ActionManager(renderer.scene)
  
  // renderer.scene.actionManager.registerAction(
  //   new BABYLON.ExecuteCodeAction(
  //     BABYLON.ActionManager.OnKeyDownTrigger, 
  //     (event) => { renderer.keys[event.sourceEvent.key] = event.sourceEvent.type === "keydown" }
  //   )
  // )
  // renderer.scene.actionManager.registerAction(
  //   new BABYLON.ExecuteCodeAction(
  //     BABYLON.ActionManager.OnKeyUpTrigger,
  //     (event) => { renderer.keys[event.sourceEvent.key] = event.sourceEvent.type === "keydown" }
  //   )
  // )

  return renderer
}

export default Renderer3d