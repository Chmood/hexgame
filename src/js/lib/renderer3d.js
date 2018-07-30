import BABYLON from 'babylonjs'
import HEXLIB from '../vendor/hexlib.js'
import CONFIG_RENDER_3D from '../config/render3d'

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
  const CONFIG_MAP = game.CONFIG.map,
        CONFIG_PLAYERS = game.CONFIG.players

  const map = game.map.data, // Only data, no calls to Map's functions should be made here
        // External modules
        camera = Camera(CONFIG_RENDER_3D, canvas, game), // game is overkill, map is enough
        highlight = Highlight(CONFIG_MAP),
        materials = Materials(CONFIG_MAP, CONFIG_RENDER_3D, CONFIG_PLAYERS),
        environement = Environement(CONFIG_MAP, CONFIG_RENDER_3D),
        postprocess = Postprocess(CONFIG_RENDER_3D),
        tiles = Tiles(CONFIG_MAP, CONFIG_RENDER_3D, map),
        units = Units(CONFIG_MAP, CONFIG_RENDER_3D, game, camera) // game is overkill, players is enough?
        
  const renderer = {

    ////////////////////////////////////////
    // MODULES PUBLIC METHODS
    // Those functions can be called from outside the renderer (game, dom-ui...)

    // Camera
    updateCameraPosition: camera.updateCameraPosition,
    getActiveCamera: camera.getActiveCamera,
    setCameraFreeControls : camera.setCameraFreeControls,
    // setActiveCamera: camera.setActiveCamera,
    setActiveCamera(cameraName) {
      camera.setActiveCamera(cameraName)
      postprocess.updatePosprocessPipeline(undefined, camera.getActiveCamera().camera)
    },
    setCameraFreeAutorotate: camera.setCameraFreeAutorotate,
    getCameraFreeAutorotate: camera.getCameraFreeAutorotate,
    updateCameraZoom: camera.updateCameraZoom,
    updateCameraAlpha: camera.updateCameraAlpha,
  
    // Highlight
    updateHighlights: highlight.updateHighlights,
  
    // Postprocess
    updatePosprocessPipeline: postprocess.updatePosprocessPipeline,
  
    // Environement
    updateOcean: environement.updateOcean,
    addToOceanRenderList: environement.addToOceanRenderList,
  
    // Tiles
    randomizeTileDispSets: tiles.randomizeTileDispSets,
    createTiles: tiles.createTiles,
    createBuildings: tiles.createBuildings,
    createTilesAndBuildings: tiles.createTilesAndBuildings,
    deleteTiles: tiles.deleteTiles,
    deleteBuildings: tiles.deleteBuildings,
    deleteTilesAndBuildings: tiles.deleteTilesAndBuildings,
    changeBuildingColor: tiles.changeBuildingColor,
  
    // Units
    createUnits: units.createUnits,
    // createUnit: units.createUnit, // Not used by now
    deleteUnits: units.deleteUnits,
    deleteUnit: units.deleteUnit,
    moveUnitOnPath: units.moveUnitOnPath,
    teleportUnit: units.teleportUnit,
    attackUnit: units.attackUnit,
    destroyUnit: units.destroyUnit,
    buildUnit: units.buildUnit,
    conquerBuilding: units.conquerBuilding,
    updateHealthbar: units.updateHealthbar,
    changeUnitMaterial: units.changeUnitMaterial,

    // Materials
    updatePlayersColor: materials.updatePlayersColor,

    ////////////////////////////////////////
    // RENDERER PUBLIC METHODS
  
    // RESIZE ENGINE
    resizeEngine() {
      engine.resize()
    },
  
    // PLOT CURSOR
    // Mouse position plotting
    plotCursor() {
      // We try to pick an object
      const pick = scene.pick(scene.pointerX, scene.pointerY)
      if (pick.hit) {
        if (pick.pickedMesh) {
          const idFragments = pick.pickedMesh.id.split('-'),
                x = parseInt(idFragments[1]),
                y = parseInt(idFragments[2]),
                cursorOffset = HEXLIB.hexOffset(x, y),
                cursorHex = HEXLIB.offset2Hex(cursorOffset, CONFIG_MAP.mapTopped, CONFIG_MAP.mapParity)
          return cursorHex
        }
      }
    },
  
    // INIT UPDATE LOOP
    // Lockstepped function that run before render
    initUpdateLoop() {
      scene.onBeforeStepObservable.add((scene) => {
        // console.log('Performing game logic, BEFORE animations and physics for stepId: ' + scene.getStepId());
  
        // const fps = Math.floor(engine.getFps())
        // console.log(fps + ' FPS')
  
        if (camera.getCameraFreeAutorotate()) {
          // Make the camera rotate around the island
          camera.cameraFree.alpha += 0.002
        }
      })
    },
  
    // START RENDER LOOP
    // Will be fired later
    startRenderLoop() {
      // Register a render loop to repeatedly render the scene
      engine.runRenderLoop(() => {
        scene.render()
      })
    }
  }  

  ////////////////////////////////////////
  // PRIVATE
  let layout, engine, scene

  // CREATE LAYOUT
  const createLayout = () => {
    return HEXLIB.layout(
      CONFIG_MAP.mapTopped ? HEXLIB.orientationFlat : HEXLIB.orientationPointy, // topped
      {
        // cell size in px
        x: CONFIG_RENDER_3D.cellSize,
        y: CONFIG_RENDER_3D.cellSize
      },
      {
        // Origin
        // TODO: auto centering map
        x: -CONFIG_RENDER_3D.cellSize * CONFIG_MAP.mapSize.width * Math.sqrt(2) / 2,
        y: -CONFIG_RENDER_3D.cellSize * CONFIG_MAP.mapSize.height * Math.sqrt(3) / 2
      }
    )
  }

  ////////////////////////////////////////
  // INIT
  // Creates all the Babylon magic!
    
  // BABYLON BASE
  // Layout, engine and scene
  layout = createLayout()

  engine = new BABYLON.Engine(canvas, true, {
    deterministicLockstep: true,
    lockstepMaxSteps: 4
  })

  scene = new BABYLON.Scene(engine)

  // INIT MODULES

  // Camera
  camera.init(scene, layout)

  // Highlight layers
  // Last parameter is the number of highlight layers
  highlight.init(scene, game.ui, map, 3, game)

  // Materials
  renderer.materials = materials.createMaterials()

  // Environement
  environement.init(scene, renderer.materials, game.players, map)

  // Post-process
  postprocess.init(scene, camera.camera, camera.cameraFree)

  // Tiles
  tiles.init(scene, layout, renderer.materials, environement.shadowGenerator, game.buildings)

  // Units
  units.init(scene, layout, renderer.materials, environement.shadowGenerator)

  // Asset manager
  // TODO: figure out how this thing works with Webpack
  // See: https://doc.babylonjs.com/how_to/how_to_use_assetsmanager
  renderer.assetsManager = new BABYLON.AssetsManager(scene)

  const imageTask1 = renderer.assetsManager.addImageTask('img1', img1)
  const imageTask2 = renderer.assetsManager.addImageTask('img2', img2)
  const imageTask3 = renderer.assetsManager.addImageTask('img3', img3)
  const imageTask4 = renderer.assetsManager.addImageTask('img4', img4)
  const imageTask5 = renderer.assetsManager.addImageTask('img5', img5)
  const imageTask6 = renderer.assetsManager.addImageTask('img6', img6)

  renderer.assetsManager.onProgress = function(remainingCount, totalCount, lastFinishedTask) {
    engine.loadingUIText = `Loading ${lastFinishedTask.url}: ${totalCount - remainingCount}/${totalCount} items`
  }
  renderer.assetsManager.onFinish = function (tasks) {
    renderer.initUpdateLoop()
    renderer.startRenderLoop()
    // console.warn('ASSETS LOADED!', tasks)
  }

  renderer.assetsManager.load()

  // Freeze the active meshes
  // TODO: seems too agressive, maybe use it with mesh.alwaysSelectAsActiveMesh = true
  // scene.freezeActiveMeshes()

  // // ACTION MANAGER
  // // Clean way to capture keyboard event, but requires the canvas to have focus
  // renderer.keys = {} //object for multiple key presses
  // scene.actionManager = new BABYLON.ActionManager(scene)
  
  // scene.actionManager.registerAction(
  //   new BABYLON.ExecuteCodeAction(
  //     BABYLON.ActionManager.OnKeyDownTrigger, 
  //     (event) => { renderer.keys[event.sourceEvent.key] = event.sourceEvent.type === "keydown" }
  //   )
  // )
  // scene.actionManager.registerAction(
  //   new BABYLON.ExecuteCodeAction(
  //     BABYLON.ActionManager.OnKeyUpTrigger,
  //     (event) => { renderer.keys[event.sourceEvent.key] = event.sourceEvent.type === "keydown" }
  //   )
  // )

  return renderer
}

export default Renderer3d