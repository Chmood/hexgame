import BABYLON from 'babylonjs'
import CONFIG from './config.js'

////////////////////////////////////////////////////////////////////////////////
// RENDERER 3D POSTPROCESS

const Postprocess = () => {

  const renderer = {}

  ////////////////////////////////////////
  // PUBLIC

  // UPDATE POSTPROCESS PIPELINE
  renderer.updatePosprocessPipeline = () => {
    if (CONFIG.render3d.postprocess !== 'none') {
      if (CONFIG.render3d.postprocess === 'ssao') {
        if (pipeline) {
          // Disable pipeline
          pipeline.dispose()
          pipeline = undefined
        }

        // Post-process
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
          [camera, cameraFree]
        )

      } else if (CONFIG.render3d.postprocess === 'multi') {
        if (ssao) {
          // Disable SSAO
          ssao.dispose()
          ssao = undefined
        }

        // DEFAULT RENDER PIPELINE
        pipeline = new BABYLON.DefaultRenderingPipeline(
          "default-pipeline", // The name of the pipeline
          true, // Do you want HDR textures ?
          scene, // The scene instance
          [camera, cameraFree] // The list of cameras to be attached to
        )
        // Base
        pipeline.samples = 4
        pipeline.fxaaEnabled = true
        // // D.O.F.
        // pipeline.depthOfFieldEnabled = true
        // pipeline.depthOfFieldBlurLevel = BABYLON.DepthOfFieldEffectBlurLevel.Low;
        // pipeline.depthOfField.focusDistance  = 2000; // distance of the current focus point from the camera in millimeters considering 1 scene unit is 1 meter
        // pipeline.depthOfField.focalLength  = 50; // focal length of the camera in millimeters
        // pipeline.depthOfField.fStop  = 1.4; // aka F number of the camera defined in stops as it would be on a physical device
        // Sharpen
        // pipeline.sharpenEnabled = true
        // pipeline.sharpen.edgeAmount = 0.9;
        // Bloom
        pipeline.bloomEnabled = true
        pipeline.bloomThreshold = 0.8
        pipeline.bloomWeight = 0.3
        pipeline.bloomKernel = 64
        pipeline.bloomScale = 1
        // Chromatic aberration
        pipeline.chromaticAberrationEnabled = true
        pipeline.chromaticAberration.aberrationAmount = 500;
        pipeline.chromaticAberration.radialIntensity = 3;
        var rotation = Math.PI;
        pipeline.chromaticAberration.direction.x = Math.sin(rotation)
        pipeline.chromaticAberration.direction.y = Math.cos(rotation)
        // Grain
        pipeline.grainEnabled = true
        pipeline.grain.intensity = 9
        pipeline.grain.animated = 1
      }
    } else {
      if (ssao) {
        // Disable SSAO
        ssao.dispose()
        ssao = undefined
      }
      if (pipeline) {
        // Disable pipeline
        pipeline.dispose()
        pipeline = undefined
      }
    }
  }

  ////////////////////////////////////////
  // PRIVATE

  let scene, camera, cameraFree, pipeline, ssao

  ////////////////////////////////////////
  // INIT
  // Will be firead later (when scene will be ready)
  renderer.init = (rendererScene, rendererCamera, rendererCameraFree) => {
    scene = rendererScene
    camera = rendererCamera
    cameraFree = rendererCameraFree
  }

  return renderer
}

export default Postprocess