# TODO

## Known bugs

* Removing a (loosing) player seems to break the bot routine
* Improve post-processing when camera switch (SSAO is fucked up)
* Tanks are floating above the ground, and their rotation doesn't follow the underneath tile (and the health bar has issues too, it shouldn't lean with its unit)

## Improvements

* In-game menu
* Player can cancel a move while targetting (ala Fire Emblem)
* Improve Random Number Generator (https://github.com/davidbau/seedrandom)
* Tank orientation (rotation on local Y axis) sometimes is sub-optimal (ex: 4/6th turn instead or 2/6th turn)

* Move the keyboard debounce from renderer3d into game
* Get the Asset Manager thing up to work
* Make all modules' methods (like module.method()) 'private' by default
* Stop mutating the CONFIG object! (postprocess + environement)

## New features

* Fullscreen mode
* Joypad support

## Ideas

* Clouds - See: https://www.babylonjs-playground.com/#ATDL99#0
* Boolean mesh - See: https://www.babylonjs-playground.com/#T6NP3F#0
* Animated skybox - See: https://www.babylonjs-playground.com/#E6OZX#122 and https://doc.babylonjs.com/extensions/sky
* Environnement - See: https://doc.babylonjs.com/babylon101/environment

