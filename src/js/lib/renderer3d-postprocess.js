import BABYLON from 'babylonjs'

////////////////////////////////////////////////////////////////////////////////
// RENDERER 3D POSTPROCESS

const Postprocess = (CONFIG_RENDER_3D) => {

  const renderer = {}

  ////////////////////////////////////////
  // PUBLIC

  // UPDATE POSTPROCESS PIPELINE
  renderer.updatePosprocessPipeline = (_postprocess, _activeCamera) => {
    if (_postprocess) {
      postprocess = _postprocess
    }
    if (_activeCamera) {
      activeCamera = _activeCamera
    }

    // Clear all postprocesses
    clearAllPostprocess()

    if (postprocess !== 'none') {

      // SSAO POSTPROCESSING
      if (postprocess === 'ssao') {
        // See: https://doc.babylonjs.com/how_to/using_the_ssao_rendering_pipeline

        // Lens rendering pipeline
        // lensEffect = new BABYLON.LensRenderingPipeline(
        //   'lensEffects', 
        //   {
        //     edge_blur: 0.25,
        //     chromatic_aberration: 1.0,
        //     distortion: 1.0,
        //     grain_amount: 1.0,
        //     dof_focus_distance: 30,
        //     dof_aperture: 1
        //   }, 
        //   scene, 
        //   1.0, 
        //   camera
        // )
    
        ssao = new BABYLON.SSAORenderingPipeline(
          'ssao-pipeline', 
          scene, 
          {
            ssaoRatio: 1,
            combineRatio: 1.0
          },
          [activeCamera]
        )

      // MULTI POSTPROCESSING
      } else if (postprocess === 'multi') {

        // DEFAULT RENDER PIPELINE
        multi = new BABYLON.DefaultRenderingPipeline(
          "default-pipeline", // The name of the pipeline
          true, // Do you want HDR textures ?
          scene, // The scene instance
          [activeCamera] // The list of cameras to be attached to
        )
        // Base
        multi.samples = 4 // The MSAA antialiasing
        multi.fxaaEnabled = true // The FXAA antialiasing 

        // // D.O.F.
        // multi.depthOfFieldEnabled = true
        // multi.depthOfFieldBlurLevel = BABYLON.DepthOfFieldEffectBlurLevel.Low
        // multi.depthOfField.focusDistance  = 2000 // distance of the current focus point from the camera in millimeters considering 1 scene unit is 1 meter
        // multi.depthOfField.focalLength  = 50 // focal length of the camera in millimeters
        // multi.depthOfField.fStop  = 1.4 // aka F number of the camera defined in stops as it would be on a physical device

        // // Sharpening
        // multi.sharpenEnabled = true
        // multi.sharpen.edgeAmount = 0.5
        // multi.sharpen.colorAmount = 0.5

        // Bloom
        multi.bloomEnabled = true
        multi.bloomThreshold = 0.8
        multi.bloomWeight = 0.3
        multi.bloomKernel = 64
        multi.bloomScale = 1

        // Chromatic aberration
        multi.chromaticAberrationEnabled = true
        multi.chromaticAberration.aberrationAmount = 500;
        multi.chromaticAberration.radialIntensity = 3;
        var rotation = Math.PI;
        multi.chromaticAberration.direction.x = Math.sin(rotation)
        multi.chromaticAberration.direction.y = Math.cos(rotation)

        // Grain
        multi.grainEnabled = true
        multi.grain.intensity = 9
        multi.grain.animated = 0.1
      }
    }
  }

  ////////////////////////////////////////
  // PRIVATE

  let scene, camera, cameraFree, postprocess, activeCamera, multi, ssao

  const clearAllPostprocess = () => {
    if (ssao) {
      // Disable SSAO
      // The 'true' argument is needed. The documentation says: "SSAO uses the depth map renderer and activates it by default. You can disable the depth map renderer by passing "true" as argument in the dispose() method"
      // See: https://doc.babylonjs.com/how_to/using_the_ssao_rendering_pipeline
      ssao.dispose(true)
      ssao = undefined
    }
    if (multi) {
      // Disable pipeline
      multi.dispose()
      multi = undefined
    }
  }

  ////////////////////////////////////////
  // INIT
  renderer.init = (rendererScene, rendererCamera, rendererCameraFree) => {
    scene = rendererScene
    camera = rendererCamera
    cameraFree = rendererCameraFree

    activeCamera = CONFIG_RENDER_3D.camera.activeCamera === 'camera' ? camera : cameraFree
    renderer.updatePosprocessPipeline(CONFIG_RENDER_3D.postprocess)
  }

  return renderer
}

export default Postprocess