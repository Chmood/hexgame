import BABYLON from 'babylonjs'
import HEXLIB from '../vendor/hexlib.js'
import CONFIG from './config.js'

import Camera from './renderer3d-camera'
import Highlight from './renderer3d-highlight'
import Materials from './renderer3d-materials'
import Postprocess from './renderer3d-postprocess'
import Environement from './renderer3d-environement'
import Tiles from './renderer3d-tiles'

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
        camera = Camera(canvas),
        highlight = Highlight(),
        materials = Materials(),
        postprocess = Postprocess(),
        environement = Environement(),
        tiles = Tiles(map)

  let layout

  ////////////////////////////////////////
  // MODULES PUBLIC METHODS
  // These can be called from outside the renderer

  // Camera
  renderer.updateCameraPosition = (hex) => {
    const position = HEXLIB.hex2Pixel(layout, hex),
          cell = game.map.getCellFromHex(hex)

    camera.updateCameraPosition(cell, position)
  }
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

  ////////////////////////////////////////
  // UNITS

  // CREATE MULTIPART UNIT
  renderer.createMultipartUnit = (name, idPlayer, idUnit, parentMesh, baseSize, parts) => {
    const meshes = []
    for (const part of parts) {
      // Create box mesh
      const p = BABYLON.MeshBuilder.CreateBox(
        `player-${idPlayer}-${name}-${idUnit}-${part.name}`, 
        {
          height: baseSize * part.size.height, // height
          width: baseSize * part.size.length, // length
          depth: baseSize * part.size.width // width
        }
      )
      // Position
      p.position = new BABYLON.Vector3(
        baseSize * part.position.x,
        baseSize * part.position.y,
        baseSize * part.position.z
      )
      // Parenting
      p.parent = parentMesh
      // Material
      p.material = part.material
      // Shadows
      environement.shadowGenerator.getShadowMap().renderList.push(p)
      p.receiveShadows = true

      if (part.dontColorize !== undefined) {
        p.dontColorize = part.dontColorize // Risky: add property to BABYLON.mesh
      }
      meshes[part.name] = p
    }
    return meshes
  }

  // UPDATE HEALTH BAR
  renderer.updateHealthbar = (unit) => {
    const healthbarUnitWidth = CONFIG.render3d.cellSize * CONFIG.render3d.healthbars.width,
          healthbarFrontWidth = unit.health * healthbarUnitWidth,
          healthbarBackWidth = unit.maxHealth * healthbarUnitWidth

    unit.meshes.healthbarFront.scaling.x = unit.health / unit.maxHealth
    unit.meshes.healthbarFront.position.x = -(healthbarBackWidth - healthbarFrontWidth) / 2
  }

  // CREATE UNIT
  renderer.createUnit = (unit, idPlayer, idUnit) => {
    const hex = unit.hex,
          position = HEXLIB.hex2Pixel(layout, hex), // center of tile top
          cellSize = CONFIG.render3d.cellSize,
          cell = map[unit.hexOffset.col][unit.hexOffset.row],
          cellHeight = cell.height,
          tile = cell.tile
    
    unit.meshes = [] // All the parts

    // PARENT MESH
    unit.mesh = BABYLON.MeshBuilder.CreateBox(
      `unit-${idUnit}`, {height: 0.01, width: 0.01, depth: 0.01}
    )

    // Position
    unit.mesh.position = new BABYLON.Vector3(
      position.y,
      cellHeight * CONFIG.render3d.cellStepHeight,
      position.x
    )
    // Rotation
    // Same rotation as the underneath tile
    unit.mesh.rotation = tile.rotation

    // HEALTH BAR
    const healthbarWidth = unit.maxHealth * cellSize * CONFIG.render3d.healthbars.width

    // Back of the bar
    unit.meshes.healthbarBack = BABYLON.MeshBuilder.CreatePlane(
      `unit-${idUnit}-healthbar-back`, 
      { width: healthbarWidth, height: cellSize * CONFIG.render3d.healthbars.height })
    unit.meshes.healthbarFront = BABYLON.MeshBuilder.CreatePlane(
      `unit-${idUnit}-healthbar-front`, 
      { width: healthbarWidth, height: cellSize * CONFIG.render3d.healthbars.height })

    // Bars position 
    unit.meshes.healthbarBack.position = new BABYLON.Vector3(
      0, CONFIG.render3d.healthbars.heightAbove * cellSize, 0
    )
    unit.meshes.healthbarFront.position = new BABYLON.Vector3(
      0, 0, -0.01 // Just a bit in front of the back of the bar
    )

    // Bars parenting
    unit.meshes.healthbarBack.parent = unit.mesh
    unit.meshes.healthbarFront.parent = unit.meshes.healthbarBack

    // Bars materials
    unit.meshes.healthbarBack.material = renderer.materials['healthbarBack']
    unit.meshes.healthbarFront.material = renderer.materials['healthbarFront']

    // Billboard mode (always face the camera)
    unit.meshes.healthbarBack.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL

    renderer.updateHealthbar(unit)

    ////////////////////////////////////////
    // PARTS MESHES
    unit.meshes.push(
      ...renderer.createMultipartUnit('tank', idPlayer, idUnit, unit.mesh, cellSize, [
        {
          name: 'base',
          size: {height: 1/6, length: 3/4, width: 1/2},
          position: {x: 0, y: 1/4, z: 0},
          material: renderer.materials.unitNeutral,
          dontColorize: true
        },
        {
          name: 'trackLeft',
          size: {height: 1/3, length: 1, width: 1/4},
          position: {x: 0, y: 1/4, z: 1/3},
          material: renderer.materials.players[idPlayer][0]
        },
        {
          name: 'trackRight',
          size: {height: 1/3, length: 1, width: 1/4},
          position: {x: 0, y: 1/4, z: -1/3},
          material: renderer.materials.players[idPlayer][0]
        },
        {
          name: 'body',
          size: {height: 1/4, length: 1/4, width: 1/4},
          position: {x: 0, y: 1/2, z: 0},
          material: renderer.materials.players[idPlayer][0]
        },
        {
          name: 'cannon',
          size: {height: 1/16, length: 1/2, width: 1/16},
          position: {x: -1/4, y: 1/2, z: 0},
          material: renderer.materials.players[idPlayer][0]
        }
      ])
    )
  }

  // CREATE UNITS
  renderer.createUnits = () => {
    for (const player of game.players) {
      for (const unit of player.units) {
        renderer.createUnit(unit, player.id, unit.id)
      }
    }
  }

  // DELETE UNIT
  renderer.deleteUnit = (unit) => {
    if (unit.mesh) {
      unit.mesh.dispose()
    }
    if (unit.meshes) {
      for (const mesh of unit.meshes) {
        mesh.dispose()
      }
    }
  }

  // DELETE UNITS
  renderer.deleteUnits = () => {
    if (game.players) {
      for (const player of game.players) {
        if (player.units) {
          for (const unit of player.units) {
            renderer.deleteUnit(unit)
          }
        }
      }
    }
  }

  // Easing 'standard' function
  const setEasing = (animation) => {
    const easingFunction = new BABYLON.SineEase()
    easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT)
    animation.setEasingFunction(easingFunction)
  }

  // ROTATE UNIT
  // Rotate a unit on itself, facing one the 6 directions
  // TODO: cleanup!
  renderer.rotateUnit = (unit, step, callback) => {
    const position = HEXLIB.hex2Pixel(layout, step),
          stepData = game.map.getCellFromHex(step),
          height = stepData.height * CONFIG.render3d.cellStepHeight,
          nextPosition = new BABYLON.Vector3( // end value
            position.y, // Axis inversion!
            height, 
            position.x // Axis inversion!
          )

    // Get the direction of the move
    const targetAngle = nextPosition.subtract(unit.mesh.position)
    const hypothenuse = CONFIG.render3d.cellSize * Math.sqrt(3) * 1.000001 // Avoid NaN
    let angle = Math.acos(-targetAngle.x / hypothenuse)
    if (targetAngle.z < 0) {
      angle *= -1
    }
    const deltaAngle = angle - unit.mesh.rotation.y + 0.00001
    const speed = 2 * Math.PI / Math.abs(deltaAngle)

    // ANIMATE ROTATION
    const animationPlayerRotation = new BABYLON.Animation(
      'unit.mesh',
      'rotation', 
      10, 
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3, 
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    )
    animationPlayerRotation.setKeys([
      { frame: 0, value: unit.mesh.rotation },
      { frame: 10, value: new BABYLON.Vector3(0, angle, 0) }
    ])
    setEasing(animationPlayerRotation)

    unit.mesh.animations = [animationPlayerRotation]

    return renderer.scene.beginAnimation(
      unit.mesh, // Target
      0, // Start frame
      10, // End frame
      false, // Loop (according to ANIMATIONLOOPMODE)
      speed * CONFIG.game.animationsSpeed // Speed ratio
    )
  }

  // MOVE UNIT
  // Move a unit to an adjacent tile
  // TODO: the rotation part seems fuxed up!?
  renderer.moveUnit = (unit, step, callback) => {
    const position = HEXLIB.hex2Pixel(layout, step),
          stepData = game.map.getCellFromHex(step),
          height = stepData.height * CONFIG.render3d.cellStepHeight,
          nextPosition = new BABYLON.Vector3( // end value
            position.y, // Axis inversion!
            height, 
            position.x // Axis inversion!
          ),
          nextRotation = stepData.tile.rotation

    // POSITION
    const animationPlayerPosition = new BABYLON.Animation(
      'unit.mesh',
      'position', 
      10, 
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3, 
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    )
    animationPlayerPosition.setKeys([
      { frame: 0, value: unit.mesh.position }, 
      { frame: 10, value: nextPosition }
    ])
    setEasing(animationPlayerPosition)

    // ROTATION
    const animationPlayerRotation = new BABYLON.Animation(
      'unit.mesh',
      'rotation', 
      10, 
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3, 
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    )
    animationPlayerRotation.setKeys([
      { frame: 0, value: unit.mesh.rotation }, 
      { frame: 10, value: new BABYLON.Vector3(
        nextRotation.x,
        unit.mesh.rotation.y,
        nextRotation.y
      )}
    ])
    setEasing(animationPlayerPosition)

    unit.mesh.animations = [animationPlayerPosition, animationPlayerRotation]

    return renderer.scene.beginAnimation(
      unit.mesh, // Target
      0, // Start frame
      10, // End frame
      false, // Loop (according to ANIMATIONLOOPMODE)
      3 * CONFIG.game.animationsSpeed // Speed ratio
    )
  }

  renderer.moveUnitOnePathStep = (unit, path) => {
    return new Promise(async (resolve) => {

      // Get the first step and remove it from the path
      const step = path.shift()
      unit.mesh.animations = []
      // Make the camera follow the moving unit
      renderer.updateCameraPosition(step)
  
      // Rotate the unit in the right direction
      const rotateUnit = renderer.rotateUnit(unit, step)
      await rotateUnit.waitAsync()
      // Move the unit to the adjacent tile
      const moveUnit = renderer.moveUnit(unit, step)
      await moveUnit.waitAsync()
      // Update unit's position
      unit.moveToHex(step, CONFIG.map.mapTopped, CONFIG.map.mapParity)

      resolve(path)
    })
  }

  renderer.moveUnitOnPath = (unit, path) => {
    return new Promise(async (resolve) => {

      if (path.length === 0) {
        // The path is over
        resolve()
        return
      }

      const newPath = await renderer.moveUnitOnePathStep(unit, path)
      game.updateRenderers() // Update 2D map
      resolve(renderer.moveUnitOnPath(unit, newPath))
    })
  }

  // ATTACK UNIT
  renderer.attackUnit = (unit, ennemyUnit) => {
    // Attack animation
    // TODO: tmp, do it better (buller mesh, explosion...)
    const animationPlayerPosition = new BABYLON.Animation(
      'unit.mesh',
      'position', 
      10, 
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3, 
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    )
    animationPlayerPosition.setKeys([
      { frame: 0, value: unit.mesh.position }, 
      { frame: 5, value: ennemyUnit.mesh.position },
      { frame: 10, value: unit.mesh.position }
    ])
    setEasing(animationPlayerPosition)

    unit.mesh.animations = [animationPlayerPosition]

    return renderer.scene.beginAnimation(
      unit.mesh, // Target
      0, // Start frame
      10, // End frame
      false, // Loop (according to ANIMATIONLOOPMODE)
      3 * CONFIG.game.animationsSpeed // Speed ratio
    )
  }

  // DESTROY UNIT
  renderer.destroyUnit = (unit) => {
    // Attack animation
    // TODO: tmp, do it better (buller mesh, explosion...)
    const animationPlayerPosition = new BABYLON.Animation(
      'unit.mesh',
      'position', 
      10, 
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3, 
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    )
    animationPlayerPosition.setKeys([
      { frame: 0, value: unit.mesh.position }, 
      { frame: 10, value: new BABYLON.Vector3( // end value
        unit.mesh.position.x, // Axis inversion!
        unit.mesh.position.y - 1, // TODO: Magic value!
        unit.mesh.position.z // Axis inversion!
      )}
    ])
    setEasing(animationPlayerPosition)

    unit.mesh.animations = [animationPlayerPosition]

    return renderer.scene.beginAnimation(
      unit.mesh, // Target
      0, // Start frame
      10, // End frame
      false, // Loop (according to ANIMATIONLOOPMODE)
      0.5 * CONFIG.game.animationsSpeed // Speed ratio
    )
  }

  // CHANGE UNIT MATERIAL
  renderer.changeUnitMaterial = (unit, color) => {
    const materialIndex = color === 'colorDesaturated' ? 1 : 0
    for (const mesh of unit.meshes) {
      if (!mesh.dontColorize) {
        mesh.material = renderer.materials.players[unit.playerId][materialIndex]
      }
    }
  }

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