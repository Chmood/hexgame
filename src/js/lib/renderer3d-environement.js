import BABYLON from 'babylonjs'

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
// RENDERER 3D ENVIRONEMENT

const Environement = (CONFIG_MAP, CONFIG_RENDER_3D) => {
  
  const renderer = {}

  ////////////////////////////////////////
  // PUBLIC
  renderer.lights = undefined
  renderer.shadowGenerator = undefined
  
  // UPDATE OCEAN
  renderer.updateOcean = (_betterOcean) => {
    const worldSize = CONFIG_RENDER_3D.worldSize
    betterOcean = _betterOcean

    // Ocean floor
    if (!oceanFloor) {
      oceanFloor = BABYLON.Mesh.CreateGround('oceanFloor', worldSize, worldSize, 16, scene, false)
      oceanFloor.position = new BABYLON.Vector3(
        0,
        // - 20,
        0,
        0
      )
      // const floorMaterial = new BABYLON.StandardMaterial('oceanFloor', scene)
      // floorMaterial.diffuseColor = new BABYLON.Color3(0,0,0.6)
      oceanFloor.material = materials['deepsea']
      oceanFloor.isPickable = false

      oceanFloor.freezeWorldMatrix()
    }

    // Ocean surface
    if (!renderer.ocean) {
      renderer.ocean = BABYLON.Mesh.CreateGround('oceanSurface', worldSize, worldSize, 16, scene, false)
      // Position tile mesh
      renderer.ocean.position = new BABYLON.Vector3(
        0,
        CONFIG_RENDER_3D.cellStepHeight * (CONFIG_MAP.mapSeaMinLevel + 1),
        0
      )
      renderer.ocean.isPickable = false

      renderer.ocean.freezeWorldMatrix()
    }
    
    // Water material
    if (renderer.ocean.material) {
      renderer.ocean.material.dispose()
    }
    if (betterOcean) {
      // Special water material
      water = new BABYLON.WaterMaterial('water', scene, new BABYLON.Vector2(512, 512))
      water.backFaceCulling = true
      water.bumpTexture = new BABYLON.Texture(waterbump, scene)
      water.windForce = 3
      water.waveHeight = 0
      water.bumpHeight = 0.25
      water.windDirection = new BABYLON.Vector2(1, 1)
      water.waterColor = new BABYLON.Color3(0.125, 0.6, 0.9)
      water.colorBlendFactor = 0.25
      water.freeze()

    } else {
      // Simple water material
      water = new BABYLON.StandardMaterial('ocean', scene)
      water.diffuseColor = new BABYLON.Color3(0.0, 0.0, 0.4)
      // water.emissiveColor = new BABYLON.Color3(0.1,0.2,1)
      water.alpha = 0.5
      water.bumpTexture = new BABYLON.Texture(waterbump, scene)
      water.freeze()
    }

    renderer.ocean.material = water
  }

  // ADD TO OCEAN RENDER LIST
  // Add all the meshes that reflect into ocean, or are seen through it
  renderer.addToOceanRenderList = () => {
    if (betterOcean) {
      renderer.ocean.material.addToRenderList(skybox)
      renderer.ocean.material.addToRenderList(oceanFloor)

      // Players
      for (const player of players) {
        for (const unit of player.units) {
          renderer.ocean.material.addToRenderList(unit.mesh)
        }
      }

      // Tiles
      for (let x = 0; x < CONFIG_MAP.mapSize.width; x++) {
        for (let y = 0; y < CONFIG_MAP.mapSize.height; y++) {
          renderer.ocean.material.addToRenderList(map[x][y].tile)
        }
      }
    }
  }

  ////////////////////////////////////////
  // PRIVATE
  let scene, materials, players, map, skybox, betterOcean, oceanFloor, water

  // CREATE SKYBOX
  const createSkybox = () => {
    const skybox = BABYLON.Mesh.CreateBox('skyBox', CONFIG_RENDER_3D.worldSize, scene)
    const skyboxMaterial = new BABYLON.StandardMaterial('skyBox', scene)
    skyboxMaterial.backFaceCulling = false
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture('./img/TropicalSunnyDay', scene)
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

  // CREATE LIGHTS
  const createLights = () => {
    const hemiLight = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(-1, 1, -1), scene)
    hemiLight.intensity = 0.4
    hemiLight.diffuse = new BABYLON.Color3(0.6, 0.6, 1)
    hemiLight.specular = new BABYLON.Color3(1, 1, 1)
    hemiLight.groundColor = new BABYLON.Color3(0.6, 1, 1)
    
    const directionalLight = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(1, -1, 1), scene)
    directionalLight.intensity = 0.85
    directionalLight.diffuse = new BABYLON.Color3(1, 1, 0.6)

    return {
      hemi: hemiLight,
      directional: directionalLight
    }
  }

  // CREATE SHADOWS
  const createShadows = () => {
    const shadowGenerator = new BABYLON.ShadowGenerator(4096, renderer.lights.directional)
    // renderer.shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.usePoissonSampling = true

    return shadowGenerator
  }

  // SHOW WORLD AXIS
  const showWorldAxis = (size) => {
    // From: https://doc.babylonjs.com/snippets/world_axes
    const makeTextPlane = (text, color, size) => {
      const dynamicTexture = new BABYLON.DynamicTexture('DynamicTexture', 50, scene, true)
      dynamicTexture.hasAlpha = true
      dynamicTexture.drawText(text, 5, 40, 'bold 36px Arial', color, 'transparent', true)
      const plane = BABYLON.Mesh.CreatePlane('TextPlane', size, scene, true)
      plane.material = new BABYLON.StandardMaterial('TextPlaneMaterial', scene)
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
    ], scene)
    axisX.color = new BABYLON.Color3(1, 0, 0)
    const xChar = makeTextPlane('X', 'red', size / 10)
    xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0)

    const axisY = BABYLON.Mesh.CreateLines('axisY', [
      BABYLON.Vector3.Zero(),
      new BABYLON.Vector3(0, size, 0),
      new BABYLON.Vector3(-0.05 * size, size * 0.95, 0),
      new BABYLON.Vector3(0, size, 0),
      new BABYLON.Vector3(0.05 * size, size * 0.95, 0)
    ], scene)
    axisY.color = new BABYLON.Color3(0, 1, 0)
    const yChar = makeTextPlane('Y', 'green', size / 10)
    yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size)

    const axisZ = BABYLON.Mesh.CreateLines('axisZ', [
      BABYLON.Vector3.Zero(),
      new BABYLON.Vector3(0, 0, size),
      new BABYLON.Vector3(0, -0.05 * size, size * 0.95),
      new BABYLON.Vector3(0, 0, size),
      new BABYLON.Vector3(0, 0.05 * size, size * 0.95)
    ], scene)
    axisZ.color = new BABYLON.Color3(0, 0, 1)
    const zChar = makeTextPlane('Z', 'blue', size / 10)
    zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size)

    axisX.freezeWorldMatrix()
    axisY.freezeWorldMatrix()
    axisZ.freezeWorldMatrix()
  }

  ////////////////////////////////////////
  // INIT
  renderer.init = (rendererScene, rendererMaterials, gamePlayers, gameMap) => {
    scene = rendererScene
    materials = rendererMaterials
    players = gamePlayers
    map = gameMap

    betterOcean = CONFIG_RENDER_3D.betterOcean
    
    skybox = createSkybox()

    renderer.updateOcean(betterOcean)

    if (CONFIG_RENDER_3D.showAxis) {
      showWorldAxis(27) // TODO: adapt to map size largest dimensions (width or height)
    }

    renderer.lights = createLights()

    if (CONFIG_RENDER_3D.shadows) {
      renderer.shadowGenerator = createShadows()
    }
  }

  return renderer
}

export default Environement

