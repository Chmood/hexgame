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
      game.ui.cursor = cursorHex // Backup the new cursor
      game.renderer3d.updateHighlights() // Draw the new 3d cursor
      game.renderer2d.render() // Update 2d canvas too
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

  // CLICK ON CANVASES

  dom.canvas2d.addEventListener('click', (e) => {
    game.onUIClick(game.renderer2d.plotCursor(e))
    game.renderer2d.render()
  })

  dom.canvas3d.addEventListener('click', (e) => {
    // game.onUIClick(game.renderer2d.plotCursor(e))
    // game.renderer3d.render()
  })

  // UI BUTTONS

  dom.btnUpdate.addEventListener('click', () => {
    game.generate()
    game.renderer2d.render()
  })

  dom.btnNew.addEventListener('click', () => {
    game.map.randomizeSeed()
    game.generate()
    game.renderer2d.render()
  })

  window.onresize = () => {
    main.sizeGame(CONFIG, dom.canvas2dWrapper)
    game.renderer2d.init()
    main.sizeCanvas(dom.canvas2d, game)
    game.renderer2d.render()
    game.renderer3d.engine.resize()
  }
}  

export default DomUI
