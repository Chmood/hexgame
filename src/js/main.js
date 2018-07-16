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

  // SIZE 2D MAP
  const size2dMap = (canvasWrapper) => {
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
  const size2dCanvas = (canvas, game) => {
    canvas.width = game.renderer2d.mapRenderSize.width
    canvas.height = game.renderer2d.mapRenderSize.height

    // Get canvas offset (from top-left viewport corner)
    // (the canvas is supposed to be positionned in CSS)
    game.renderer2d.canvasOffset = {
      x: canvas.offsetLeft,
      y: canvas.offsetTop
    }
  }

  // SET SIZE (public?)
  // Size all the things
  main.setSize = () => {
    size2dMap(dom.canvas2dWrapper)
    size2dCanvas(dom.canvas2d, main.game)
  }

  ////////////////////////////////
  // INIT

  // CREATE DOM THINGS (Vue JS)
  const dom = DomUI()

  // CREATE THE GAME
  const ctx2d = dom.canvas2d.getContext('2d'),
        canvas3d = dom.canvas3d

  // Size 2D map
  // Must come BEFORE game creation
  size2dMap(dom.canvas2dWrapper)
  
  main.game = Game(ctx2d, canvas3d, dom, main)

  // Set DOM game reference
  dom.setGame(main.game)

  // Set 2D canvas size
  size2dCanvas(dom.canvas2d, main.game)

  // 2D: Initial rendering
  main.game.renderer2d.render()

  return main
}

export default Main