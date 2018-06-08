////////////////////////////////////////////////////////////////////////////////
// HEXMAP LIB
////////////////////////////////////////////////////////////////////////////////

// Massive kudos to Amit Patel
// This code is adapted from his awesome work
// See: http://www.redblobgames.com/grids/hexagons/

// Changelog (from v1) :
// - singleton object
// - removed semicolons and var keyword


const HEXLIB = {}

////////////////////////////////////////////////////////////////////////////////
// CUBIC COORD HEX

// HEX FACTORY

HEXLIB.hex = (x = 0, y = 0, z) => z ? {x, y, z} : {x, y, z: (-x - y)}

// ADD & SUBSTRACT & EQUALS & IS-IN/INDEX-OF

HEXLIB.hexAdd = (h1, h2) => ({x: h1.x + h2.x, y: h1.y + h2.y, z: h1.z + h2.z})
HEXLIB.hexSub = (h1, h2) => ({x: h1.x - h2.x, y: h1.y - h2.y, z: h1.z - h2.z})
HEXLIB.hexMultiply = (h, k) => ({x: h.x * k, y: h.y * k, z: h.z * k})
HEXLIB.hexEqual = (h1, h2) => h1.x === h2.x && h1.y === h2.y ? true : false
HEXLIB.hexIndexOf = (hs, h) => {
	let isIn = false
	for (let i = 0; i < hs.length; i++) {
		if (HEXLIB.hexEqual(hs[i], h)) {
			isIn = true
		}
	}

	return isIn
}

// LENGTH & DISTANCE

HEXLIB.hexLength = (h) => (Math.abs(h.x) + Math.abs(h.y) + Math.abs(h.z)) / 2
HEXLIB.hexDistance = (h1, h2) => HEXLIB.hexLength(HEXLIB.hexSub(h1, h2))

// NEIGHBORS

HEXLIB.hexDirections = [
	HEXLIB.hex(+1,-1,0), HEXLIB.hex(+1,0,-1), HEXLIB.hex(0,+1,-1),
	HEXLIB.hex(-1,+1,0), HEXLIB.hex(-1,0,+1), HEXLIB.hex(0,-1,+1)
]
HEXLIB.hexDirection = (d) => HEXLIB.hexDirections[d]

HEXLIB.hexNeighbor = (h, d) => HEXLIB.hexAdd(h, HEXLIB.hexDirection(d))
HEXLIB.hexNeighbors = (h) => {
	const neighbors = []
	for (let d = 0; d < 6; d++) {
		neighbors.push( HEXLIB.hexNeighbor(h, d) )
	}

	return neighbors
}

// DIAGONALS

HEXLIB.hexDiagonals = [ 
	HEXLIB.hex(2,-1,-1), HEXLIB.hex(1,-2,1), HEXLIB.hex(-1,-1,2),
	HEXLIB.hex(-2,1,1), HEXLIB.hex(-1,2,-1), HEXLIB.hex(1,1,-2)
]

HEXLIB.hexNeighborDiagonal = (h, d) => HEXLIB.hexAdd(h, HEXLIB.hexDiagonals[d])
HEXLIB.hexNeighborsDiagonal = (h) => {
	const neighbors = []
	for (let d = 0; d < 6; d++) {
		neighbors.push( HEXLIB.hexNeighborDiagonal(h, d) )
	}

	return neighbors
}

// ROUNDING

HEXLIB.hexRound = (h) => {
	let x = Math.trunc(Math.round(h.x)),
			y = Math.trunc(Math.round(h.y)),
			z = Math.trunc(Math.round(h.z))

	const xD = Math.abs(x - h.x),
				yD = Math.abs(y - h.y),
				zD = Math.abs(z - h.z)

	if (xD > yD && xD > zD) { x = -y - z }
	else if (yD > zD) { y = -x - z } 
	else { z = -x - y }

	return HEXLIB.hex(x, y, z)
}

// LERP & LINEDRAWING

// Linear extrapolation
HEXLIB.hexLerp = (h1, h2, t) => HEXLIB.hex(
	h1.x + (h2.x - h1.x) * t,
	h1.y + (h2.y - h1.y) * t,
	h1.z + (h2.z - h1.z) * t
)

HEXLIB.hexLinedraw = (h1, h2) => {
	const N = HEXLIB.hexDistance(h1, h2),
				line = [],
				step = 1.0 / Math.max(N, 1)
	
	for (let i = 0; i <= N; i++) {
		line.push(HEXLIB.hexRound(HEXLIB.hexLerp(h1, h2, step * i)))
	}

	return line
}


////////////////////////////////////////////////////////////////////////////////
// OFFSET COORD HEX

HEXLIB.hexOffset = (col, row) => ({col, row})

