import BABYLON from 'babylonjs'
import HEXLIB from '../vendor/hexlib.js'
import CONFIG from './config.js'

// image import (for Webpack loading & bundling as dependencies)
import waterbump from "../../img/waterbump.png"
// 'useless' ones are because of BabylonJS skybox structure
// (no direct link to these images in the code below)
import img1 from "../../img/TropicalSunnyDay_nx.jpg"
import img2 from "../../img/TropicalSunnyDay_ny.jpg"
import img3 from "../../img/TropicalSunnyDay_nz.jpg"
import img4 from "../../img/TropicalSunnyDay_px.jpg"
import img5 from "../../img/TropicalSunnyDay_py.jpg"
import img6 from "../../img/TropicalSunnyDay_pz.jpg"

import waterMaterial from '../vendor/water-material.js'
// Launch BABYLON material plugin
waterMaterial(BABYLON)

////////////////////////////////////////////////////////////////////////////////
// RENDERER 3D

const Renderer3d = (game, canvas) => {
  const renderer = {},
        map = game.map.data

  // LAYOUT
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

  // CAMERA
  renderer.createCamera = () => {
    // Add a camera to the scene and attach it to the canvas
    const camera = new BABYLON.ArcRotateCamera(
      'Camera',
      // Math.PI / 4, 
      // Math.PI / 4, 
      0, // alpha angle
      0, // beta angle
      60, // radius (aka distance)
      new BABYLON.Vector3(
        0,
        // focus height is one stepsize above water level
        CONFIG.render3d.cellStepHeight * (CONFIG.map.mapSeaMinLevel + 1 + 1),
        0
      ), // target
      renderer.scene
    )
    camera.attachControl(canvas, true)
    // Constrain camera rotation & zooming
    camera.lowerBetaLimit = 0
    camera.upperBetaLimit = Math.PI / 2
    camera.lowerRadiusLimit = CONFIG.render3d.cellSize * 5
    camera.upperRadiusLimit = CONFIG.render3d.cellSize * 100

    return camera
  }

  // MATERIALS
  renderer.createMaterials = () => {
    const materials = {}

    // Terrain materials
    for (let [name, value] of Object.entries(CONFIG.map.terrain)) {
      materials[name] = new BABYLON.StandardMaterial(name, renderer.scene)
      materials[name].diffuseColor = new BABYLON.Color3.FromHexString(value.color)
      materials[name].specularColor = new BABYLON.Color3.Black()
    }

    // Let ice shine (aka specular reflections)!
    if (CONFIG.render3d.shinyIce) {
      materials['ice'].specularColor = new BABYLON.Color3.White()
    }
    // Let ice see through (aka alpha opacity)!
    if (CONFIG.render3d.transparentIce) {
      materials['ice'].alpha = 0.9
    }

    return materials
  }

  // TILES

  // // HEXAPRISM
  // // aka extruded hexagon
  // renderer.createHexaprismMesh = (corners) => {
  // }

  // ELEVATION GAP
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

  // TILE
  renderer.createTile = (x, y, cell) => {
    const offset = HEXLIB.hexOffset(x, y),
      hex = HEXLIB.offset2Hex(
        offset,
        CONFIG.map.mapTopped,
        CONFIG.map.mapParity
      ),
      position = HEXLIB.hex2Pixel(renderer.layout, hex), // center of tile top
      corners = HEXLIB.hexCorners(renderer.layout, hex),
      // TODO: larger bottom makes glitch
      cornersBottom = HEXLIB.hexCorners(renderer.layout, hex, CONFIG.render3d.cellSize * 1.25),
      // cornersBottom = corners,
      tile = new BABYLON.Mesh(`tile-${x}-${y}`, renderer.scene)

    let height = renderer.redistributeElevationWithGap(cell.height)
    height *= CONFIG.render3d.cellStepHeight

    function getRandomDisp() {
      return (Math.random() - CONFIG.render3d.randomTileSizeOffset) * 2 * CONFIG.render3d.randomTileSizeFactor
    }

    // HACK: Reverse x and y for render
    // map X axis => world Z axis
    // map Y axis => world X axis
    const positions = [
      // top
      corners[0].y + getRandomDisp(), height, corners[0].x + getRandomDisp(),
      corners[1].y + getRandomDisp(), height, corners[1].x + getRandomDisp(),
      corners[2].y + getRandomDisp(), height, corners[2].x + getRandomDisp(),
      corners[3].y + getRandomDisp(), height, corners[3].x + getRandomDisp(),
      corners[4].y + getRandomDisp(), height, corners[4].x + getRandomDisp(),
      corners[5].y + getRandomDisp(), height, corners[5].x + getRandomDisp(),

      // bottom (base)
      cornersBottom[0].y + getRandomDisp(), 0, cornersBottom[0].x + getRandomDisp(),
      cornersBottom[1].y + getRandomDisp(), 0, cornersBottom[1].x + getRandomDisp(),
      cornersBottom[2].y + getRandomDisp(), 0, cornersBottom[2].x + getRandomDisp(),
      cornersBottom[3].y + getRandomDisp(), 0, cornersBottom[3].x + getRandomDisp(),
      cornersBottom[4].y + getRandomDisp(), 0, cornersBottom[4].x + getRandomDisp(),
      cornersBottom[5].y + getRandomDisp(), 0, cornersBottom[5].x + getRandomDisp()
    ]
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
    ]

    // BULD MESH
    var vertexData = new BABYLON.VertexData()
    vertexData.positions = positions
    vertexData.indices = indices
    vertexData.applyToMesh(tile)

    // ROTATION
    // Set pivot (local center for transformations)
    tile.setPivotPoint(new BABYLON.Vector3(position.y, height, position.x))
    // Random rotation
    tile.rotate(
      BABYLON.Axis.X,
      (Math.random() - 0.5) * 2 * Math.PI / 16 * CONFIG.render3d.randomTileRotationFactor,
      BABYLON.Space.LOCAL
    )
    tile.rotate(
      BABYLON.Axis.Z,
      (Math.random() - 0.5) * 2 * Math.PI / 16 * CONFIG.render3d.randomTileRotationFactor,
      BABYLON.Space.LOCAL
    )

    // Give the tile mesh a material
    tile.material = renderer.materials[cell.biome]
    // Make and receive shadows
    renderer.shadowGenerator.getShadowMap().renderList.push(tile)
    tile.receiveShadows = true;

    return tile
  }

  // TILES
  renderer.createTiles = () => {
    for (let x = 0; x < CONFIG.map.mapSize.width; x++) {
      for (let y = 0; y < CONFIG.map.mapSize.height; y++) {
        map[x][y].tile = renderer.createTile(x, y, map[x][y])

        // Compute ocean transparency
        if (CONFIG.render3d.betterOcean) {
          renderer.ocean.material.addToRenderList(map[x][y].tile)
        }
      }
    }
  }

  // DELETE TILES
  renderer.deleteTiles = () => {
    for (let x = 0; x < CONFIG.map.mapSize.width; x++) {
      for (let y = 0; y < CONFIG.map.mapSize.height; y++) {
        // console.warn(map[x][y].tile)
        if (map[x][y] && map[x][y].tile) {
          map[x][y].tile.dispose() // TODO: not deleting tile
        }
      }
    }
  }

  // UPDATE HIGHLIGHTS
  renderer.updateHighlights = () => {
    // Clear all highlights
    for (let mesh of renderer.highlightMeshes) {
      renderer.highlightLayer.removeMesh(mesh.mesh)
    }
    renderer.highlightMeshes = []
    
    // Path line
    renderer.highlightLine(game.ui.line, BABYLON.Color3.Red())
    // Cursor line
    renderer.highlightLine(game.ui.cursorPath, BABYLON.Color3.Blue())
    // Cursor tile
    renderer.hightlightTile(game.ui.cursor, BABYLON.Color3.Blue())

    // Add selected meshes to highlight layer
    for (let mesh of renderer.highlightMeshes) {
      renderer.highlightLayer.addMesh(mesh.mesh, mesh.color)
    }
  }

  // HIGHTLIGHT TILE
  renderer.hightlightTile = (hex, color = BABYLON.Color3.White()) => {
    const offset = HEXLIB.hex2Offset(
            hex, 
            CONFIG.map.mapTopped, 
            CONFIG.map.mapParity
          )

    // Sanitize inputs
    if (offset.col && offset.row && 
        offset.col >= 0 && offset.row >= 0 &&
        offset.col < CONFIG.map.mapSize.width && offset.row < CONFIG.map.mapSize.height
      ) {
      // Add to layer
      renderer.highlightMeshes.push({
        mesh: map[offset.col][offset.row].tile,
        color: color
      })
    }
  }

  // HIGHLIGHT LINE
  renderer.highlightLine = (line, color) => {
    // Draw line tiles
    if (line) {
      for (let i = 0; i < line.length; i++) {
        renderer.hightlightTile(line[i], color)
      }
    }
  }

  // SKYBOX
  renderer.createSkybox = () => {
    const skybox = BABYLON.Mesh.CreateBox('skyBox', 5000.0, renderer.scene)
    const skyboxMaterial = new BABYLON.StandardMaterial('skyBox', renderer.scene)
    skyboxMaterial.backFaceCulling = false
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture('./img/TropicalSunnyDay', renderer.scene)
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0)
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0)
    skyboxMaterial.disableLighting = true
    skybox.material = skyboxMaterial
    skybox.isPickable = false

    return skybox
  }

  // OCEAN
  renderer.createOcean = () => {
    const ocean = BABYLON.Mesh.CreateGround('oceanSurface', 1024, 1024, 16, renderer.scene, false)
    // Position tile mesh
    ocean.position = new BABYLON.Vector3(
      0,
      CONFIG.render3d.cellStepHeight * (CONFIG.map.mapSeaMinLevel + 1),
      0
    )

    // Ocean floor
    renderer.oceanFloor = BABYLON.Mesh.CreateGround('oceanFloor', 1024, 1024, 16, renderer.scene, false)
    renderer.oceanFloor.position = new BABYLON.Vector3(
      0,
      - 20,
      0
    )
    // const floorMaterial = new BABYLON.StandardMaterial('oceanFloor', renderer.scene)
    // floorMaterial.diffuseColor = new BABYLON.Color3(0,0,0.6)
    renderer.oceanFloor.material = renderer.materials['deepsea']
    renderer.oceanFloor.isPickable = false

    // Water
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
      // Make skybox reflect into ocean
      water.addToRenderList(renderer.skybox)
      water.addToRenderList(renderer.oceanFloor)
    } else {
      // Simple water material
      water = new BABYLON.StandardMaterial('ocean', renderer.scene)
      water.diffuseColor = new BABYLON.Color3(0.0, 0.0, 0.4)
      // water.emissiveColor = new BABYLON.Color3(0.1,0.2,1)
      water.alpha = 0.5
      water.bumpTexture = new BABYLON.Texture(waterbump, renderer.scene)
    }

    ocean.material = water
    ocean.isPickable = false

    return ocean
  }

  // SHOW AXIS
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
  }

  renderer.createHighlightLayer = (id, scene) => {
    // Add the highlight layer
    const highlightLayer = new BABYLON.HighlightLayer(id, scene)
    highlightLayer.outerGlow = false
    return highlightLayer
  }

  // INIT RENDERER
  renderer.initRenderer = () => {
    // Base
    renderer.layout = renderer.createLayout()
    renderer.engine = new BABYLON.Engine(canvas, true) // Generate the BABYLON 3D 
    renderer.scene = new BABYLON.Scene(renderer.engine)
    renderer.camera = renderer.createCamera()

    // Lights
    renderer.hemiLight = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(-1, 1, -1), renderer.scene)
    renderer.hemiLight.intensity = 0.33
    renderer.hemiLight.diffuse = new BABYLON.Color3(0.6, 0.6, 1)
	  renderer.hemiLight.specular = new BABYLON.Color3(1, 1, 1)
	  renderer.hemiLight.groundColor = new BABYLON.Color3(0.6, 1, 1)
    
    renderer.directionalLight = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(1, -1, 1), renderer.scene)
    renderer.directionalLight.intensity = 0.8
    renderer.directionalLight.diffuse = new BABYLON.Color3(1, 1, 0.6)
	  
    // Shadow & highlight
    renderer.shadowGenerator = new BABYLON.ShadowGenerator(4096, renderer.directionalLight)
    // renderer.shadowGenerator.useBlurExponentialShadowMap = true;
    renderer.shadowGenerator.usePoissonSampling = true
    renderer.highlightLayer = renderer.createHighlightLayer('hl1', renderer.scene)
    renderer.highlightMeshes = []

    // Materials
    renderer.materials = renderer.createMaterials()

    // Meshes
    renderer.skybox = renderer.createSkybox()
    renderer.ocean = renderer.createOcean()
    renderer.showWorldAxis(27) // TODO: adapt to map size largest dimensions (width or height)

    if (CONFIG.render3d.postprocess !== 'none') {
      if (CONFIG.render3d.postprocess === 'SSAO') {
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
          'ssaopipeline', 
          renderer.scene, 
          {
            ssaoRatio: 1,
            combineRatio: 1.0
          },
          [renderer.camera]
        )

      } else if (CONFIG.render3d.postprocess === 'multi') {
        // DEFAULT RENDER PIPELINE
        renderer.pipeline = new BABYLON.DefaultRenderingPipeline(
          "default", // The name of the pipeline
          true, // Do you want HDR textures ?
          renderer.scene, // The scene instance
          [renderer.camera] // The list of cameras to be attached to
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
    }

    //CLOUDS
    // See: https://www.babylonjs-playground.com/#ATDL99#0
    // Boolean mesh
    // See: https://www.babylonjs-playground.com/#T6NP3F#0
    // Animated skybox
    // See: https://www.babylonjs-playground.com/#E6OZX#122
    // And: https://doc.babylonjs.com/extensions/sky

    renderer.scene.registerBeforeRender(function (t) {
      // WTF?
      // renderer.camera.alpha = 1.0 * (Math.PI / 20 + Math.cos(t / 30))
    //   renderer.camera.beta = 2.0 * (Math.PI / 20 + Math.sin(t / 50))
    //   renderer.camera.radius = 180 + (-50 + 50 * Math.sin(t / 10))
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

  renderer.initRenderer()


  return renderer
}

export default Renderer3d