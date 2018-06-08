import HEXLIB from '../vendor/hexlib.js'
import CONFIG from './config'

////////////////////////////////////////////////////////////////////////////////
// DOM UI

const DomUI = (game, dom, main) => {

  const domui = {}


  // USER INPUT EVENTS
  dom.canvas2d.addEventListener('mousemove', (e) => {
    const cursor = game.renderer.plotCursor(e)
    if (!HEXLIB.hexEqual(cursor, game.ui.cursor)) {
      game.ui.cursor = cursor
      main.render2d()
    }
  })

  // window.addEventListener('click', (e) => { 
  // 	// We try to pick an object
  // 	var pickResult = game.renderer3d.scene.pick(game.renderer3d.scene.pointerX, game.renderer3d.scene.pointerY)
  // 	if (pickResult.hit) {
  // 		console.log(pickResult)
  // 		// const cursor = game.renderer.plotCursor(e)
  // 	}
  // 	// if (! HEXLIB.hexEqual(cursor, game.ui.cursor)) {
  // 	// 	game.ui.cursor = cursor
  // 	// 	render()
  // 	// }
  // }) 

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
