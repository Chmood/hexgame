////////////////////////////////////////////////////////////////////////////////
// HEXGAME PROJECT
////////////////////////////////////////////////////////////////////////////////

import CONFIG from './lib/config'
import Game from './lib/game'
import DomUI from './lib/dom-ui'

////////////////////////////////////////////////////////////////////////////////
// MAIN

const Main = () => {
  const main = {}

  main.sizeGame = (CONFIG, canvasWrapper) => {
    const canvasWrapperWidth = canvasWrapper.offsetWidth,
      canvasWrapperHeight = canvasWrapper.offsetHeight

    // TODO: better & more accurate
    // Topped
    const fitWidth = Math.floor(canvasWrapperWidth * (3 / 4) / (CONFIG.map.mapSize.width + 3))
    const fitHeight = Math.floor((canvasWrapperHeight / CONFIG.render.cellSizeRatio) / ((CONFIG.map.mapSize.height + 2) * Math.sqrt(3)))
    const fitSize = Math.min(fitWidth, fitHeight)

    CONFIG.render.cellSizeBase = fitSize

    // Computed vars

    CONFIG.render.cellSize = {}
    CONFIG.render.cellSize.width = CONFIG.render.cellSizeBase
    CONFIG.render.cellSize.height = Math.floor(CONFIG.render.cellSizeBase * CONFIG.render.cellSizeRatio)

    CONFIG.render.mapDeepness = CONFIG.render.cellSizeBase / 4 // TODO: magic value!
  }

  main.sizeCanvas = (canvas, game) => {
    canvas.width = game.renderer.mapRenderSize.width
    canvas.height = game.renderer.mapRenderSize.height

    // Get canvas offset (from top-left viewport corner)
    // (the canvas is supposed to be positionned in CSS)
    game.renderer.canvasOffset = {
      x: canvas.offsetLeft,
      y: canvas.offsetTop
    }
  }

  main.start = () => {
    // CREATE THE GAME

    // GET DOM THINGS
    const dom = {}

    dom.canvas2d = document.getElementById('canvas')
    dom.canvas2dWrapper = document.getElementById('canvas-wrapper')
    dom.canvas3d = document.getElementById('renderCanvas')

    dom.btnGenerate = document.getElementById('generate')
    dom.btnRandomSeed = document.getElementById('random-seed')

    // Auto-size canvas
    main.sizeGame(CONFIG, dom.canvas2dWrapper)

    main.ctx = dom.canvas2d.getContext('2d')

    main.game = Game(CONFIG, main.ctx, dom.canvas3d)
    main.game.map.randomizeSeed()
    main.game.generate()

    // Set canvas size
    main.sizeCanvas(dom.canvas2d, main.game)

    // ANIMATION LOOP
    main.render = () => {
      main.game.renderer.drawMap(
        main.ctx,
        CONFIG.map.mapTopped,
        CONFIG.map.mapParity,
        CONFIG.render.mapDeepness,
        CONFIG.render.mapRangeScale)
    }

    // Dom UI
    main.domui = DomUI(main.game, dom, main.sizeGame, main.sizeCanvas, main.render)

    // LAUCH LOOP

    // 2D
    // Initial rendering
    main.render()

    // 3D
    // Register a render loop to repeatedly render the scene
    main.game.renderer3d.engine.runRenderLoop(() => {
      main.game.renderer3d.scene.render()
    })
  }

  window.onload = () => {
    main.start()
  }	// End window.onload


  return main
}

export default Main