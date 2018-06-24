# TODO

## Known bugs

* [CRITICAL] Removing a (loosing) player seems to break the bot routine!
* Improve post-processing when camera switch (SSAO is fucked up)
* Tanks are floating above the ground, and their rotation doesn't follow the underneath tile (and the health bar has issues too, it shouldn't lean with its unit, but stay stricly above it)

## Improvements

* Player must be able to cancel a move while targetting (ala Fire Emblem)
* Improve Random Number Generator (https://github.com/davidbau/seedrandom)
* Tank orientation (rotation on local Y axis) sometimes is sub-optimal (ex: 4/6th turn instead or 2/6th turn)
* Bots playing seems to dezoom the camera???
* Get the Asset Manager thing up to work
* Stop mutating the CONFIG object! (postprocess + environement)

## New features

* More DOM UI (menus, stats...)
* Explosion for unit destruction (see: https://doc.babylonjs.com/how_to/solid_particle_system)
* "Player XXX's turn" banner (see: https://doc.babylonjs.com/how_to/dynamictexture)
* In-game menu
* 2D map: different icons for units
* Fullscreen mode
* Joypad support
* Find a real name for the game: "Hex Wars", "Hex Emblem"...

## Ideas

* Fire with particles - See: http://www.babylonjs-playground.com/#1DZUBR
* Clouds - See: https://www.babylonjs-playground.com/#ATDL99#0
* Boolean mesh - See: https://www.babylonjs-playground.com/#T6NP3F#0
* Animated skybox - See: https://www.babylonjs-playground.com/#E6OZX#122 and https://doc.babylonjs.com/extensions/sky
* Environnement - See: https://doc.babylonjs.com/babylon101/environment

