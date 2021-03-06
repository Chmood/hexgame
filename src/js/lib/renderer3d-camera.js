import BABYLON from 'babylonjs'
import HEXLIB from '../vendor/hexlib.js'

////////////////////////////////////////////////////////////////////////////////
// RENDERER 3D CAMERA

const Camera = (CONFIG_RENDER_3D, canvas, game) => {
  
  const CONFIG = game.CONFIG

  const dampbox = {
    width: 8,
    height: 8,
    position: { // Position of the center of the box
      x: 13,
      y: 13
    }
  }

  const renderer = {}

  ////////////////////////////////////////
  // PUBLIC
  renderer.camera = undefined
  renderer.cameraFree = undefined

  // UPDATE CAMERA POSITION
  // Makes the camera look at the given hex
  renderer.updateCameraPosition = (hex) => {
    
    // Dampbox
    if (CONFIG_RENDER_3D.camera.cameraDampbox) {
      const offset = HEXLIB.hex2Offset(hex)
      // Box AABB from position and size
      const box = {
        min: {
          x: dampbox.position.x - Math.floor(dampbox.width / 2),
          y: dampbox.position.y - Math.floor(dampbox.height / 2)
        },
        max: {
          x: dampbox.position.x + Math.floor(dampbox.width / 2),
          y: dampbox.position.y + Math.floor(dampbox.height / 2)
        }
      }

      // Make the box include the hex
      if (offset.col < box.min.x ) {
        dampbox.position.x -= box.min.x - offset.col
      } else if (offset.col > box.max.x ) {
        dampbox.position.x -= box.max.x - offset.col
      }
      if (offset.row < box.min.y) {
        dampbox.position.y -= box.min.y - offset.row
      } else if (offset.row > box.max.y) {
        dampbox.position.y -= box.max.y - offset.row
      }

      // Make the camera focus the center of the box
      const dampboxHex = HEXLIB.offset2Hex(
        HEXLIB.hexOffset(dampbox.position.x, dampbox.position.y)
      )

      // Mutate the hex param :(
      hex = dampboxHex
    }

    const position = HEXLIB.hex2Pixel(layout, hex),
          cell = game.map.getCellFromHex(hex),
          height = cell.elevation * CONFIG_RENDER_3D.cellStepHeight

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
      { frame: 0, value: CONFIG_RENDER_3D.camera.beta }, 
      { frame: 10, value: CONFIG_RENDER_3D.camera.beta }
    ])
          
    renderer.camera.animations = [animationCamera, animationCameraAlpha, animationCameraBeta]
    scene.beginAnimation(
      renderer.camera, // Target
      0, // Start frame
      10, // End frame
      true, // Loop (according to ANIMATIONLOOPMODE)
      5 // Speed ratio
    )
  }

  // UPDATE CAMERA ZOOM
  renderer.updateCameraZoom = (direction) => {
    const ratioBaseSize = CONFIG_RENDER_3D.cellSize * CONFIG.map.mapSize.width
    let delta = 0;
    if (direction === 'in') {
      delta = -ratioBaseSize * CONFIG_RENDER_3D.camera.distanceRatioStep
    } else if (direction === 'out') {
      delta = ratioBaseSize * CONFIG_RENDER_3D.camera.distanceRatioStep
    }

    // DAMPBOX SIZE UPDATE
    if (CONFIG_RENDER_3D.camera.cameraDampbox) {
      dampbox.width = Math.round((renderer.camera.radius + delta) / CONFIG_RENDER_3D.camera.cameraDampboxRatio) // Sort of magic value...
      dampbox.height = Math.round((renderer.camera.radius + delta) / CONFIG_RENDER_3D.camera.cameraDampboxRatio) // Sort of magic value...
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
    scene.beginAnimation(
      renderer.camera, // Target
      0, // Start frame
      10, // End frame
      true, // Loop (according to ANIMATIONLOOPMODE)
      5 // Speed ratio
    )
  }

  // UPDATE CAMERA ALPHA
  renderer.updateCameraAlpha = (direction) => {

    const alphaStep = Math.PI * 2 / 6 // 60°
    let delta = 0
    if (direction === 'clockwise') {
      delta = alphaStep
    } else if (direction === 'counterclockwise') {
      delta = -alphaStep
    }

    // Lock rotation on sixth of circle
    // Needed when 2 animations overlap
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
    scene.beginAnimation(
      renderer.camera, // Target
      0, // Start frame
      10, // End frame
      true, // Loop (according to ANIMATIONLOOPMODE)
      5 // Speed ratio
    )
  }

  // GET ACTIVE CAMERA
  // Returns the name of the active camera, and a reference to this camera itself
  renderer.getActiveCamera = () => {
    return {
      name: activeCameraName,
      camera: getCameraByName(activeCameraName)
    }
  }

  // SET ACTIVE CAMERA
  renderer.setActiveCamera = (cameraName) => {
    activeCameraName = cameraName

    if (activeCameraName === 'cameraFree') {
      scene.activeCamera = renderer.cameraFree

    } else if (activeCameraName === 'camera') {
      scene.activeCamera = renderer.camera
    }
  }

  // GET CAMERA FREE AUTO ROTATE
  renderer.getCameraFreeAutorotate = () => {
    return cameraFreeAutoRotate
  }

  // SET CAMERA FREE AUTO ROTATE
  renderer.setCameraFreeAutorotate = (_cameraFreeAutoRotate) => {
    cameraFreeAutoRotate = _cameraFreeAutoRotate
  }

  // SET CAMERA FREE CONTROLS
  renderer.setCameraFreeControls = (useControls) => {
    if (useControls) {
      // renderer.cameraFree.inputs.addMouse()
      renderer.cameraFree.attachControl(canvas, true)

    } else {
      renderer.cameraFree.detachControl(canvas)
    }
    console.warn('FREE CAMERA CONTROL:', useControls)
  }

  ////////////////////////////////////////
  // PRIVATE
  let scene, layout, activeCameraName, cameraFreeAutoRotate

  // CREATE CAMERA
  const createCamera = () => {
    // Add a camera to the scene and attach it to the canvas
    const ratioBaseSize = CONFIG_RENDER_3D.cellSize * CONFIG.map.mapSize.width

    const camera = new BABYLON.ArcRotateCamera(
      'Camera',
      0, // alpha angle
      CONFIG_RENDER_3D.camera.beta, // beta angle
      ratioBaseSize * CONFIG_RENDER_3D.camera.distanceRatio, // radius (aka distance)
      new BABYLON.Vector3( // target
        0,
        // focus height is one stepsize above water level
        CONFIG_RENDER_3D.cellStepHeight * (CONFIG.map.mapSeaMinLevel + 1 + 1),
        0
      ),
      scene
    )
    // Attach control from canvas to the camera (pan, tilt...)
    // camera.attachControl(canvas, true)
    // Constrain camera rotation & zooming
    camera.lowerBetaLimit = 0
    camera.upperBetaLimit = Math.PI / 2
    // camera.lowerAlphaLimit = 0
    // camera.upperAlphaLimit = 0
    camera.lowerRadiusLimit = ratioBaseSize * CONFIG_RENDER_3D.camera.distanceRatioMin
    camera.upperRadiusLimit = ratioBaseSize * CONFIG_RENDER_3D.camera.distanceRatioMax

    return camera
  }

  // CREATE CAMERA FREE
  const createCameraFree = () => {
    // Add a camera to the scene and attach it to the canvas
    const ratioBaseSize = CONFIG_RENDER_3D.cellSize * CONFIG.map.mapSize.width

    const camera = new BABYLON.ArcRotateCamera(
      'Camera',
      0, // alpha angle
      CONFIG_RENDER_3D.camera.betaFreeCamera, // beta angle
      ratioBaseSize * CONFIG_RENDER_3D.camera.distanceRatioCameraFree, // radius (aka distance)
      new BABYLON.Vector3( // target
        0,
        // focus height is one stepsize above water level
        CONFIG_RENDER_3D.cellStepHeight * (CONFIG.map.mapSeaMinLevel + 1 + 1),
        0
      ),
      scene
    )
    // Attach control from canvas to the camera (pan, tilt...)
    // camera.attachControl(canvas, true)
    // Constrain camera rotation & zooming
    camera.lowerBetaLimit = 0
    camera.upperBetaLimit = Math.PI / 2
    // camera.lowerAlphaLimit = 0
    // camera.upperAlphaLimit = 0
    camera.lowerRadiusLimit = ratioBaseSize * CONFIG_RENDER_3D.camera.distanceRatioMin
    camera.upperRadiusLimit = ratioBaseSize * CONFIG_RENDER_3D.camera.distanceRatioMax

    return camera
  }

  // GET CAMERA FROM NAME
  const getCameraByName = (cameraName) => {
    return cameraName === 'camera' ? renderer.camera : renderer.cameraFree
  }

  ////////////////////////////////////////
  // INIT
  renderer.init = (rendererScene, rendererLayout) => {
    scene = rendererScene
    layout = rendererLayout

    // Create game cameras
    renderer.camera = createCamera()
    renderer.cameraFree = createCameraFree()

    // Set the active camera
    renderer.setActiveCamera(CONFIG_RENDER_3D.camera.activeCamera)

    // Set the free camera auto-rotation
    renderer.setCameraFreeAutorotate(CONFIG_RENDER_3D.camera.cameraFreeAutoRotate)
  }

  return renderer
}

export default Camera