import BABYLON from 'babylonjs'
import HEXLIB from '../vendor/hexlib.js'
import CONFIG from './config.js'

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
        map = game.map.data

  ////////////////////////////////////////
  // BASE

  // CREATE LAYOUT
  renderer.createLayout = () => {
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

  // CREATE CAMERA
  renderer.createCamera = () => {
    // Add a camera to the scene and attach it to the canvas
    const ratioBaseSize = CONFIG.render3d.cellSize * CONFIG.map.mapSize.width

    const camera = new BABYLON.ArcRotateCamera(
      'Camera',
      0, // alpha angle
      CONFIG.render3d.camera.beta, // beta angle
      ratioBaseSize * CONFIG.render3d.camera.distanceRatio, // radius (aka distance)
      new BABYLON.Vector3( // target
        0,
        // focus height is one stepsize above water level
        CONFIG.render3d.cellStepHeight * (CONFIG.map.mapSeaMinLevel + 1 + 1),
        0
      ),
      renderer.scene
    )
    // Attach control from canvas to the camera (pan, tilt...)
    // camera.attachControl(canvas, true)
    // Constrain camera rotation & zooming
    camera.lowerBetaLimit = 0
    camera.upperBetaLimit = Math.PI / 2
    // camera.lowerAlphaLimit = 0
    // camera.upperAlphaLimit = 0
    camera.lowerRadiusLimit = ratioBaseSize * CONFIG.render3d.camera.distanceRatioMin
    camera.upperRadiusLimit = ratioBaseSize * CONFIG.render3d.camera.distanceRatioMax

    return camera
  }

  // CREATE CAMERA FREE
  renderer.createCameraFree = () => {
    // Add a camera to the scene and attach it to the canvas
    const ratioBaseSize = CONFIG.render3d.cellSize * CONFIG.map.mapSize.width

    const camera = new BABYLON.ArcRotateCamera(
      'Camera',
      0, // alpha angle
      CONFIG.render3d.camera.beta, // beta angle
      ratioBaseSize * CONFIG.render3d.camera.distanceRatio, // radius (aka distance)
      new BABYLON.Vector3( // target
        0,
        // focus height is one stepsize above water level
        CONFIG.render3d.cellStepHeight * (CONFIG.map.mapSeaMinLevel + 1 + 1),
        0
      ),
      renderer.scene
    )
    // Attach control from canvas to the camera (pan, tilt...)
    camera.attachControl(canvas, true)
    // Constrain camera rotation & zooming
    camera.lowerBetaLimit = 0
    camera.upperBetaLimit = Math.PI / 2
    // camera.lowerAlphaLimit = 0
    // camera.upperAlphaLimit = 0
    camera.lowerRadiusLimit = ratioBaseSize * CONFIG.render3d.camera.distanceRatioMin
    camera.upperRadiusLimit = ratioBaseSize * CONFIG.render3d.camera.distanceRatioMax

    return camera
  }

  // UPDATE CAMERA POSITION
  // Makes the camera look at the given hex
  renderer.updateCameraPosition = (hex) => {
    const position = HEXLIB.hex2Pixel(renderer.layout, hex), // center of tile top
          tileData = game.map.getCellFromHex(hex),
          height = tileData.height * CONFIG.render3d.cellStepHeight

    const animationCamera = new BABYLON.Animation(
      'moveCamera', 
      'target', 
      10, 
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3, 
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    )
    animationCamera.enableBlending = true;
    animationCamera.blendingSpeed = 0.1;

    const easingFunction = new BABYLON.SineEase()
    easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT)
    animationCamera.setEasingFunction(easingFunction)

    const nextTarget = new BABYLON.Vector3( // end value
      position.y, // Axis inversion!
      height, 
      position.x // Axis inversion!
    )
    animationCamera.setKeys([
      { frame: 0, value: renderer.camera.target },
      { frame: 10, value: nextTarget }
    ])
    
    // The animation trick here is that changing the camera target ALSO changes
    // its alpha and beta angles. So we have to animate those too, in order to
    // keep them on the same constant value

    const animationCameraAlpha = new BABYLON.Animation(
      'moveCameraAlpha', 
      'alpha', 
      10, 
      BABYLON.Animation.ANIMATIONTYPE_FLOAT, 
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    )
    animationCameraAlpha.setKeys([
      { frame: 0, value: renderer.camera.alpha }, 
      { frame: 10, value: renderer.camera.alpha }
    ])
          
    const animationCameraBeta = new BABYLON.Animation(
      'moveCameraBeta', 
      'beta', 
      10, 
      BABYLON.Animation.ANIMATIONTYPE_FLOAT, 
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    )
    animationCameraBeta.setKeys([
      { frame: 0, value: CONFIG.render3d.camera.beta }, 
      { frame: 10, value: CONFIG.render3d.camera.beta }
    ])
          
    renderer.camera.animations = [animationCamera, animationCameraAlpha, animationCameraBeta]
    renderer.scene.beginAnimation(
      renderer.camera, // Target
      0, // Start frame
      10, // End frame
      true, // Loop (according to ANIMATIONLOOPMODE)
      5 // Speed ratio
    )
  }

  // UPDATE CAMERA ZOOM
  renderer.updateCameraZoom = (direction) => {
    renderer.debounce = CONFIG.render3d.debounceKeyboardTime

    const ratioBaseSize = CONFIG.render3d.cellSize * CONFIG.map.mapSize.width
    let delta = 0;
    if (direction === 'in') {
      delta = -ratioBaseSize * CONFIG.render3d.camera.distanceRatioStep
    } else if (direction === 'out') {
      delta = ratioBaseSize * CONFIG.render3d.camera.distanceRatioStep
    }

    const animationCameraRadius = new BABYLON.Animation(
      'zoomCameraRadius', 
      'radius', 
      10, 
      BABYLON.Animation.ANIMATIONTYPE_FLOAT, 
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    )
    animationCameraRadius.setKeys([
      { frame: 0, value: renderer.camera.radius }, 
      { frame: 10, value: renderer.camera.radius + delta }
    ])

    const easingFunction = new BABYLON.SineEase()
    easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT)
    animationCameraRadius.setEasingFunction(easingFunction)

    renderer.camera.animations = [animationCameraRadius]
    renderer.scene.beginAnimation(
      renderer.camera, // Target
      0, // Start frame
      10, // End frame
      true, // Loop (according to ANIMATIONLOOPMODE)
      5 // Speed ratio
    )
  }

  // UPDATE CAMERA ALPHA
  renderer.updateCameraAlpha = (direction) => {
    renderer.debounce = CONFIG.render3d.debounceKeyboardTime

    const alphaStep = Math.PI * 2 / 6
    let delta = 0
    if (direction === 'clockwise') {
      delta = alphaStep
    } else if (direction === 'counterclockwise') {
      delta = -alphaStep
    }

    // Lock rotation on sixth of circle
    // Needed when 2 animations overlapses
    let newAlpha = renderer.camera.alpha + delta
    newAlpha = Math.round(newAlpha / alphaStep) * alphaStep
    // TODO: Keep alpha in the [0, 2*PI] range
    // newAlpha = (newAlpha % (2 * Math.PI)) * (2 * Math.PI)

    const animationCameraAlpha = new BABYLON.Animation(
      'rotateCameraAlpha', 
      'alpha', 
      10, 
      BABYLON.Animation.ANIMATIONTYPE_FLOAT, 
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    )
    animationCameraAlpha.setKeys([
      { frame: 0, value: renderer.camera.alpha }, 
      { frame: 10, value: newAlpha }
    ])

    const easingFunction = new BABYLON.SineEase()
    easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT)
    animationCameraAlpha.setEasingFunction(easingFunction)

    renderer.camera.animations = [animationCameraAlpha]
    renderer.scene.beginAnimation(
      renderer.camera, // Target
      0, // Start frame
      10, // End frame
      true, // Loop (according to ANIMATIONLOOPMODE)
      5 // Speed ratio
    )
    console.log(renderer.camera.alpha / alphaStep)
  }

  // SWITCH ACTIVE CAMERA
  renderer.switchActiveCamera = () => {
    if (renderer.scene.activeCamera === renderer.camera) {
      renderer.scene.activeCamera = renderer.cameraFree
    } else {
      renderer.scene.activeCamera = renderer.camera
    }
  }

  // CREATE MATERIALS
  renderer.createMaterials = () => {
    const materials = {}

    // Terrain materials
    for (const [name, value] of Object.entries(CONFIG.map.terrain)) {
      materials[name] = new BABYLON.StandardMaterial(name, renderer.scene)
      materials[name].diffuseColor = new BABYLON.Color3.FromHexString(value.color)
      materials[name].specularColor = new BABYLON.Color3.Black()
      materials[name].freeze()
    }

    // Let ice shine (aka specular reflections)!
    if (CONFIG.render3d.shinyIce) {
      materials['ice'].specularColor = new BABYLON.Color3.White()
    }
    // Let ice see through (aka alpha opacity)!
    if (CONFIG.render3d.transparentIce) {
      materials['ice'].alpha = 0.9
    }

    // Player materials
    materials.players = {}
    for (let [n, player] of Object.entries(CONFIG.players)) {
      materials.players[n] = new BABYLON.StandardMaterial(`player-${n}`, renderer.scene)
      materials.players[n].diffuseColor = new BABYLON.Color3.FromHexString(player.color)
      materials.players[n].specularColor = new BABYLON.Color3.Black()
      materials.players[n].freeze()
    }

    materials.unitNeutral = new BABYLON.StandardMaterial(`unit-black`, renderer.scene)
    materials.unitNeutral.diffuseColor = new BABYLON.Color3.FromHexString('#aaaaaa')
    materials.unitNeutral.freeze()

    return materials
  }

  // CREATE HIGHLIGHT LAYER
  renderer.createHighlightLayer = (id, scene) => {
    // Add the highlight layer
    const highlightLayer = new BABYLON.HighlightLayer(id, scene)
    highlightLayer.outerGlow = false
    return highlightLayer
  }

  // UPDATE POSTPROCESS PIPELINE
  renderer.updatePosprocessPipeline = () => {
    if (CONFIG.render3d.postprocess !== 'none') {
      if (CONFIG.render3d.postprocess === 'ssao') {
        if (renderer.pipeline) {
          // Disable pipeline
          renderer.pipeline.dispose()
          renderer.pipeline = undefined
        }

        // Post-process
        // renderer.lensEffect = new BABYLON.LensRenderingPipeline(
        //   'lensEffects', 
        //   {
        //     edge_blur: 0.25,
        //     chromatic_aberration: 1.0,
        //     distortion: 1.0,
        //     grain_amount: 1.0,
        //     dof_focus_distance: 30,
        //     dof_aperture: 1
        //   }, 
        //   renderer.scene, 
        //   1.0, 
        //   renderer.camera
        // )
    
        renderer.ssao = new BABYLON.SSAORenderingPipeline(
          'ssao-pipeline', 
          renderer.scene, 
          {
            ssaoRatio: 1,
            combineRatio: 1.0
          },
          [renderer.camera, renderer.cameraFree]
        )

      } else if (CONFIG.render3d.postprocess === 'multi') {
        if (renderer.ssao) {
          // Disable SSAO
          renderer.ssao.dispose()
          renderer.ssao = undefined
        }

        // DEFAULT RENDER PIPELINE
        renderer.pipeline = new BABYLON.DefaultRenderingPipeline(
          "default-pipeline", // The name of the pipeline
          true, // Do you want HDR textures ?
          renderer.scene, // The scene instance
          [renderer.camera, renderer.cameraFree] // The list of cameras to be attached to
        )
        // Base
        renderer.pipeline.samples = 4
        renderer.pipeline.fxaaEnabled = true
        // // D.O.F.
        // renderer.pipeline.depthOfFieldEnabled = true
        // renderer.pipeline.depthOfFieldBlurLevel = BABYLON.DepthOfFieldEffectBlurLevel.Low;
        // renderer.pipeline.depthOfField.focusDistance  = 2000; // distance of the current focus point from the camera in millimeters considering 1 scene unit is 1 meter
        // renderer.pipeline.depthOfField.focalLength  = 50; // focal length of the camera in millimeters
        // renderer.pipeline.depthOfField.fStop  = 1.4; // aka F number of the camera defined in stops as it would be on a physical device
        // Sharpen
        // renderer.pipeline.sharpenEnabled = true
        // renderer.pipeline.sharpen.edgeAmount = 0.9;
        // Bloom
        renderer.pipeline.bloomEnabled = true
        renderer.pipeline.bloomThreshold = 0.8
        renderer.pipeline.bloomWeight = 0.3
        renderer.pipeline.bloomKernel = 64
        renderer.pipeline.bloomScale = 1
        // Chromatic aberration
        renderer.pipeline.chromaticAberrationEnabled = true
        renderer.pipeline.chromaticAberration.aberrationAmount = 500;
        renderer.pipeline.chromaticAberration.radialIntensity = 3;
        var rotation = Math.PI;
        renderer.pipeline.chromaticAberration.direction.x = Math.sin(rotation)
        renderer.pipeline.chromaticAberration.direction.y = Math.cos(rotation)
        // Grain
        renderer.pipeline.grainEnabled = true
        renderer.pipeline.grain.intensity = 9
        renderer.pipeline.grain.animated = 1
      }
    } else {
      if (renderer.ssao) {
        // Disable SSAO
        renderer.ssao.dispose()
        renderer.ssao = undefined
      }
      if (renderer.pipeline) {
        // Disable pipeline
        renderer.pipeline.dispose()
        renderer.pipeline = undefined
      }
    }
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
    const cornersTop = HEXLIB.hexCorners(renderer.layout, hex, CONFIG.render3d.cellSize * topScaling),
          cornersBottom = HEXLIB.hexCorners(renderer.layout, hex, CONFIG.render3d.cellSize * bottomScaling)
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
      position = HEXLIB.hex2Pixel(renderer.layout, hex), // center of tile top
      tile = new BABYLON.Mesh(`tile-${x}-${y}`, renderer.scene)

    let height = renderer.redistributeElevationWithGap(cell.height)

    // BUILD MESH
    const vertexData = renderer.getHexaprismVertexData(hex, height, 0, 1, 1.25)
    vertexData.applyToMesh(tile)

    // ROTATION
    // Set pivot (local center for transformations)
    tile.setPivotPoint(new BABYLON.Vector3(position.y, height * CONFIG.render3d.cellStepHeight, position.x))
    // Random rotation
    tile.rotation = new BABYLON.Vector3(
      (Math.random() - 0.5) * 2 * Math.PI / 16 * CONFIG.render3d.randomTileRotationFactor, 
      0, 
      (Math.random() - 0.5) * 2 * Math.PI / 16 * CONFIG.render3d.randomTileRotationFactor
    )

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
    for (const part of parts) {
      // Create box mesh
      const p = BABYLON.MeshBuilder.CreateBox(
        `player-${idPlayer}-${name}-${idUnit}-base`, 
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
    }
  }

  // CREATE UNIT
  renderer.createUnit = (unit, idPlayer, idUnit) => {
    const hex = unit.hex,
          position = HEXLIB.hex2Pixel(renderer.layout, hex), // center of tile top
          cellSize = CONFIG.render3d.cellSize,
          cell = map[unit.hexOffset.col][unit.hexOffset.row],
          cellHeight = cell.height,
          tile = cell.tile
                
      unit.mesh = BABYLON.MeshBuilder.CreateBox(
      `unit-${idPlayer}`, {height: 0.01, width: 0.01, depth: 0.01}
    )

    // POSITION
    unit.mesh.position = new BABYLON.Vector3(
      position.y,
      cellHeight * CONFIG.render3d.cellStepHeight,
      position.x
    )

    // ROTATION
    // Same rotation as the underneath tile
    unit.mesh.rotation = tile.rotation

    ////////////////////////////////////////
    // PARTS MESHES

    renderer.createMultipartUnit('tank', idPlayer, idUnit, unit.mesh, cellSize, [
      {
        name: 'base',
        size: {height: 1/6, length: 3/4, width: 1/2},
        position: {x: 0, y: 1/4, z: 0},
        material: renderer.materials.unitNeutral
      },
      {
        name: 'trackLeft',
        size: {height: 1/3, length: 1, width: 1/4},
        position: {x: 0, y: 1/4, z: 1/3},
        material: renderer.materials.players[idPlayer]
      },
      {
        name: 'trackRight',
        size: {height: 1/3, length: 1, width: 1/4},
        position: {x: 0, y: 1/4, z: -1/3},
        material: renderer.materials.players[idPlayer]
      },
      {
        name: 'body',
        size: {height: 1/4, length: 1/4, width: 1/4},
        position: {x: 0, y: 1/2, z: 0},
        material: renderer.materials.players[idPlayer]
      },
      {
        name: 'cannon',
        size: {height: 1/16, length: 1/2, width: 1/16},
        position: {x: -1/4, y: 1/2, z: 0},
        material: renderer.materials.players[idPlayer]
      }
    ])
  }

  // CREATE UNITS
  renderer.createUnits = () => {
    for (const player of game.players) {
      for (const unit of player.units) {
        renderer.createUnit(unit, player.id, unit.id)
      }
    }
  }

  // DELETE UNITS
  renderer.deleteUnits = () => {
    if (game.players) {
      for (const player of game.players) {
        if (player.units) {
          for (const unit of player.units) {
            if (unit.mesh) {
              unit.mesh.dispose()
            }
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
    const position = HEXLIB.hex2Pixel(renderer.layout, step),
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

    renderer.scene.beginAnimation(
      unit.mesh, // Target
      0, // Start frame
      10, // End frame
      false, // Loop (according to ANIMATIONLOOPMODE)
      speed, // Speed ratio
      callback
    )
  }

  // MOVE UNIT
  // Move a unit to an adjacent tile
  // TODO: the rotation part seems fuxed up!?
  renderer.moveUnit = (unit, step, callback) => {
    const position = HEXLIB.hex2Pixel(renderer.layout, step),
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

    renderer.scene.beginAnimation(
      unit.mesh, // Target
      0, // Start frame
      10, // End frame
      false, // Loop (according to ANIMATIONLOOPMODE)
      3, // Speed ratio
      callback
    )
  }

  // MOVE UNIT ON PATH
  // Rotate a unit then move it to an adjacent tile, repeatedly
  renderer.moveUnitOnPath = (unit, path) => {
    if (path.length === 0) {
      // The path is over
      game.mode = 'select'
      console.log(`Unit moved: ${game.selectedUnit.name}`)
      return
    }
    const step = path[0] // Get the first step
    path.shift() // Remove the first step from the path
    unit.mesh.animations = []
    // Make the camera follow the moving unit
    renderer.updateCameraPosition(step)

    renderer.rotateUnit(unit, step, () => {
      renderer.moveUnit(unit, step, () => {
        // Update unit's position
        unit.moveToHex(step, CONFIG.map.mapTopped, CONFIG.map.mapParity)
        renderer.moveUnitOnPath(unit, path) // Recusivity!
      })
    })
  }

  ////////////////////////////////////////
  // HIGHLIGHTS

  // UPDATE HIGHLIGHTS
  renderer.updateHighlights = () => {
    // Clear all highlights
    for (let n = 0; n < renderer.highlightMeshes.length; n++) {
      for (const mesh of renderer.highlightMeshes[n]) {
        renderer.highlightLayer[n].removeMesh(mesh.mesh)
      }
      renderer.highlightMeshes[n] = []
    }
    
    // Move zone
    for (const hex of game.ui.moveZone) {
      renderer.hightlightTile(hex, BABYLON.Color3.White(), 0)
    }
    // Path line
    renderer.highlightLine(game.ui.line, BABYLON.Color3.Red(), 1)
    // Cursor line
    renderer.highlightLine(game.ui.cursorPath, BABYLON.Color3.Blue(), 1)
    // Cursor tile
    renderer.hightlightTile(game.ui.cursor, BABYLON.Color3.Blue(), 1)

    // Add selected meshes to highlight layer
    for (let n = 0; n < renderer.highlightMeshes.length; n++) {
      for (let mesh of renderer.highlightMeshes[n]) {
        renderer.highlightLayer[n].addMesh(mesh.mesh, mesh.color)
      }
    }
  }

  // HIGHTLIGHT TILE
  renderer.hightlightTile = (hex, color = BABYLON.Color3.White(), n = 0) => {
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
      renderer.highlightMeshes[n].push({
        mesh: map[offset.col][offset.row].tile,
        color: color
      })
    }
  }

  // HIGHLIGHT LINE
  renderer.highlightLine = (line, color, n = 0) => {
    // Draw line tiles
    if (line) {
      for (let i = 0; i < line.length; i++) {
        renderer.hightlightTile(line[i], color, n)
      }
    }
  }

  ////////////////////////////////////////
  // PLOT CURSOR
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
  
      const fps = Math.floor(renderer.engine.getFps())
      // console.log(fps + ' FPS')

      if (CONFIG.render3d.cameraAutoRotate) {
        // Make the camera rotate around the island
        renderer.cameraFree.alpha = renderer.tick
        renderer.tick += 0.01
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
  renderer.initRenderer = () => {
    // Base
    renderer.layout = renderer.createLayout()
    renderer.engine = new BABYLON.Engine(canvas, true, {
      deterministicLockstep: true,
      lockstepMaxSteps: 4
    })
    renderer.scene = new BABYLON.Scene(renderer.engine)
    renderer.camera = renderer.createCamera()
    renderer.cameraFree = renderer.createCameraFree()
    renderer.scene.activeCamera = renderer.camera

    // Lights
    renderer.hemiLight = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(-1, 1, -1), renderer.scene)
    renderer.hemiLight.intensity = 0.33
    renderer.hemiLight.diffuse = new BABYLON.Color3(0.6, 0.6, 1)
	  renderer.hemiLight.specular = new BABYLON.Color3(1, 1, 1)
	  renderer.hemiLight.groundColor = new BABYLON.Color3(0.6, 1, 1)
    
    renderer.directionalLight = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(1, -1, 1), renderer.scene)
    renderer.directionalLight.intensity = 0.8
    renderer.directionalLight.diffuse = new BABYLON.Color3(1, 1, 0.6)
	  
    // Shadow
    renderer.shadowGenerator = new BABYLON.ShadowGenerator(4096, renderer.directionalLight)
    // renderer.shadowGenerator.useBlurExponentialShadowMap = true;
    renderer.shadowGenerator.usePoissonSampling = true

    // Highlight layers
    const nHightlighLayers = 2
    renderer.highlightLayer = []
    renderer.highlightMeshes = []
    for (let n = 0; n < nHightlighLayers; n++) {
      renderer.highlightLayer[n] = renderer.createHighlightLayer(`highlightLayer${n}`, renderer.scene)
      renderer.highlightMeshes[n] = []
    }

    // Materials
    renderer.materials = renderer.createMaterials()

    // Meshes
    renderer.skybox = renderer.createSkybox()
    renderer.updateOcean()
    if (CONFIG.render3d.showAxis) {
      renderer.showWorldAxis(27) // TODO: adapt to map size largest dimensions (width or height)
    }

    // Post-process
    renderer.updatePosprocessPipeline()

    // 'Time' tick
    renderer.tick = 0
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

    renderer.initUpdateLoop()
  }
  
  renderer.initRenderer()

  return renderer
}

export default Renderer3d