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

  ////////////////////////////////
  // SIZING THINGS

  // SIZE GAME
  main.sizeGame = (canvasWrapper) => {
    const canvasWrapperWidth = canvasWrapper.offsetWidth,
          canvasWrapperHeight = canvasWrapper.offsetHeight

    // TODO: better & more accurate
    // Topped
    const fitWidth = Math.floor(canvasWrapperWidth * (3 / 4) / (CONFIG.map.mapSize.width + 3)),
          fitHeight = Math.floor((canvasWrapperHeight / CONFIG.render2d.cellSizeRatio) / ((CONFIG.map.mapSize.height + 2) * Math.sqrt(3))),
          fitSize = Math.min(fitWidth, fitHeight)

    CONFIG.render2d.cellSizeBase = fitSize

    // Computed vars
    CONFIG.render2d.cellSize = {}
    CONFIG.render2d.cellSize.width = CONFIG.render2d.cellSizeBase
    CONFIG.render2d.cellSize.height = Math.floor(CONFIG.render2d.cellSizeBase * CONFIG.render2d.cellSizeRatio)
  }

  // SIZE CANVAS
  main.sizeCanvas = (canvas, game) => {
    canvas.width = game.renderer2d.mapRenderSize.width
    canvas.height = game.renderer2d.mapRenderSize.height

    // Get canvas offset (from top-left viewport corner)
    // (the canvas is supposed to be positionned in CSS)
    game.renderer2d.canvasOffset = {
      x: canvas.offsetLeft,
      y: canvas.offsetTop
    }
  }

  // RESIZE ALL THINGS
  main.setSize = () => {
    main.sizeGame(main.domUI.canvas2dWrapper)
    main.sizeCanvas(main.domUI.canvas2d, main.game)
  }

  // START
  main.start = () => {

    // GET DOM THINGS
    main.domUI = DomUI()

    // Auto-size canvas
    main.sizeGame(main.domUI.canvas2dWrapper)
    main.ctx = main.domUI.canvas2d.getContext('2d')
    
    ////////////////////////////////
    // CREATE THE GAME

    main.game = Game(main.ctx, main.domUI.canvas3d, main.domUI, main)
    main.game.init()
    main.domUI.setGame(main.game)

    // Set canvas size
    main.sizeCanvas(main.domUI.canvas2d, main.game)

    ////////////////////////////////
    // LAUCH LOOP

    // 2D: Initial rendering
    main.game.renderer2d.render()
    // 3D: Start engine!
    // Will be fired in renderer3d, when all assets finished loading
    // main.game.renderer3d.startRenderLoop()
  }

  // WINDOW ON LOAD
  window.onload = () => {
    main.start()
  }

  return main
}

export default Main