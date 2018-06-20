# hexgame

Hexagonal fun and 3D procedural terrain. This is a work-in-progress game, freely inspired by [Advance Wars](https://en.wikipedia.org/wiki/Advance_Wars) and [Fire Emblem series](https://en.wikipedia.org/wiki/Fire_Emblem).

Live demo: [https://chmood.github.io/hexgame/](https://chmood.github.io/hexgame/)

## Features

* Hexagonal map done right, with the help of HEXLIB (see [the source code](https://github.com/Chmood/hexgame/blob/master/src/js/vendor/hexlib.js) )
* Rich procedural terrain generation, with [noise.js](https://github.com/josephg/noisejs)
* Multiple biomes, depending on both elevation and moisture
* Island mode
* A-star pathfinding
* [BabylonJS](https://www.babylonjs.com/) 3D rendering + 2D canvas minimap
* Webpack ES6 modules bundling and building

## Credits

Massive kudos go to Amit Patel (aka [@redblobgames](https://twitter.com/redblobgames)) for his incredibly informative blog [redblobgames.com](https://www.redblobgames.com/maps/terrain-from-noise/), especially the precious tips on [Making maps with noise functions](https://www.redblobgames.com/maps/terrain-from-noise/) and [Hexagonal grids](https://www.redblobgames.com/grids/hexagons/).