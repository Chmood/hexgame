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
    const fitWidth = Math.floor(canvasWrapperWidth * (3 / 4) / (CONFIG.map.mapSize.width + 3)),
          fitHeight = Math.floor((canvasWrapperHeight / CONFIG.render2d.cellSizeRatio) / ((CONFIG.map.mapSize.height + 2) * Math.sqrt(3))),
          fitSize = Math.min(fitWidth, fitHeight)

    CONFIG.render2d.cellSizeBase = fitSize

    // Computed vars

    CONFIG.render2d.cellSize = {}
    CONFIG.render2d.cellSize.width = CONFIG.render2d.cellSizeBase
    CONFIG.render2d.cellSize.height = Math.floor(CONFIG.render2d.cellSizeBase * CONFIG.render2d.cellSizeRatio)

    CONFIG.render2d.mapDeepness = CONFIG.render2d.cellSizeBase / 4 // TODO: magic value!
  }

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

  main.start = () => {
    // CREATE THE GAME

    // GET DOM THINGS
    const dom = {}

    dom.canvas2d = document.getElementById('canvas2d')
    dom.canvas2dWrapper = document.getElementById('canvas2d-wrapper')
    dom.canvas3d = document.getElementById('canvas3d')

    dom.btnUpdate = document.getElementById('btn-update')
    dom.btnNew = document.getElementById('btn-new')

    // Auto-size canvas
    main.sizeGame(CONFIG, dom.canvas2dWrapper)

    main.ctx = dom.canvas2d.getContext('2d')

    main.game = Game(main.ctx, dom.canvas3d, CONFIG)
    main.game.map.randomizeSeed()
    main.game.generate()

    // Set canvas size
    main.sizeCanvas(dom.canvas2d, main.game)

    // Dom UI
    main.domui = DomUI(main.game, dom, main)

    ////////////////////////////////
    // LAUCH LOOP

    // 2D: Initial rendering
    main.game.renderer2d.render()
    // 3D: Start engine!
    main.game.renderer3d.startRenderLoop()
  }

  window.onload = () => {
    main.start()
  }	// End window.onload

  return main
}

export default Main