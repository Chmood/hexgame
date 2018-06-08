import HEXLIB from '../vendor/hexlib.js'
import CONFIG from './config'

////////////////////////////////////////////////////////////////////////////////
// DOM UI

const DomUI = (game, dom, main) => {

  const domui = {}


  // USER INPUT EVENTS

  // UPDATE CURSOR
  domui.updateCursor = (cursorHex) => {
    if (!HEXLIB.hexEqual(cursorHex, game.ui.cursor)) {
      game.renderer3d.lowlightCursor() // Remove the old cursor
      game.renderer3d.highlightLine() // Re-draw line in case cursor lowlight has erased it
      game.ui.cursor = cursorHex // Backup the nex cursor
      main.render2d() // Update 2d map
      game.renderer3d.highlightCursor() // Draw the new cursor
    }
  }

  // Mouse move on 2D canvas
  dom.canvas2d.addEventListener('mousemove', (e) => {
    const cursorHex = game.renderer2d.plotCursor(e)
    domui.updateCursor(cursorHex)
  })

  // Mouse move on 3D canvas
  window.addEventListener('mousemove', (e) => { 
  	// We try to pick an object
  	var pick = game.renderer3d.scene.pick(game.renderer3d.scene.pointerX, game.renderer3d.scene.pointerY)
  	if (pick.hit) {
      if (pick.pickedMesh) {
        const idFragments = pick.pickedMesh.id.split('-'),
              x = parseInt(idFragments[1]),
              y = parseInt(idFragments[2]),
              cursorOffset = HEXLIB.hexOffset(x, y),
              cursorHex = HEXLIB.offset2Hex(cursorOffset, CONFIG.map.mapTopped, CONFIG.map.mapParity)
              
        domui.updateCursor(cursorHex)
      }
  	}
  }) 

  dom.canvas2d.addEventListener('click', (e) => {
    game.onUIClick(game.renderer.plotCursor(e))
    main.render2d()
  })

  dom.btnUpdate.addEventListener('click', () => {
    game.generate()
    main.render2d()
  })

  dom.btnNew.addEventListener('click', () => {
    game.map.randomizeSeed()
    game.generate()
    main.render2d()
  })

  window.onresize = () => {
    main.sizeGame(CONFIG, dom.canvas2dWrapper)
    game.renderer.init()
    main.sizeCanvas(dom.canvas2d, game)
    game.renderer3d.engine.resize()

    main.render2d()
  }

}  

export default DomUI
