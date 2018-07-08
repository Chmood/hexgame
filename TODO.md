# TODO

## Known bugs

* [CRITICAL] Removing a (loosing) player seems to break the bot routine!
* Sometimes (!) keybord is broken, cursor moves on all keys (keys[] broken?)
* Switching post-processing ('multi'/'ssao') cause lighting issues (too dark / too bright)
* Tanks are floating above the ground, and their rotation doesn't follow the underneath tile (and the health bar has issues too, it shouldn't lean with its unit, but stay stricly above it)
* bot units sometimes move an incredibly long path to attack (validate move) [TO BE CONFIRMED]
* Units can be built on occupied factories / port / airport??? [TO BE CONFIRMED]

## Improvements

* 'move or fire' unit mode
* Not healing air units in buildings (only in airports), and healing naval units in ports
* Healing for bot units too
* Bots target hysteresis looks inverted (or plain broken)
* Focus buildings with potential action too (factories, ports and airports)
* Flying units must be able to pass over ground unit (less strict A* blacklist)
* Improve Random Number Generator (https://github.com/davidbau/seedrandom)
* Unit orientation (rotation on local Y axis) sometimes is sub-optimal (ex: 4/6th turn instead or 2/6th turn)
* Bots playing seems to dezoom the camera???
* Get the Asset Manager thing up to work

## New features

* New DOM element: unit/terrain/building info panel
* Roads and bridges???
* Fog of war & unit vision range???
* 2D map: different icons for units???

## Later

* Joypad support
* Sound and music support
* Log all game actions, and replay a game (and undo/redo???)
* A real state
* Client-server refactor, network playing (see Colyseus or Pomelo)
* Find a real name for the game: "Hex Wars", "Hex Emblem"...
* OOP/prototype: make 'class methods' (single function for all instances)

## Ideas

* Unit parts animations (idle, shoot, move...)
* Explosion for unit destruction (see: https://doc.babylonjs.com/how_to/solid_particle_system)
* Fire with particles - See: http://www.babylonjs-playground.com/#1DZUBR
* Clouds - See: https://www.babylonjs-playground.com/#ATDL99#0
* Boolean mesh - See: https://www.babylonjs-playground.com/#T6NP3F#0
* Animated skybox - See: https://www.babylonjs-playground.com/#E6OZX#122 and https://doc.babylonjs.com/extensions/sky
* Environnement - See: https://doc.babylonjs.com/babylon101/environment
* Custom GLSL shaders - See: https://www.eternalcoding.com/?p=113
* Advance wars unit types - See: http://advancewars.wikia.com/wiki/List_of_Units and http://advancewars.wikia.com/wiki/Category:Units