// CONVERSION

// Topped
HEXLIB.FLAT = true
HEXLIB.POINTY = false
// Parity
HEXLIB.EVEN = 1
HEXLIB.ODD = -1

HEXLIB.hex2Offset = (h, topped = HEXLIB.FLAT, parity = HEXLIB.ODD) => topped ? 
	HEXLIB.hexOffset(
		h.x, 
		h.y + Math.trunc((h.x + parity * (h.x & 1)) / 2)
	) :
	HEXLIB.hexOffset(
		h.x + Math.trunc((h.y + parity * (h.y & 1)) / 2), 
		h.y
	)

HEXLIB.offset2Hex = (h, topped = HEXLIB.FLAT, parity = HEXLIB.ODD) => {
	let x, y
	if (topped) {
		x = h.col
		y = h.row - Math.trunc((h.col + parity * (h.col & 1)) / 2)
	} else {
		x = h.col - Math.trunc((h.row + parity * (h.row & 1)) / 2)
		y = h.row
	}

	return HEXLIB.hex(x, y, -x - y)
}


////////////////////////////////////////////////////////////////////////////////
// LAYOUT

HEXLIB.orientation = (f0, f1, f2, f3, b0, b1, b2, b3, startAngle) => (	
	{f0, f1, f2, f3, b0, b1, b2, b3, startAngle} 
)

HEXLIB.point = (x, y) => ({x,y})

HEXLIB.layout = (orientation, size, origin) => ({orientation, size, origin})

HEXLIB.orientationPointy = HEXLIB.orientation(
	Math.sqrt(3), Math.sqrt(3)/2, 0, 3/2, 
	Math.sqrt(3)/3, -1/3, 0, 2/3, 
	0.5
)
HEXLIB.orientationFlat = HEXLIB.orientation(
	3/2, 0, Math.sqrt(3)/2, Math.sqrt(3), 
	2/3, 0, -1/3, Math.sqrt(3)/3, 
	0
)

HEXLIB.hex2Pixel = (layout, h) => {
	const M = layout.orientation,
				size = layout.size,
				origin = layout.origin,
				x = (M.f0 * h.x + M.f1 * h.y) * size.x,
				y = (M.f2 * h.x + M.f3 * h.y) * size.y

	return HEXLIB.point(x + origin.x, y + origin.y)
}

HEXLIB.pixel2Hex = (layout, p) => {
	const M = layout.orientation,
				size = layout.size,
				origin = layout.origin,
				pt = HEXLIB.point((p.x - origin.x) / size.x, (p.y - origin.y) / size.y),
				x = M.b0 * pt.x + M.b1 * pt.y,
				y = M.b2 * pt.x + M.b3 * pt.y

	return HEXLIB.hex(x, y, -x - y)
}

HEXLIB.hexCornerOffset = (layout, corner, k = 1) => {
	const M = layout.orientation,
				size = layout.size,
				angle = 2 * Math.PI * (corner + M.startAngle) / 6

	return HEXLIB.point(size.x * Math.cos(angle) * k, size.y * Math.sin(angle) * k)
}

HEXLIB.hexCorners = (layout, h, k = 1) => {
	const corners = [],
				center = HEXLIB.hex2Pixel(layout, h)

	for (var i = 0; i < 6; i++) {
		const offset = HEXLIB.hexCornerOffset(layout, i, k)
		corners.push(HEXLIB.point(center.x + offset.x, center.y + offset.y))
	}

	return corners
}


////////////////////////////////////////////////////////////////////////////////
// Hexmap lib API demo

// console.warn("HEXMAP LIB")

// console.log("Coord")
// let o1 = HEXLIB.hexOffset(3,4)
// let h1 = HEXLIB.offset2Hex(o1, HEXLIB.FLAT, HEXLIB.ODD)
// console.log(o1, h1)

// let o2 = HEXLIB.hexOffset(12, 7)
// let h2 = HEXLIB.offset2Hex(o2, HEXLIB.FLAT, HEXLIB.ODD)
// console.log(o2, h2)

// console.log("Addition, substraction and multiplication")
// let h3 = HEXLIB.hexAdd(h1, h2); console.log(h3)
// let h4 = HEXLIB.hexSub(h1, h2); console.log(h4)
// let h5 = HEXLIB.hexMultiply(h1, 2); console.log(h5)

// console.log("Length")
// let l = HEXLIB.hexLength(h1); console.log(l)

// console.log("Distance")
// let d = HEXLIB.hexDistance(h1, h2); console.log(d)

// console.log("Neighbors")
// let hn = HEXLIB.hexNeighbors(h1); console.log(hn)
// let hnd = HEXLIB.hexNeighborsDiagonal(h1); console.log(hnd)

export default HEXLIB
