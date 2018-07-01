# TODO

## Known bugs

* [CRITICAL] Removing a (loosing) player seems to break the bot routine!
* Switching post-processing ('multi'/'ssao') cause lignting issues (too dark / too bright)
* Tanks are floating above the ground, and their rotation doesn't follow the underneath tile (and the health bar has issues too, it shouldn't lean with its unit, but stay stricly above it)

## Improvements

* Camera moves too much, following the action: make it follow a "box" to dampen it
* Improve Random Number Generator (https://github.com/davidbau/seedrandom)
* Tank orientation (rotation on local Y axis) sometimes is sub-optimal (ex: 4/6th turn instead or 2/6th turn)
* Bots playing seems to dezoom the camera???
* Get the Asset Manager thing up to work
* OOP/prototype: make 'class methods' (single function for all instances)

### More units!

7/19 unit types - See: http://advancewars.wikia.com/wiki/List_of_Units and http://advancewars.wikia.com/wiki/Category:Units

* 2x infantry: soldier, healer)
* 2x tanks: heavy tank, anti-air tank
* 3x distance: artillery (mid range), rocket-launcher (long range, 'move or fire'), anti-air missile launcher
* 2x boats: cruiser, submarine
* 3x support units: ground transport, sea transport, air transport

## New features

* New DOM element: unit/terrain/building info panel
* Roads and bridges???
* Terrain defense bonus/malus
* Explosion for unit destruction (see: https://doc.babylonjs.com/how_to/solid_particle_system)
* Unit parts animations (idle, shoot, move...)
* 2D map: different icons for units???
* Fog of war & unit vision range???
* Fullscreen mode
* Joypad support
* Sound and music support
* Log all game actions, and replay a game (and undo/redo???)
* Client-server refactor, network playing
* Find a real name for the game: "Hex Wars", "Hex Emblem"...

## Ideas

* Fire with particles - See: http://www.babylonjs-playground.com/#1DZUBR
* Clouds - See: https://www.babylonjs-playground.com/#ATDL99#0
* Boolean mesh - See: https://www.babylonjs-playground.com/#T6NP3F#0
* Animated skybox - See: https://www.babylonjs-playground.com/#E6OZX#122 and https://doc.babylonjs.com/extensions/sky
* Environnement - See: https://doc.babylonjs.com/babylon101/environment
* Custom GLSL shaders - See: https://www.eternalcoding.com/?p=113

