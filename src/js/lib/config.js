import HEXLIB from '../vendor/hexlib'

////////////////////////////////////////////////////////////////////////////////
// CONFIGURATION

// Unit type shortcuts
const artilleryTypes = ['soldier', 'bazooka', 'healer'],
      tankTypes = ['jeep', 'artillery', 'tank', 'heavy-tank', 'antiair-tank', 'rocket-launcher'],
      navalTypes = ['cruiser', 'battleship', 'submarine'],
      airTypes = ['helicopter', 'fighter', 'bomber']

const CONFIG = {
  map: {
    seed: 'staticmapseed', // undefined for a random seed
    // mapSize: 						{ width: 29, height: 25 }, // Logical map size, in cells
    mapSize: { width: 27, height: 27 }, // Logical map size, in cells
    // mapTopped: Math.random() > 0.5 ? HEXLIB.FLAT : HEXLIB.POINTY, // HEXLIB.FLAT or HEXLIB.POINTY
    mapTopped: HEXLIB.FLAT, // HEXLIB.FLAT or HEXLIB.POINTY
    mapParity: Math.random() > 0.5 ? HEXLIB.EVEN : HEXLIB.ODD, // HEXLIB.EVEN or HEXLIB.ODD
    // mapParity: HEXLIB.EVEN, // HEXLIB.EVEN or HEXLIB.ODD

    mapSeaMinLevel: 2, // Sea is flat below this value
    mapValueRange: {
      height: 12,
      moisture: 5
    },
    mapNoise: {
      height: {
        stupidRandom: false,
        frequencyRatio: 0.45, // Noise base size
        frequency: undefined, // To be computed later
        harmonics: [0.5, 0.3, 0.2] // Amplitude of noise octaves 0, 1 and 2 (must sum up to 1)
      },
      moisture: {
        stupidRandom: false,
        frequencyRatio: 0.72, // Noise base size
        frequency: undefined, // To be computed later
        harmonics: [0.7, 0.2, 0.1] // Amplitude of noise octaves 0, 1 and 2 (must sum up to 1)
      }
    },
    mapPostprocess: {
      height: {
        revert: false,
        redistributionPower: 2, // >1 => more sea / <1 more mountains
        normalize: true, // Spread the whole height range
        islandMode: true, // All map borders are sea
        islandRedistributionPower: 0.85,
        islandMargin: 0 // numbers of ocean cells at map boundaries
      },
      moisture: {
        revert: false,
        redistributionPower: 1,
        normalize: true, // Spread the whole value range
        islandMode: false // All map borders have zero moisture (useless)
      }
    },
    terrain: {
      deepsea: { color: '#000044' }, // 0
      sea: { color: '#0000aa' }, // 1
      shore: { color: '#0011ff' }, // 2

      whitebeach: { color: '#ffffcc' }, // 3
      beach: { color: '#eeee44' }, // 3
      swamp: { color: '#666600' }, // 3

      desert: { color: '#e8c789' }, // 4
      grass: { color: '#88cc00' }, // 4 & 5
      plain: { color: '#449900' }, // 4 & 5 & 6

      forest: { color: '#006600' }, // 5 & 6 & 7
      deepforest: { color: '#003300' }, // 6 & 7
      pineforest: { color: '#194d60' }, // 6 & 7 & 8

      mountain: { color: '#aaaaaa' }, // 8
      highmountain: { color: '#666666' }, // 8

      scorched: { color: '#ddddcc' },
      snow: { color: '#ffffff' }, // 10

      ice: { color: '#ccffff' } // 11
    }
  },
  // TODO: MOVE INTO DEDICATED CONFIG FILE
  render2d: {
    cellSizeRatio: 6 / 6,	// perspective cell height diminution ratio
    displayTileText: true, // debug tiles cost / height
    cellSizeBase: undefined,	// base size of a cell in px // COMPUTED (on DOM ready)
    cellSize: undefined // size of the cell // COMPUTED (on DOM ready)
  },
  render3d: {
    // Terrain
    cellSize: 1,
    cellStepHeight: 0.5,
    randomTileSizeFactor: 0.15,
    randomTileSizeOffset: 0, // 1 => only smaller / 0.5 => smaller & bigger / 0 => only bigger
    randomTileRotation: false, // Shall we random rotate the tiles
    randomTileRotationFactor: 1, // 0 : flat / 1 : sloppy / 2 : chaos
    shinyIce: true,
    transparentIce: false,
    // Environement
    worldSize: 4096, // Used for skybox and ocean
    showAxis: false,
    betterOcean: false,
    // Render quality options
    postprocess: 'multi', // 'ssao', 'multi' or 'none'
    shadows: false,
    healthbars: {
      width: 1 / 20, // Relative to cellsize (one HP width)
      height: 1 / 5, // Relative to cellsize
      heightAbove: 2, // Relative to cellsize (vertical distance from unit)
      colorBack: '#cc4444',
      colorFront: '#44cc44'
    },
    camera: {
      distanceRatio: 1, // Size of the map / camera distance (radius)
      distanceRatioMin: 0.1,
      distanceRatioMax: 2,
      distanceRatioStep: 0.25,
      beta: Math.PI / 6, // 0 : top-down / Math.PI / 2 : side view 
      activeCamera: 'camera', // 'camera' or 'cameraFree'
      cameraFreeAutoRotate: false,
      cameraDampbox: true, // Make the camera less shaky
      cameraDampboxRatio: 4 // Relates to number of visible cells on screen
    }
  },

  players: [
    { id: 0, name: 'Foo111', isHuman: true, color: '#ff8000', colorDesaturated: '#c48444', money: 7000 },
    { id: 1, name: 'PlayerTwo', isHuman: false, color: '#ff0080', colorDesaturated: '#c44484', money: 5000 },
    { id: 2, name: 'Mr3333', isHuman: false, color: '#00ff00', colorDesaturated: '#44c444', money: 5000 },
    { id: 3, name: 'FourFour', isHuman: false, color: '#0080ff', colorDesaturated: '#4484c4', money: 5000 }
  ],

  game: {
    seed: 'staticgameseed', // undefined for a random seed
    playerStartingZoneRatio: 2, // portion of the map dedicated to player's units initial placement
    moneyEarnedPerBuilding: 1000,
    animationsSpeed: 2,
    throttleKeyboardTime: 128, // In milliseconds
    // Buildings
    buildings: {
      base: {
        number: 1, // Per player
        numberOwned: 1,
        biomes: ['whitebeach', 'beach', 'swamp', 'desert', 'grass', 'plain', 'deepforest', 'pineforest', 'mountain', 'highmountain']
      },
      city: {
        number: 4, // Per player
        numberOwned: 0,
        biomes: ['whitebeach', 'beach', 'swamp', 'desert', 'grass', 'plain', 'deepforest', 'pineforest', 'mountain', 'highmountain']
      },
      factory: {
        number: 2, // Per player
        numberOwned: 1,
        biomes: ['whitebeach', 'beach', 'swamp', 'desert', 'grass', 'plain', 'deepforest', 'pineforest', 'mountain', 'highmountain']
      },
      port: {
        number: 1, // Per player
        numberOwned: 0,
        biomes: ['shore']
      },
      airport: {
        number: 1, // Per player
        numberOwned: 0,
        biomes: ['whitebeach', 'beach', 'swamp', 'desert', 'grass', 'plain', 'deepforest', 'pineforest', 'mountain', 'highmountain']
      }
    },
    // Units
    units: {
      // TODO
      // * can attack ground/sea/air
      // * can move AND attack
      // * can carry
      // * can dive (submarine)

      'soldier': {
        type: 'soldier',
        family: 'ground',
        cost: 1000,
        canAttack: true,
        canAttackTypes: [...artilleryTypes, ...tankTypes],
        canConquer: true,

        maxHealth: 5,
        strength: 4,
        defense: 2,
        movement: 3,
        attackRangeMin: 1,
        attackRangeMax: 1,

        biomesMoveCosts: {
          whitebeach: 1,
          beach: 1,
          swamp: 1,
    
          desert: 1,
          grass: 1,
          plain: 1,
    
          forest: 1,
          deepforest: 1,
          pineforest: 1,

          mountain: 1,
          highmountain: 1,
    
          scorched: 2,
          snow: 2,
    
          ice: 3
        },
        modifiers: {
          buildings: { defense: +2, strength: +2},
          swamp: { defense: -1 },
          forest: { defense: +1 },
          deepforest: { defense: +1 },
          pineforest: { defense: +1 },
          mountain: { strength: +1 },
          highmountain: { strength: +1 },
          scorched: { defense: +2, strength: +1 },
          snow: { defense: +2, strength: +2 },
          ice: { defense: +2, strength: +2 },

          'healer': { strength: -1 }
        },
        buildingsMoveCosts: {base: 0.5, city: 0.5, factory: 0.5, port: 0.5, airport: 0.5}
      },
      'bazooka': {
        type: 'bazooka',
        family: 'ground',
        cost: 3000,
        canAttack: true,
        canAttackTypes: [...artilleryTypes, ...tankTypes, 'cruiser', 'battleship'],
        canConquer: true,

        maxHealth: 8,
        strength: 6,
        defense: 3,
        movement: 2,
        attackRangeMin: 1,
        attackRangeMax: 2,

        biomesMoveCosts: {
          whitebeach: 1,
          beach: 1,
          swamp: 1,
    
          desert: 1,
          grass: 1,
          plain: 1,
    
          forest: 1,
          deepforest: 1,
          pineforest: 1,

          mountain: 1,
          highmountain: 1,
    
          scorched: 2,
          snow: 2,
    
          ice: 3
        },
        modifiers: {
          buildings: { defense: +2, strength: +2},
          swamp: { defense: -1 },
          forest: { defense: +1 },
          deepforest: { defense: +1 },
          pineforest: { defense: +1 },
          mountain: { strength: +1 },
          highmountain: { strength: +1 },
          scorched: { defense: +2, strength: +1 },
          snow: { defense: +2, strength: +2 },
          ice: { defense: +2, strength: +2 },

          'healer': { strength: -1 }
        },
        buildingsMoveCosts: {base: 0.5, city: 0.5, factory: 0.5, port: 0.5, airport: 0.5}
      },
      'healer': {
        type: 'healer',
        family: 'ground',
        cost: 4000,
        canAttack: false,
        canAttackTypes: [],
        canConquer: true,
        canHeal: true,

        maxHealth: 5,
        strength: 5,
        defense: 3,
        movement: 3,
        attackRangeMin: 1, // Heal range in fact
        attackRangeMax: 1,

        biomesMoveCosts: {
          whitebeach: 1,
          beach: 1,
          swamp: 1,
    
          desert: 1,
          grass: 1,
          plain: 1,
    
          forest: 1,
          deepforest: 1,
          pineforest: 1,

          mountain: 1,
          highmountain: 1,
    
          scorched: 2,
          snow: 2,
    
          ice: 3
        },
        modifiers: {
          buildings: { defense: +2, strength: +2},
          swamp: { defense: -1 },
          forest: { defense: +1 },
          deepforest: { defense: +1 },
          pineforest: { defense: +1 },
          scorched: { defense: +2 },
          snow: { defense: +2 },
          ice: { defense: +2 }
        },
        buildingsMoveCosts: {base: 0.5, city: 0.5, factory: 0.5, port: 0.5, airport: 0.5}
      },
      'transport': {
        type: 'transport',
        family: 'ground',
        cost: 5000,
        canAttack: false,
        canAttackTypes: [...artilleryTypes, ...tankTypes, 'cruiser', 'helicopter'],
        canConquer: false,
        canCarry: true,

        maxHealth: 12,
        strength: 0,
        defense: 5,
        movement: 6,
        attackRangeMin: 1,
        attackRangeMax: 1,

        biomesMoveCosts: {
          whitebeach: 1,
          beach: 1,
          swamp: 1,
    
          desert: 1,
          grass: 1,
          plain: 1,
    
          forest: 2,
          deepforest: 2,
          pineforest: 2
        },
        modifiers: {
          buildings: { defense: +2 },
          swamp: { defense: -1 },
          forest: { defense: +1 },
          deepforest: { defense: +1 },
          pineforest: { defense: +1 },
        },
        buildingsMoveCosts: {base: 0.5, city: 0.5, factory: 0.5, port: 0.5, airport: 0.5}
      },
      'jeep': {
        type: 'jeep',
        family: 'ground',
        cost: 4000,
        canAttack: true,
        canAttackTypes: [...artilleryTypes, ...tankTypes, 'cruiser', 'helicopter'],
        canConquer: false,

        maxHealth: 12,
        strength: 8,
        defense: 4,
        movement: 6,
        attackRangeMin: 1,
        attackRangeMax: 1,

        biomesMoveCosts: {
          whitebeach: 1,
          beach: 1,
          swamp: 1,
    
          desert: 1,
          grass: 1,
          plain: 1,
    
          forest: 2,
          deepforest: 2,
          pineforest: 2
        },
        modifiers: {
          buildings: { defense: +2, strength: +2},
          swamp: { defense: -1 },
          forest: { defense: +1 },
          deepforest: { defense: +1 },
          pineforest: { defense: +1 },

          'soldier': { strength: +2 },
          'bazooka': { strength: +2 },
          'healer': { strength: +1 }
        },
        buildingsMoveCosts: {base: 0.5, city: 0.5, factory: 0.5, port: 0.5, airport: 0.5}
      },
      'artillery': {
        type: 'artillery',
        family: 'ground',
        cost: 4000,
        canAttack: true,
        canAttackTypes: [...artilleryTypes, ...tankTypes, ...navalTypes],
        canConquer: false,

        maxHealth: 12,
        strength: 8,
        defense: 6,
        movement: 3,
        attackRangeMin: 2,
        attackRangeMax: 3,

        biomesMoveCosts: {
          whitebeach: 1,
          beach: 1,
          swamp: 1,
    
          desert: 1,
          grass: 1,
          plain: 1,
    
          forest: 2,
          deepforest: 2,
          pineforest: 2
        },
        modifiers: {
          buildings: { defense: +2, strength: +2},
          swamp: { defense: -1 },
          forest: { defense: +1 },
          deepforest: { defense: +1 },
          pineforest: { defense: +1 },

          'tank': { strength: +2 },
          'antiair-tank': { strength: +2 },
          'heavy-tank': { strength: +2 },
        },
        buildingsMoveCosts: {base: 0.5, city: 0.5, factory: 0.5, port: 0.5, airport: 0.5}
      },
      'tank': {
        type: 'tank',
        family: 'ground',
        cost: 7000,
        canAttackTypes: [...artilleryTypes, ...tankTypes, ...navalTypes, 'helicopter'],
        canAttack: true,
        canConquer: false,
        // level: 1,

        // See: http://fireemblem.wikia.com/wiki/Category:Stats
        maxHealth: 20, // http://fireemblem.wikia.com/wiki/HP
        strength: 10, // http://fireemblem.wikia.com/wiki/Strength
        // magic: 5, // http://fireemblem.wikia.com/wiki/Magic_(stat)
        // skill: 7, // http://fireemblem.wikia.com/wiki/Skill_(stat)
        // speed: 8, // http://fireemblem.wikia.com/wiki/Speed_(stat)
        // luck: 6, // http://fireemblem.wikia.com/wiki/Luck
        defense: 5, // http://fireemblem.wikia.com/wiki/Defense_(stat)
        // resistance: 3, // http://fireemblem.wikia.com/wiki/Resistance
        movement: 4, // http://fireemblem.wikia.com/wiki/Movement

        // attackRangeMin: 1, // Not used by now
        attackRangeMin: 1,
        attackRangeMax: 2,

        biomesMoveCosts: {
          whitebeach: 1,
          beach: 1,
          swamp: 2,
    
          desert: 1,
          grass: 1,
          plain: 1
        },
        modifiers: {
          buildings: { defense: +2, strength: +2},
          swamp: { defense: -2 },
          forest: { defense: +1 },
          desert: { strength: +1 },
          grass: { strength: +1 },
          plain: { strength: +1 },

          'soldier': { strength: -2 },
          'bazooka': { strength: -2 },
          'healer': { strength: -2 }
        },
        buildingsMoveCosts: {base: 0.5, city: 0.5, factory: 0.5, port: 0.5, airport: 0.5}
      },
      'antiair-tank': {
        type: 'antiair-tank',
        family: 'ground',
        cost: 8000,
        canAttackTypes: [...artilleryTypes, ...airTypes],
        canAttack: true,
        canConquer: false,
        // level: 1,

        maxHealth: 18,
        strength: 8,
        defense: 5,
        movement: 4,

        attackRangeMin: 1,
        attackRangeMax: 1,

        biomesMoveCosts: {
          whitebeach: 1,
          beach: 1,
          swamp: 2,
    
          desert: 1,
          grass: 1,
          plain: 1
        },
        modifiers: {
          buildings: { defense: +2, strength: +2},
          swamp: { defense: -2 },
          forest: { defense: +1 },
          desert: { strength: +1 },
          grass: { strength: +1 },
          plain: { strength: +1 },

          'bomber': { strength: +5, defense: +3 },
          'fighter': { strength: +4, defense: +2 },
          'helicopter': { strength: +3, defense: +1 }
        },
        buildingsMoveCosts: {base: 0.5, city: 0.5, factory: 0.5, port: 0.5, airport: 0.5}
      },
      'rocket-launcher': {
        type: 'rocket-launcher',
        family: 'ground',
        cost: 12000,
        canAttackTypes: [...artilleryTypes, ...tankTypes, ...navalTypes],
        canAttack: true,
        canConquer: false,

        maxHealth: 12,
        strength: 12,
        defense: 4,
        movement: 3,

        attackRangeMin: 3,
        attackRangeMax: 5,

        biomesMoveCosts: {
          whitebeach: 1,
          beach: 1,
          swamp: 2,
    
          desert: 1,
          grass: 1,
          plain: 1,

          forest: 1.5,
          deepforest: 2,
          pineforest: 2,
        },
        modifiers: {
          buildings: { defense: +3, strength: +1},
          swamp: { defense: -2 },
          desert: { strength: +1 },
          grass: { strength: +1 },
          plain: { strength: +1 },
          forest: { defense: +1 },
          deepforest: { defense: +2 },
          pineforest: { defense: +2 },

          'soldier': { defense: -1 },
          'bazooka': { defense: -1 },
          'healer': { defense: -1 }
        },
        buildingsMoveCosts: {base: 0.5, city: 0.5, factory: 0.5, port: 0.5, airport: 0.5}
      },
      'missile-launcher': {
        type: 'missile-launcher',
        family: 'ground',
        cost: 14000,
        canAttackTypes: [...airTypes],
        canAttack: true,
        canConquer: false,

        maxHealth: 12,
        strength: 15,
        defense: 4,
        movement: 3,

        attackRangeMin: 4,
        attackRangeMax: 7,

        biomesMoveCosts: {
          whitebeach: 1,
          beach: 1,
          swamp: 2,
    
          desert: 1,
          grass: 1,
          plain: 1,

          forest: 1.5,
          deepforest: 2,
          pineforest: 2,
        },
        modifiers: {
          buildings: { defense: +3, strength: +1},
          swamp: { defense: -2 },
          desert: { strength: +1 },
          grass: { strength: +1 },
          plain: { strength: +1 },
          forest: { defense: +1 },
          deepforest: { defense: +2 },
          pineforest: { defense: +2 },

          'soldier': { defense: -1 },
          'bazooka': { defense: -1 },
          'healer': { defense: -1 }
        },
        buildingsMoveCosts: {base: 0.5, city: 0.5, factory: 0.5, port: 0.5, airport: 0.5}
      },
      'heavy-tank': {
        type: 'heavy-tank',
        family: 'ground',
        cost: 17000,
        canAttack: true,
        canAttackTypes: [...artilleryTypes, ...tankTypes, ...navalTypes, 'helicopter'],
        canConquer: false,

        maxHealth: 30, // http://fireemblem.wikia.com/wiki/HP
        strength: 12, // http://fireemblem.wikia.com/wiki/Strength
        defense: 7, // http://fireemblem.wikia.com/wiki/Defense_(stat)
        movement: 3, // http://fireemblem.wikia.com/wiki/Movement

        attackRangeMin: 1,
        attackRangeMax: 2,

        biomesMoveCosts: {
          whitebeach: 1,
          beach: 1,
          swamp: 2,

          desert: 1,
          grass: 1,
          plain: 1
        },
        modifiers: {
          buildings: { defense: +2, strength: +2},
          swamp: { defense: -2 },
          forest: { defense: +1 },
          desert: { strength: +1 },
          grass: { strength: +1 },
          plain: { strength: +1 },

          'soldier': { strength: -2 },
          'bazooka': { strength: -2 },
          'healer': { strength: -2 }
        },
        buildingsMoveCosts: {base: 0.5, city: 0.5, factory: 0.5, port: 0.5, airport: 0.5}
      },
      'sea-transport': {
        type: 'sea-transport',
        family: 'sea',
        cost: 6000,
        canAttack: false,
        canConquer: false,
        canCarry: true,

        maxHealth: 10,
        strength: 0,
        defense: 5,
        movement: 5,
        attackRangeMin: 1,
        attackRangeMax: 1,

        biomesMoveCosts: {
          deepsea: 0.5,
          sea: 0.75,
          shore: 1
        },
        modifiers: {
        },
        buildingsMoveCosts: {port: 0.5}
      },
      'cruiser': {
        type: 'cruiser',
        family: 'sea',
        cost: 8000,
        canAttack: true,
        canAttackTypes: [...artilleryTypes, ...tankTypes, ...navalTypes, 'helicopter'],
        canConquer: false,

        maxHealth: 10,
        strength: 7,
        defense: 4,
        movement: 4,
        attackRangeMin: 1,
        attackRangeMax: 1,

        biomesMoveCosts: {
          deepsea: 0.5,
          sea: 0.75,
          shore: 1
        },
        modifiers: {
          'cruiser': { defense: -1 }
        },
        buildingsMoveCosts: {port: 0.5}
      },
      'battleship': {
        type: 'cruiser',
        family: 'sea',
        cost: 12000,
        canAttack: true,
        canAttackTypes: [...artilleryTypes, ...tankTypes, 'cruiser', 'battleship', ...airTypes],
        canConquer: false,

        maxHealth: 15,
        strength: 9,
        defense: 5,
        movement: 4,
        attackRangeMin: 2,
        attackRangeMax: 3,

        biomesMoveCosts: {
          deepsea: 0.5,
          sea: 0.75,
          shore: 1
        },
        modifiers: {
          'cruiser': { defense: -1 }
        },
        buildingsMoveCosts: {port: 0.5}
      },
      'submarine': {
        type: 'cruiser',
        family: 'sea',
        cost: 10000,
        canAttack: true,
        canAttackTypes: [...navalTypes],
        canConquer: false,

        maxHealth: 12,
        strength: 8,
        defense: 5,
        movement: 6,
        attackRangeMin: 1,
        attackRangeMax: 2,

        biomesMoveCosts: {
          deepsea: 0.5,
          sea: 0.75,
          shore: 1
        },
        modifiers: {
          'cruiser': { strength: +2, defense: -2 },
          'battleship': { strength: +3 }
        },
        buildingsMoveCosts: {port: 0.5}
      },
      'air-transport': {
        type: 'air-transport',
        family: 'air',
        cost: 6000,
        canAttack: false,
        canConquer: false,
        canCarry: true,

        maxHealth: 12,
        strength: 0,
        defense: 6,
        movement: 5,
        attackRangeMin: 1,
        attackRangeMax: 1,

        biomesMoveCosts: {
          // Air unit: all biomes, cost is always 1
          deepsea: 1, sea: 1, shore: 1, whitebeach: 1, beach: 1, swamp: 1, desert: 1, grass: 1, plain: 1, forest: 1, deepforest: 1, pineforest: 1, mountain: 1, highmountain: 1, scorched: 1, snow: 1, ice: 1
        },
        modifiers: {
        },
        buildingsMoveCosts: {base: 1, city: 1, factory: 1, port: 1, airport: 1}
      },
      'bomber': {
        type: 'bomber',
        family: 'air',
        cost: 15000,
        canAttack: true,
        canAttackTypes: [...artilleryTypes, ...tankTypes, 'cruiser'],
        canConquer: false,

        maxHealth: 20,
        strength: 10,
        defense: 7,
        movement: 7,
        attackRangeMin: 1,
        attackRangeMax: 1,

        biomesMoveCosts: {
          // Air unit: all biomes, cost is always 1
          deepsea: 1, sea: 1, shore: 1, whitebeach: 1, beach: 1, swamp: 1, desert: 1, grass: 1, plain: 1, forest: 1, deepforest: 1, pineforest: 1, mountain: 1, highmountain: 1, scorched: 1, snow: 1, ice: 1
        },
        modifiers: {
          'tank': { strength: +2 }
        },
        buildingsMoveCosts: {base: 1, city: 1, factory: 1, port: 1, airport: 1}
      },
      'fighter': {
        type: 'fighter',
        family: 'air',
        cost: 12000,
        canAttack: true,
        canAttackTypes: [...tankTypes, 'cruiser', ...airTypes],
        canConquer: false,

        maxHealth: 15,
        strength: 7,
        defense: 6,
        movement: 10,
        attackRangeMin: 1,
        attackRangeMax: 2,

        biomesMoveCosts: {
          // Air unit: all biomes, cost is always 1
          deepsea: 1, sea: 1, shore: 1, whitebeach: 1, beach: 1, swamp: 1, desert: 1, grass: 1, plain: 1, forest: 1, deepforest: 1, pineforest: 1, mountain: 1, highmountain: 1, scorched: 1, snow: 1, ice: 1
        },
        modifiers: {
          'helicopter': { strength: +2, defense: +2 },
          'bomber': { strength: +3, defense: +3 }
        },
        buildingsMoveCosts: {base: 1, city: 1, factory: 1, port: 1, airport: 1}
      },
      'helicopter': {
        type: 'helicopter',
        family: 'air',
        cost: 6000,
        canAttack: true,
        canAttackTypes: [...artilleryTypes, ...tankTypes, 'cruiser', 'bomber', 'helicopter'],
        canConquer: false,

        maxHealth: 12,
        strength: 7,
        defense: 5,
        movement: 5,
        attackRangeMin: 1,
        attackRangeMax: 1,

        biomesMoveCosts: {
          // Air unit: all biomes, cost is always 1
          deepsea: 1, sea: 1, shore: 1, whitebeach: 1, beach: 1, swamp: 1, desert: 1, grass: 1, plain: 1, forest: 1, deepforest: 1, pineforest: 1, mountain: 1, highmountain: 1, scorched: 1, snow: 1, ice: 1
        },
        modifiers: {
          'soldier': { strength: +2 },
          'bazooka': { strength: +2 },
          'healer': { strength: +1 },
          'jeep': { defense: +1 },
          'tank': { defense: +2 },
          'heavy-tank': { defense: +3 },
        },
        buildingsMoveCosts: {base: 1, city: 1, factory: 1, port: 1, airport: 1}
      }
    }
  }
}

// Computed config vars
CONFIG.map.mapNoise.height.frequency =
  CONFIG.map.mapNoise.height.frequencyRatio * CONFIG.map.mapSize.width
CONFIG.map.mapNoise.moisture.frequency =
  CONFIG.map.mapNoise.moisture.frequencyRatio * CONFIG.map.mapSize.width

export default CONFIG