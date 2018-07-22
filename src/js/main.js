////////////////////////////////////////////////////////////////////////////////
// HEXGAME PROJECT
////////////////////////////////////////////////////////////////////////////////

import CONFIG_RENDER_2D from './config/render2d'
import Game from './lib/game'
import DomUI from './lib/dom-ui'

////////////////////////////////////////////////////////////////////////////////
// MAIN

const Main = () => {
  const main = {}

  ////////////////////////////////
  // SIZING 2D THINGS

  // SIZE 2D MAP
  const size2dMap = (canvasWrapper, game) => {
    const canvasWrapperWidth = canvasWrapper.offsetWidth,
          canvasWrapperHeight = canvasWrapper.offsetHeight

    // TODO: better & more accurate
    if (game) {
      // Topped
      const fitWidth = Math.floor(canvasWrapperWidth * (3 / 4) / (game.CONFIG.map.mapSize.width + 3)),
            fitHeight = Math.floor((canvasWrapperHeight / CONFIG_RENDER_2D.cellSizeRatio) / ((game.CONFIG.map.mapSize.height + 2) * Math.sqrt(3))),
            fitSize = Math.min(fitWidth, fitHeight)
  
      // Computed vars
      game.renderer2d.cellSizeBase = fitSize
      game.renderer2d.cellSize = {}
      game.renderer2d.cellSize.width = game.renderer2d.cellSizeBase
      game.renderer2d.cellSize.height = Math.floor(game.renderer2d.cellSizeBase * CONFIG_RENDER_2D.cellSizeRatio)
    }
  }

  // SIZE CANVAS
  const size2dCanvas = (canvas, game) => {
    if (game) {
      canvas.width = game.renderer2d.mapRenderSize.width
      canvas.height = game.renderer2d.mapRenderSize.height
  
      // Get canvas offset (from top-left viewport corner)
      // (the canvas is supposed to be positionned in CSS)
      game.renderer2d.canvasOffset = {
        x: canvas.offsetLeft,
        y: canvas.offsetTop
      }
    }
  }

  // SET SIZE (public?)
  // Size all the things
  main.setSize = () => {
    size2dMap(dom.canvas2dWrapper, main.game)
    size2dCanvas(dom.canvas2d, main.game)
  }

  ////////////////////////////////
  // INIT

  const dom = DomUI(), // DOM (and init Vue JS)
        // Canvases
        ctx2d = dom.canvas2d.getContext('2d'),
        canvas3d = dom.canvas3d
  
  // CREATE THE GAME
  // The game knows about the DOM, the main (his "parent") and both canvases
  main.game = Game(ctx2d, canvas3d, dom, main)
  // Now we've got both renderers, and game CONFIG object

  // Set DOM game reference
  dom.setGame(main.game)

  // Init the game
  // main.game.init()

  // // 2D
  // window.setTimeout(() => {
  //   // Size 2D map
  //   size2dMap(dom.canvas2dWrapper, main.game)
  //   // Set 2D canvas size
  //   size2dCanvas(dom.canvas2d, main.game)
  
  //   // 2D: Initial rendering
  //   main.game.renderer2d.render()
  //   main.game.updateRenderers(['resize'])
  // }, 5000)

  return main
}

export default Main