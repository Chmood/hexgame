////////////////////////////////////////////////////////////////////////////////
// RENDERER 3D UNITS PARTS

const unitsParts = {
  'soldier': [
    {
      name: 'head',
      size: {height: 2/8, length: 2/8, width: 2/8},
      position: {x: 0, y: 7.5/8, z: 0},
      material: 'player'
    },
    {
      name: 'body',
      size: {height: 3/8, length: 1/8, width: 3/8},
      position: {x: 0, y: 5/8, z: 0},
      material: 'player'
    },
    {
      name: 'armLeft',
      size: {height: 3/8, length: 1/8, width: 1/16},
      position: {x: 0, y: 5/8, z: -2/8},
      material: 'player'
    },
    {
      name: 'armRight',
      size: {height: 3/8, length: 1/8, width: 1/16},
      position: {x: 0, y: 5/8, z: 2/8},
      material: 'player'
    },
    {
      name: 'riffle',
      size: {height: 6/8, length: 1/16, width: 1/16},
      position: {x: 1/8, y: 6/8, z: 2/8},
      material: 'unitBlack'
    },
    {
      name: 'legLeft',
      size: {height: 3/8, length: 1/8, width: 1/8},
      position: {x: 0, y: 1/4, z: 1/8},
      material: 'unitBlack'
    },
    {
      name: 'legRight',
      size: {height: 3/8, length: 1/8, width: 1/8},
      position: {x: 0, y: 1/4, z: -1/8},
      material: 'unitBlack'
    },
  ],
  'bazooka': [
    {
      name: 'head',
      size: {height: 2/8, length: 2/8, width: 2/8},
      position: {x: 0, y: 7.5/8, z: 0},
      material: 'player'
    },
    {
      name: 'body',
      size: {height: 3/8, length: 1/8, width: 3/8},
      position: {x: 0, y: 5/8, z: 0},
      material: 'player'
    },
    {
      name: 'armLeft',
      size: {height: 3/8, length: 1/8, width: 1/16},
      position: {x: 0, y: 5/8, z: -2/8},
      material: 'player'
    },
    {
      name: 'armRight',
      size: {height: 1/8, length: 3/8, width: 1/16},
      position: {x: -1/8, y: 6/8, z: 2/8},
      material: 'player'
    },
    {
      name: 'bazooka',
      size: {height: 2/8, length: 5/8, width: 2/8},
      position: {x: -1/8, y: 8/8, z: 2/8},
      material: 'unitGrey'
    },
    {
      name: 'legLeft',
      size: {height: 3/8, length: 1/8, width: 1/8},
      position: {x: 0, y: 1/4, z: 1/8},
      material: 'unitBlack'
    },
    {
      name: 'legRight',
      size: {height: 3/8, length: 1/8, width: 1/8},
      position: {x: 0, y: 1/4, z: -1/8},
      material: 'unitBlack'
    },
  ],
  'healer': [
    {
      name: 'head',
      size: {height: 2/8, length: 2/8, width: 2/8},
      position: {x: 0, y: 7.5/8, z: 0},
      material: 'player'
    },
    {
      name: 'body',
      size: {height: 3/8, length: 1/8, width: 3/8},
      position: {x: 0, y: 5/8, z: 0},
      material: 'player'
    },
    {
      name: 'backpack',
      size: {height: 3/8, length: 3/8, width: 3/8},
      position: {x: 2/8, y: 5/8, z: 0},
      material: 'unitBlack'
    },
    {
      name: 'backpackCross1',
      size: {height: 1/16, length: 1/8, width: 2/8},
      position: {x: 2/8, y: 13/16, z: 0},
      material: 'unitGrey'
    },
    {
      name: 'backpackCross2',
      size: {height: 1/16, length: 2/8, width: 1/8},
      position: {x: 2/8, y: 13/16, z: 0},
      material: 'unitGrey'
    },
    {
      name: 'armLeft',
      size: {height: 3/8, length: 1/8, width: 1/16},
      position: {x: 0, y: 5/8, z: -2/8},
      material: 'player'
    },
    {
      name: 'armRight',
      size: {height: 3/8, length: 1/8, width: 1/16},
      position: {x: 0, y: 5/8, z: 2/8},
      material: 'player'
    },
    {
      name: 'legLeft',
      size: {height: 3/8, length: 1/8, width: 1/8},
      position: {x: 0, y: 1/4, z: 1/8},
      material: 'unitBlack'
    },
    {
      name: 'legRight',
      size: {height: 3/8, length: 1/8, width: 1/8},
      position: {x: 0, y: 1/4, z: -1/8},
      material: 'unitBlack'
    },
  ],
  'transport': [
    {
      name: 'base',
      size: {height: 3/8, length: 8/8, width: 5/8},
      position: {x: 0, y: 3/8, z: 0},
      material: 'player'
    },
    {
      name: 'cabin',
      size: {height: 1/8, length: 7/8, width: 5/8},
      position: {x: 1/16, y: 5/8, z: 0},
      material: 'player'
    },
    {
      name: 'wheelLeftFront',
      size: {height: 1/4, length: 1/4, width: 1/8},
      position: {x: -3/8, y: 1/4, z: 3/8},
      material: 'unitBlack'
    },
    {
      name: 'wheelRightFront',
      size: {height: 1/4, length: 1/4, width: 1/8},
      position: {x: -3/8, y: 1/4, z: -3/8},
      material: 'unitBlack'
    },
    {
      name: 'wheelLeftBack',
      size: {height: 1/4, length: 1/4, width: 1/8},
      position: {x: 3/8, y: 1/4, z: 3/8},
      material: 'unitBlack'
    },
    {
      name: 'wheelRightBack',
      size: {height: 1/4, length: 1/4, width: 1/8},
      position: {x: 3/8, y: 1/4, z: -3/8},
      material: 'unitBlack'
    }
  ],
  'jeep': [
    {
      name: 'base',
      size: {height: 1/6, length: 6/8, width: 1/2},
      position: {x: 0, y: 3/8, z: 0},
      material: 'player'
    },
    {
      name: 'cabin',
      size: {height: 1/6, length: 4/8, width: 1/2},
      position: {x: 1/8, y: 4/8, z: 0},
      material: 'player'
    },
    {
      name: 'wheelLeftFront',
      size: {height: 1/4, length: 1/4, width: 1/8},
      position: {x: -1/4, y: 1/4, z: 1/4},
      material: 'unitBlack'
    },
    {
      name: 'wheelRightFront',
      size: {height: 1/4, length: 1/4, width: 1/8},
      position: {x: -1/4, y: 1/4, z: -1/4},
      material: 'unitBlack'
    },
    {
      name: 'wheelLeftBack',
      size: {height: 1/4, length: 1/4, width: 1/8},
      position: {x: 1/4, y: 1/4, z: 1/4},
      material: 'unitBlack'
    },
    {
      name: 'wheelRightBack',
      size: {height: 1/4, length: 1/4, width: 1/8},
      position: {x: 1/4, y: 1/4, z: -1/4},
      material: 'unitBlack'
    }
  ],
  'artillery': [
    {
      name: 'base',
      size: {height: 1/6, length: 6/8, width: 1/2},
      position: {x: 0, y: 3/8, z: 0},
      material: 'player'
    },
    {
      name: 'cabin',
      size: {height: 1/6, length: 1/16, width: 1/2},
      position: {x: -1/8, y: 4/8, z: 0},
      rotation: {x: 0, y: 0, z: -1/16},
      material: 'player'
    },
    {
      name: 'canonSupport',
      size: {height: 1/4, length: 1/2, width: 1/4},
      position: {x: 1/4, y: 5/8, z: 0},
      rotation: {x: 0, y: 0, z: -1/8},
      material: 'unitBlack'
    },
    {
      name: 'canon',
      size: {height: 1/8, length: 5/8, width: 1/8},
      position: {x: 1/4, y: 5/8, z: 0},
      rotation: {x: 0, y: 0, z: -1/8},
      material: 'unitGrey'
    },
    {
      name: 'wheelLeftFront',
      size: {height: 1/4, length: 1/4, width: 1/8},
      position: {x: -1/4, y: 1/4, z: 1/4},
      material: 'unitBlack'
    },
    {
      name: 'wheelRightFront',
      size: {height: 1/4, length: 1/4, width: 1/8},
      position: {x: -1/4, y: 1/4, z: -1/4},
      material: 'unitBlack'
    },
    {
      name: 'wheelLeftBack',
      size: {height: 1/4, length: 1/4, width: 1/8},
      position: {x: 1/4, y: 1/4, z: 1/4},
      material: 'unitBlack'
    },
    {
      name: 'wheelRightBack',
      size: {height: 1/4, length: 1/4, width: 1/8},
      position: {x: 1/4, y: 1/4, z: -1/4},
      material: 'unitBlack'
    }
  ],
  'rocket-launcher': [
    {
      name: 'base',
      size: {height: 1/6, length: 8/8, width: 1/2},
      position: {x: 0, y: 3/8, z: 0},
      material: 'player'
    },
    {
      name: 'cabin',
      size: {height: 1/6, length: 1/4, width: 1/2},
      position: {x: -3/8, y: 4/8, z: 0},
      material: 'player'
    },
    {
      name: 'canonFrontLeft',
      size: {height: 3/16, length: 3/8, width: 3/16},
      position: {x: 0, y: 5/8, z: 1/8},
      rotation: {x: 0, y: 0, z: -1/8},
      material: 'unitGrey'
    },
    {
      name: 'canonFrontRight',
      size: {height: 3/16, length: 3/8, width: 3/16},
      position: {x: 0, y: 5/8, z: -1/8},
      rotation: {x: 0, y: 0, z: -1/8},
      material: 'unitGrey'
    },
    {
      name: 'canonBackLeft',
      size: {height: 3/16, length: 3/8, width: 3/16},
      position: {x: 5/16, y: 5/8, z: 1/8},
      rotation: {x: 0, y: 0, z: -1/8},
      material: 'unitGrey'
    },
    {
      name: 'canonBackRight',
      size: {height: 3/16, length: 3/8, width: 3/16},
      position: {x: 5/16, y: 5/8, z: -1/8},
      rotation: {x: 0, y: 0, z: -1/8},
      material: 'unitGrey'
    },
    {
      name: 'wheelLeftFront',
      size: {height: 1/4, length: 1/4, width: 1/8},
      position: {x: -3/8, y: 1/4, z: 1/4},
      material: 'unitBlack'
    },
    {
      name: 'wheelRightFront',
      size: {height: 1/4, length: 1/4, width: 1/8},
      position: {x: -3/8, y: 1/4, z: -1/4},
      material: 'unitBlack'
    },
    {
      name: 'wheelLeftBack',
      size: {height: 1/4, length: 1/4, width: 1/8},
      position: {x: 3/8, y: 1/4, z: 1/4},
      material: 'unitBlack'
    },
    {
      name: 'wheelRightBack',
      size: {height: 1/4, length: 1/4, width: 1/8},
      position: {x: 3/8, y: 1/4, z: -1/4},
      material: 'unitBlack'
    }
  ],
  'missile-launcher': [
    {
      name: 'base',
      size: {height: 1/6, length: 8/8, width: 1/2},
      position: {x: 0, y: 3/8, z: 0},
      material: 'player'
    },
    {
      name: 'cabin',
      size: {height: 1/6, length: 2/4, width: 1/2},
      position: {x: -2/8, y: 4/8, z: 0},
      material: 'player'
    },
    {
      name: 'canonSupport',
      size: {height: 1/4, length: 1/2, width: 1/4},
      position: {x: 3/16, y: 5/8, z: 0},
      rotation: {x: 0, y: 0, z: -1/8},
      material: 'unitGrey'
    },
    {
      name: 'canonLeft',
      size: {height: 3/16, length: 3/8, width: 3/16},
      position: {x: 1/8, y: 7/8, z: 1/8},
      rotation: {x: 0, y: 0, z: -1/8},
      material: 'unitBlack'
    },
    {
      name: 'canonRight',
      size: {height: 3/16, length: 3/8, width: 3/16},
      position: {x: 1/8, y: 7/8, z: -1/8},
      rotation: {x: 0, y: 0, z: -1/8},
      material: 'unitBlack'
    },
    {
      name: 'wheelLeftFront',
      size: {height: 1/4, length: 1/4, width: 1/8},
      position: {x: -3/8, y: 1/4, z: 1/4},
      material: 'unitBlack'
    },
    {
      name: 'wheelRightFront',
      size: {height: 1/4, length: 1/4, width: 1/8},
      position: {x: -3/8, y: 1/4, z: -1/4},
      material: 'unitBlack'
    },
    {
      name: 'wheelLeftBack',
      size: {height: 1/4, length: 1/4, width: 1/8},
      position: {x: 3/8, y: 1/4, z: 1/4},
      material: 'unitBlack'
    },
    {
      name: 'wheelRightBack',
      size: {height: 1/4, length: 1/4, width: 1/8},
      position: {x: 3/8, y: 1/4, z: -1/4},
      material: 'unitBlack'
    }
  ],
  'tank': [
    {
      name: 'base',
      size: {height: 1/6, length: 3/4, width: 1/2},
      position: {x: 0, y: 1/4, z: 0},
      material: 'unitGrey'
    },
    {
      name: 'trackLeft',
      size: {height: 1/3, length: 1, width: 1/4},
      position: {x: 0, y: 1/4, z: 1/3},
      material: 'player'
    },
    {
      name: 'trackRight',
      size: {height: 1/3, length: 1, width: 1/4},
      position: {x: 0, y: 1/4, z: -1/3},
      material: 'player'
    },
    {
      name: 'body',
      size: {height: 1/4, length: 1/4, width: 1/4},
      position: {x: 0, y: 1/2, z: 0},
      material: 'player'
    },
    {
      name: 'cannon',
      size: {height: 1/16, length: 1/2, width: 1/16},
      position: {x: -1/4, y: 1/2, z: 0},
      material: 'player'
    }
  ],
  'antiair-tank': [
    {
      name: 'base',
      size: {height: 1/6, length: 3/4, width: 1/2},
      position: {x: 0, y: 1/4, z: 0},
      material: 'unitGrey'
    },
    {
      name: 'trackLeft',
      size: {height: 1/3, length: 1, width: 1/4},
      position: {x: 0, y: 1/4, z: 1/3},
      material: 'player'
    },
    {
      name: 'trackRight',
      size: {height: 1/3, length: 1, width: 1/4},
      position: {x: 0, y: 1/4, z: -1/3},
      material: 'player'
    },
    {
      name: 'body',
      size: {height: 1/4, length: 1/4, width: 3/8},
      position: {x: 0, y: 1/2, z: 0},
      rotation: {x: 0, y: 0, z: -1/8},
      material: 'player'
    },
    {
      name: 'cannonLeft',
      size: {height: 1/16, length: 1/2, width: 1/16},
      position: {x: -1/4, y: 12/16, z: -1/8},
      rotation: {x: 0, y: 0, z: -1/8},
      material: 'unitBlack'
    },
    {
      name: 'cannonMiddle',
      size: {height: 1/16, length: 1/2, width: 1/16},
      position: {x: -1/4, y: 12/16, z: 0},
      rotation: {x: 0, y: 0, z: -1/8},
      material: 'unitBlack'
    },
    {
      name: 'cannonRight',
      size: {height: 1/16, length: 1/2, width: 1/16},
      position: {x: -1/4, y: 12/16, z: 1/8},
      rotation: {x: 0, y: 0, z: -1/8},
      material: 'unitBlack'
    }
  ],
  'heavy-tank': [
    {
      name: 'base',
      size: {height: 1/4, length: 4/4, width: 5/8},
      position: {x: 0, y: 3/8, z: 0},
      material: 'unitBlack'
    },
    {
      name: 'trackLeft',
      size: {height: 1/2, length: 10/8, width: 3/8},
      position: {x: 0, y: 3/8, z: 1/2},
      material: 'player'
    },
    {
      name: 'trackRight',
      size: {height: 1/2, length: 10/8, width: 3/8},
      position: {x: 0, y: 3/8, z: -1/2},
      material: 'player'
    },
    {
      name: 'body',
      size: {height: 3/8, length: 2/4, width: 2/4},
      position: {x: 0, y: 5/8, z: 0},
      material: 'player'
    },
    {
      name: 'cannonLeft',
      size: {height: 1/8, length: 1/2, width: 1/8},
      position: {x: -1/4, y: 11/16, z: -1/8},
      material: 'player'
    },
    {
      name: 'cannonRight',
      size: {height: 1/8, length: 1/2, width: 1/8},
      position: {x: -1/4, y: 11/16, z: 1/8},
      material: 'player'
    }
  ],
  'sea-transport': [
    {
      name: 'base',
      size: {height: 1/4, length: 10/8, width: 5/8},
      position: {x: 0, y: 0, z: 0},
      material: 'player'
    },
    {
      name: 'sides',
      size: {height: 1/4, length: 8/8, width: 6/8},
      position: {x: 0, y: 0, z: 0},
      material: 'player'
    },
    {
      name: 'cabin',
      size: {height: 2/8, length: 2/8, width: 5/8},
      position: {x: 3/8, y: 2/8, z: 0},
      material: 'unitGrey'
    }
  ],
  'cruiser': [
    {
      name: 'base',
      size: {height: 2/8, length: 8/8, width: 3/8},
      position: {x: 0, y: 0, z: 0},
      material: 'player'
    },
    {
      name: 'sides',
      size: {height: 2/8, length: 6/8, width: 4/8},
      position: {x: 0, y: 0, z: 0},
      material: 'player'
    },
    {
      name: 'cabin',
      size: {height: 2/8, length: 3/8, width: 3/8},
      position: {x: 1/8, y: 1/4, z: 0},
      material: 'unitGrey'
    },
    {
      name: 'cannon',
      size: {height: 1/8, length: 1/4, width: 1/8},
      position: {x: -1/8, y: 1/4, z: 0},
      material: 'unitBlack'
    }
  ],
  'battleship': [
    {
      name: 'base',
      size: {height: 2/8, length: 12/8, width: 4/8},
      position: {x: 0, y: 0, z: 0},
      material: 'player'
    },
    {
      name: 'sides',
      size: {height: 2/8, length: 6/8, width: 6/8},
      position: {x: 0, y: 0, z: 0},
      material: 'player'
    },
    {
      name: 'cabin',
      size: {height: 2/8, length: 4/8, width: 4/8},
      position: {x: 1/8, y: 1/4, z: 0},
      material: 'unitGrey'
    },
    {
      name: 'cannonLeft',
      size: {height: 1/16, length: 1/2, width: 1/16},
      position: {x: -1/4, y: 1/4, z: 1/8},
      material: 'unitBlack'
    },
    {
      name: 'cannonRight',
      size: {height: 1/16, length: 1/2, width: 1/16},
      position: {x: -1/4, y: 1/4, z: -1/8},
      material: 'unitBlack'
    }
  ],
  'submarine': [
    {
      name: 'base',
      size: {height: 2/8, length: 10/8, width: 2/8},
      position: {x: 0, y: 0, z: 0},
      material: 'player'
    },
    {
      name: 'sides',
      size: {height: 3/8, length: 8/8, width: 3/8},
      position: {x: 0, y: 0, z: 0},
      material: 'player'
    },
    {
      name: 'blade1',
      size: {height: 1/16, length: 1/16, width: 3/8},
      position: {x: -11/16, y: 0, z: 0},
      material: 'unitGrey'
    },
    {
      name: 'blade2',
      size: {height: 3/8, length: 1/16, width: 1/16},
      position: {x: -11/16, y: 0, z: 0},
      material: 'unitGrey'
    },
    {
      name: 'cabin',
      size: {height: 1/8, length: 2/8, width: 1/8},
      position: {x: 0, y: 2/8, z: 0},
      material: 'unitBlack'
    },
  ],
  'air-transport': [
    {
      name: 'body',
      size: {height: 4/8, length: 8/8, width: 5/8},
      position: {x: 0, y: 1/4, z: 0},
      material: 'player'
    },
    {
      name: 'nose',
      size: {height: 3/8, length: 2/8, width: 3/8},
      position: {x: -5/8, y: 5/16, z: 0},
      material: 'unitBlack'
    },
    {
      name: 'tail',
      size: {height: 2/8, length: 4/8, width: 3/8},
      position: {x: 6/8, y: 5/16, z: 0},
      material: 'player'
    },
    {
      name: 'tailFin',
      size: {height: 5/8, length: 2/8, width: 1/8},
      position: {x: 15/16, y: 6/16, z: 0},
      material: 'unitBlack'
    },
    {
      name: 'bladeSupportFront',
      size: {height: 3/8, length: 2/8, width: 2/8},
      position: {x: -4/8, y: 5/8, z: 0},
      rotation: {x: 4/8, y: 1/8, z: 0},
      material: 'unitBlack'
    },
    {
      name: 'blade1Front',
      size: {height: 1/16, length: 1/8, width: 8/8},
      position: {x: -4/8, y: 3/4, z: 0},
      rotation: {x: 0, y: 1/8, z: 0},
      material: 'unitGrey'
    },
    {
      name: 'blade2Front',
      size: {height: 1/16, length: 8/8, width: 1/8},
      position: {x: -4/8, y: 3/4, z: 0},
      rotation: {x: 0, y: 1/8, z: 0},
      material: 'unitGrey'
    },
    {
      name: 'bladeSupportBack',
      size: {height: 3/8, length: 2/8, width: 2/8},
      position: {x: 4/8, y: 5/8, z: 0},
      rotation: {x: 0, y: 1/8, z: 0},
      material: 'unitBlack'
    },
    {
      name: 'blade1Back',
      size: {height: 1/16, length: 1/8, width: 8/8},
      position: {x: 4/8, y: 3/4, z: 0},
      rotation: {x: 0, y: 1/8, z: 0},
      material: 'unitGrey'
    },
    {
      name: 'blade2Back',
      size: {height: 1/16, length: 8/8, width: 1/8},
      position: {x: 4/8, y: 3/4, z: 0},
      rotation: {x: 0, y: 1/8, z: 0},
      material: 'unitGrey'
    }
  ],
  'bomber': [
    {
      name: 'body',
      size: {height: 4/8, length: 8/8, width: 4/8},
      position: {x: 0, y: 1/4, z: 0},
      material: 'player'
    },
    {
      name: 'nose',
      size: {height: 3/8, length: 2/8, width: 3/8},
      position: {x: -5/8, y: 3/16, z: 0},
      material: 'unitBlack'
    },
    {
      name: 'tail',
      size: {height: 3/8, length: 2/8, width: 2/8},
      position: {x: 5/8, y: 5/16, z: 0},
      material: 'player'
    },
    {
      name: 'tailFin',
      size: {height: 3/8, length: 3/8, width: 1/8},
      position: {x: 9/16, y: 9/16, z: 0},
      material: 'unitBlack'
    },
    {
      name: 'wings',
      size: {height: 1/8, length: 3/8, width: 10/8},
      position: {x: 0, y: 1/4, z: 0},
      material: 'player'
    }
  ],
  'fighter': [
    {
      name: 'body',
      size: {height: 3/8, length: 10/8, width: 2/8},
      position: {x: 0, y: 1/4, z: 0},
      material: 'player'
    },
    {
      name: 'nose',
      size: {height: 2/8, length: 2/8, width: 1/8},
      position: {x: -6/8, y: 3/16, z: 0},
      material: 'unitBlack'
    },
    {
      name: 'blade1',
      size: {height: 6/8, length: 1/16, width: 1/8},
      position: {x: -12/16, y: 3/16, z: 0},
      rotation: {x: 1/8, y: 0, z: 0},
      material: 'unitGrey'
    },
    {
      name: 'blade2',
      size: {height: 1/8, length: 1/16, width: 6/8},
      position: {x: -12/16, y: 3/16, z: 0},
      rotation: {x: 1/8, y: 0, z: 0},
      material: 'unitGrey'
    },
    {
      name: 'tailFin',
      size: {height: 2/8, length: 2/8, width: 1/8},
      position: {x: 8/16, y: 9/16, z: 0},
      material: 'unitBlack'
    },
    {
      name: 'tailWings',
      size: {height: 1/8, length: 2/8, width: 5/8},
      position: {x: 8/16, y: 2/8, z: 0},
      material: 'player'
    },
    {
      name: 'wings',
      size: {height: 1/8, length: 3/8, width: 12/8},
      position: {x: -1/8, y: 1/8, z: 0},
      material: 'player'
    }
  ],
  'helicopter': [
    {
      name: 'body',
      size: {height: 4/8, length: 4/8, width: 4/8},
      position: {x: 0, y: 1/4, z: 0},
      material: 'player'
    },
    {
      name: 'nose',
      size: {height: 3/8, length: 2/8, width: 3/8},
      position: {x: -3/8, y: 3/16, z: 0},
      material: 'unitBlack'
    },
    {
      name: 'tail',
      size: {height: 2/8, length: 4/8, width: 2/8},
      position: {x: 4/8, y: 5/16, z: 0},
      material: 'player'
    },
    {
      name: 'tailFin',
      size: {height: 5/8, length: 2/8, width: 1/8},
      position: {x: 11/16, y: 6/16, z: 0},
      material: 'unitBlack'
    },
    {
      name: 'bladeSupport',
      size: {height: 3/8, length: 2/8, width: 2/8},
      position: {x: 0, y: 5/8, z: 0},
      rotation: {x: 0, y: 1/8, z: 0},
      material: 'unitBlack'
    },
    {
      name: 'blade1',
      size: {height: 1/16, length: 1/8, width: 10/8},
      position: {x: 0, y: 3/4, z: 0},
      rotation: {x: 0, y: 1/8, z: 0},
      material: 'unitGrey'
    },
    {
      name: 'blade2',
      size: {height: 1/16, length: 10/8, width: 1/8},
      position: {x: 0, y: 3/4, z: 0},
      rotation: {x: 0, y: 1/8, z: 0},
      material: 'unitGrey'
    }
  ]
}

export default unitsParts