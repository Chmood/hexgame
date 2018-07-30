import UnitType from './game-unit-type'

const CONFIG_UNITS = {
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
    canAttackTypes: [...UnitType['artillery'], ...UnitType['tank']],
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
    canAttackTypes: [...UnitType['artillery'], ...UnitType['tank'], 'cruiser', 'battleship'],
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
    canAttackTypes: [...UnitType['artillery'], ...UnitType['tank'], 'cruiser', 'helicopter'],
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
    canAttackTypes: [...UnitType['artillery'], ...UnitType['tank'], 'cruiser', 'helicopter'],
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
    canAttackTypes: [...UnitType['artillery'], ...UnitType['tank'], ...UnitType['naval']],
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
    canAttackTypes: [...UnitType['artillery'], ...UnitType['tank'], ...UnitType['naval'], 'helicopter'],
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
    canAttackTypes: [...UnitType['artillery'], ...UnitType['air']],
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
    canAttackTypes: [...UnitType['artillery'], ...UnitType['tank'], ...UnitType['naval']],
    canAttack: true,
    canConquer: false,
    canMoveOrFire: true,

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
    canAttackTypes: [...UnitType['air']],
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
    canAttackTypes: [...UnitType['artillery'], ...UnitType['tank'], ...UnitType['naval'], 'helicopter'],
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
    canAttackTypes: [...UnitType['artillery'], ...UnitType['tank'], ...UnitType['naval'], 'helicopter'],
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
    canAttackTypes: [...UnitType['artillery'], ...UnitType['tank'], 'cruiser', 'battleship', ...UnitType['air']],
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
    canAttackTypes: [...UnitType['naval']],
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
    canAttackTypes: [...UnitType['artillery'], ...UnitType['tank'], 'cruiser'],
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
    canAttackTypes: [...UnitType['tank'], 'cruiser', ...UnitType['air']],
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
    canAttackTypes: [...UnitType['artillery'], ...UnitType['tank'], 'cruiser', 'bomber', 'helicopter'],
    canConquer: false,
    canAttackThenMove: true,

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

export default CONFIG_UNITS