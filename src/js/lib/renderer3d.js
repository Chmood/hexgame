import BABYLON from 'babylonjs'
import HEXLIB from '../vendor/hexlib.js'
import CONFIG from './config.js'

import Camera from './renderer3d-camera'
import Highlight from './renderer3d-highlight'
import Materials from './renderer3d-materials'
import Postprocess from './renderer3d-postprocess'

// image import (for Webpack loading & bundling as dependencies)
import waterbump from "../../img/waterbump.png"
// 'useless' imports are because of BabylonJS skybox structure
// (no direct link to those images in the code below)
import img1 from "../../img/TropicalSunnyDay_nx.jpg"
import img2 from "../../img/TropicalSunnyDay_ny.jpg"
import img3 from "../../img/TropicalSunnyDay_nz.jpg"
import img4 from "../../img/TropicalSunnyDay_px.jpg"
import img5 from "../../img/TropicalSunnyDay_py.jpg"
import img6 from "../../img/TropicalSunnyDay_pz.jpg"

import waterMaterial from '../vendor/water-material.js'
// Launch BABYLON material plugin (ugly home-made wrapper function)
waterMaterial(BABYLON)

////////////////////////////////////////////////////////////////////////////////
// RENDERER 3D

const Renderer3d = (game, canvas) => {
  const renderer = {},
        map = game.map.data,
        // External modules
        camera = Camera(canvas),
        highlight = Highlight(),
        materials = Materials(),
        postprocess = Postprocess()

  let layout

  // CAMERA MODULE
  // Wrappers
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
  // Aliases
  renderer.updateCameraZoom = camera.updateCameraZoom
  renderer.updateCameraAlpha = camera.updateCameraAlpha

  // HIGHLIGHT MODULE
  // Aliases
  renderer.updateHighlights = highlight.updateHighlights

  // POSTPROCESS MODULE
  // Aliases
  renderer.updatePosprocessPipeline = postprocess.updatePosprocessPipeline

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
  // ENVIRONMENT
  
  // CREATE SKYBOX
  renderer.createSkybox = () => {
    const skybox = BABYLON.Mesh.CreateBox('skyBox', CONFIG.render3d.worldSize, renderer.scene)
    const skyboxMaterial = new BABYLON.StandardMaterial('skyBox', renderer.scene)
    skyboxMaterial.backFaceCulling = false
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture('./img/TropicalSunnyDay', renderer.scene)
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0)
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0)
    skyboxMaterial.disableLighting = true
    skybox.material = skyboxMaterial
    skybox.isPickable = false

    skyboxMaterial.freeze()
    skybox.freezeWorldMatrix()

    return skybox
  }

  // UPDATE OCEAN
  renderer.updateOcean = () => {
    const worldSize = CONFIG.render3d.worldSize

    // Ocean floor
    if (!renderer.oceanFloor) {
      renderer.oceanFloor = BABYLON.Mesh.CreateGround('oceanFloor', worldSize, worldSize, 16, renderer.scene, false)
      renderer.oceanFloor.position = new BABYLON.Vector3(
        0,
        // - 20,
        0,
        0
      )
      // const floorMaterial = new BABYLON.StandardMaterial('oceanFloor', renderer.scene)
      // floorMaterial.diffuseColor = new BABYLON.Color3(0,0,0.6)
      renderer.oceanFloor.material = renderer.materials['deepsea']
      renderer.oceanFloor.isPickable = false

      renderer.oceanFloor.freezeWorldMatrix()
    }

    // Ocean surface
    if (!renderer.ocean) {
      renderer.ocean = BABYLON.Mesh.CreateGround('oceanSurface', worldSize, worldSize, 16, renderer.scene, false)
      // Position tile mesh
      renderer.ocean.position = new BABYLON.Vector3(
        0,
        CONFIG.render3d.cellStepHeight * (CONFIG.map.mapSeaMinLevel + 1),
        0
      )
      renderer.ocean.isPickable = false

      renderer.ocean.freezeWorldMatrix()
    }
    
    // Water material
    if (renderer.ocean.material) {
      renderer.ocean.material.dispose()
    }
    let water
    if (CONFIG.render3d.betterOcean) {
      // Special water material
      water = new BABYLON.WaterMaterial('water', renderer.scene, new BABYLON.Vector2(512, 512))
      water.backFaceCulling = true
      water.bumpTexture = new BABYLON.Texture(waterbump, renderer.scene)
      water.windForce = 3
      water.waveHeight = 0
      water.bumpHeight = 0.25
      water.windDirection = new BABYLON.Vector2(1, 1)
      water.waterColor = new BABYLON.Color3(0.125, 0.6, 0.9)
      water.colorBlendFactor = 0.25
      water.freeze()
    } else {
      // Simple water material
      water = new BABYLON.StandardMaterial('ocean', renderer.scene)
      water.diffuseColor = new BABYLON.Color3(0.0, 0.0, 0.4)
      // water.emissiveColor = new BABYLON.Color3(0.1,0.2,1)
      water.alpha = 0.5
      water.bumpTexture = new BABYLON.Texture(waterbump, renderer.scene)
      water.freeze()
    }

    renderer.ocean.material = water
  }

  // ADD TO OCEAN RENDER LIST
  // Add all the meshes that reflect into ocean, or are seen through it
  renderer.addToOceanRenderList = () => {
    if (CONFIG.render3d.betterOcean) {
      renderer.ocean.material.addToRenderList(renderer.skybox)
      renderer.ocean.material.addToRenderList(renderer.oceanFloor)
      // renderer.ocean.material.addToRenderList(renderer.axis) // TODO
      // Players
      for (const player of game.players) {
        for (const unit of player.units) {
          renderer.ocean.material.addToRenderList(unit.mesh)
        }
      }
      // Tiles
      for (let x = 0; x < CONFIG.map.mapSize.width; x++) {
        for (let y = 0; y < CONFIG.map.mapSize.height; y++) {
          renderer.ocean.material.addToRenderList(map[x][y].tile)
        }
      }
    }
  }

  // SHOW WORLD AXIS
  renderer.showWorldAxis = (size) => {
    // From: https://doc.babylonjs.com/snippets/world_axes
    const makeTextPlane = (text, color, size) => {
      const dynamicTexture = new BABYLON.DynamicTexture('DynamicTexture', 50, renderer.scene, true)
      dynamicTexture.hasAlpha = true
      dynamicTexture.drawText(text, 5, 40, 'bold 36px Arial', color, 'transparent', true)
      const plane = BABYLON.Mesh.CreatePlane('TextPlane', size, renderer.scene, true)
      plane.material = new BABYLON.StandardMaterial('TextPlaneMaterial', renderer.scene)
      plane.material.backFaceCulling = false
      plane.material.specularColor = new BABYLON.Color3(0, 0, 0)
      plane.material.diffuseTexture = dynamicTexture

      plane.freezeWorldMatrix()
      return plane
    }

    const axisX = BABYLON.Mesh.CreateLines('axisX', [
      BABYLON.Vector3.Zero(),
      new BABYLON.Vector3(size, 0, 0),
      new BABYLON.Vector3(size * 0.95, 0.05 * size, 0),
      new BABYLON.Vector3(size, 0, 0),
      new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
    ], renderer.scene)
    axisX.color = new BABYLON.Color3(1, 0, 0)
    const xChar = makeTextPlane('X', 'red', size / 10)
    xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0)

    const axisY = BABYLON.Mesh.CreateLines('axisY', [
      BABYLON.Vector3.Zero(),
      new BABYLON.Vector3(0, size, 0),
      new BABYLON.Vector3(-0.05 * size, size * 0.95, 0),
      new BABYLON.Vector3(0, size, 0),
      new BABYLON.Vector3(0.05 * size, size * 0.95, 0)
    ], renderer.scene)
    axisY.color = new BABYLON.Color3(0, 1, 0)
    const yChar = makeTextPlane('Y', 'green', size / 10)
    yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size)

    const axisZ = BABYLON.Mesh.CreateLines('axisZ', [
      BABYLON.Vector3.Zero(),
      new BABYLON.Vector3(0, 0, size),
      new BABYLON.Vector3(0, -0.05 * size, size * 0.95),
      new BABYLON.Vector3(0, 0, size),
      new BABYLON.Vector3(0, 0.05 * size, size * 0.95)
    ], renderer.scene)
    axisZ.color = new BABYLON.Color3(0, 0, 1)
    const zChar = makeTextPlane('Z', 'blue', size / 10)
    zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size)

    axisX.freezeWorldMatrix()
    axisY.freezeWorldMatrix()
    axisZ.freezeWorldMatrix()
  }

  ////////////////////////////////////////
  // TILES

  // GET HEXAPRISM VERTEX DATA
  renderer.getHexaprismVertexData = (hex, topHeight, bottomHeight = 0, topScaling = 1, bottomScaling = 1) => {
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

  // REDISTRIBUTE ELEVATION WITH GAP
  // TODO: rewrite all this crap! (not used by now)
  renderer.redistributeElevationWithGap = (height) => {
    // Increase height gap between lower land & higher sea
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

  // CREATE TILE
  renderer.createTile = (x, y, cell) => {
    const offset = HEXLIB.hexOffset(x, y),
          hex = HEXLIB.offset2Hex(
            offset,
            CONFIG.map.mapTopped,
            CONFIG.map.mapParity
          ),
          position = HEXLIB.hex2Pixel(layout, hex), // center of tile top
          tile = new BABYLON.Mesh(`tile-${x}-${y}`, renderer.scene),
          height = cell.height

    // BUILD MESH
    const vertexData = renderer.getHexaprismVertexData(
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
    tile.material = renderer.materials[cell.biome]
    // Make and receive shadows
    renderer.shadowGenerator.getShadowMap().renderList.push(tile)
    tile.receiveShadows = true;

    tile.freezeWorldMatrix()

    return tile
  }

  // CREATE TILES
  renderer.createTiles = () => {
    for (let x = 0; x < CONFIG.map.mapSize.width; x++) {
      for (let y = 0; y < CONFIG.map.mapSize.height; y++) {
        map[x][y].tile = renderer.createTile(x, y, map[x][y])
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
      renderer.shadowGenerator.getShadowMap().renderList.push(p)
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

  // Lights
  renderer.hemiLight = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(-1, 1, -1), renderer.scene)
  renderer.hemiLight.intensity = 0.4
  renderer.hemiLight.diffuse = new BABYLON.Color3(0.6, 0.6, 1)
  renderer.hemiLight.specular = new BABYLON.Color3(1, 1, 1)
  renderer.hemiLight.groundColor = new BABYLON.Color3(0.6, 1, 1)
  
  renderer.directionalLight = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(1, -1, 1), renderer.scene)
  renderer.directionalLight.intensity = 0.85
  renderer.directionalLight.diffuse = new BABYLON.Color3(1, 1, 0.6)
  
  // Shadow
  renderer.shadowGenerator = new BABYLON.ShadowGenerator(4096, renderer.directionalLight)
  // renderer.shadowGenerator.useBlurExponentialShadowMap = true;
  renderer.shadowGenerator.usePoissonSampling = true

  // Highlight layers
  // Last parameter is the number of highlight layers
  highlight.init(renderer.scene, game.ui, map, 3)

  // Materials
  renderer.materials = materials.createMaterials()

  // Meshes
  renderer.skybox = renderer.createSkybox()
  renderer.updateOcean()
  if (CONFIG.render3d.showAxis) {
    renderer.showWorldAxis(27) // TODO: adapt to map size largest dimensions (width or height)
  }

  // Post-process
  postprocess.init(renderer.scene, camera.camera, camera.cameraFree)
  postprocess.updatePosprocessPipeline()

  // Debounce counter
  renderer.debounce = 0

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