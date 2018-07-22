const RENDER_3D = {

  // Terrain
  cellSize: 1,
  cellStepHeight: 0.5,
  randomTileSizeFactor: 0.15,
  randomTileSizeOffset: 0, // 1 => only smaller / 0.5 => smaller & bigger / 0 => only bigger
  randomTileRotation: false, // Shall we random rotate the tiles
  randomTileRotationFactor: 1, // 0 : flat / 1 : sloppy / 2 : chaos
  shinyIce: true,
  transparentIce: false,

  // Environement
  worldSize: 4096, // Used for skybox and ocean
  showAxis: false,
  betterOcean: false,

  // Render quality options
  postprocess: 'ssao', // 'ssao', 'multi' or 'none'
  shadows: false,
  healthbars: {
    width: 1 / 20, // Relative to cellsize (one HP width)
    height: 1 / 5, // Relative to cellsize
    heightAbove: 2, // Relative to cellsize (vertical distance from unit)
    colorBack: '#cc4444',
    colorFront: '#44cc44'
  },

  // Camera
  camera: {
    distanceRatio: 1, // Size of the map / camera distance (radius)
    distanceRatioCameraFree: 2, // Size of the map / camera distance (radius)
    distanceRatioMin: 0.1,
    distanceRatioMax: 2,
    distanceRatioStep: 0.25,
    beta: Math.PI / 6, // 0 : top-down / Math.PI / 2 : side view 
    betaFreeCamera: Math.PI / 3, // 0 : top-down / Math.PI / 2 : side view 
    activeCamera: 'camera', // 'camera' or 'cameraFree'
    cameraFreeAutoRotate: false,
    cameraDampbox: true, // Make the camera less shaky
    cameraDampboxRatio: 4 // Relates to number of visible cells on screen
  }
}

export default RENDER_3D
