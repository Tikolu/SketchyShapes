import { ObjectTypes, ShapeTypes } from "./definitions.js"
import * as Serialiser from "./serialiser.js"

function createEnum(obj) {
	const enumObj = {}
	for(const key in obj) {
		const label = obj[key].toUpperCase().replaceAll(" ", "_")
		enumObj[label] = Number(key)
	}
	return Object.freeze(enumObj)
}

class DrawingsObject {
	static TYPE = createEnum(ObjectTypes)

	static generateID() {
		return `ga${Math.random().toString(16).slice(6)}`
	}

	static fromArray(data) {
		return Serialiser.arrayToObject(data)
	}

	constructor(type, parameters) {
		if(type == DrawingsObject.TYPE.SHAPE && !(this instanceof DrawingsShape)) {
			return new DrawingsShape(parameters)
		} else if(type == DrawingsObject.TYPE.GROUP && !(this instanceof DrawingsGroup)) {
			return new DrawingsGroup(parameters)
		}

		this.type = type

		for(const key in parameters) {
			this[key] = parameters[key]
		}

		this.id ||= DrawingsObject.generateID()

		this.x ??= 0
		this.y ??= 0
		this.widthScale ??= 1
		this.heightScale ??= 1
		this.skewX ??= 0
		this.skewY ??= 0
	}

	setProperties(properties) {
		for(const key in properties) {
			this[key] = properties[key]
		}
	}

	toArray() {
		return Serialiser.objectToArray(this)
	}
}

class DrawingsShape extends DrawingsObject {
	static SHAPE_TYPE = createEnum(ShapeTypes)

	constructor(parameters) {
		super(DrawingsObject.TYPE.SHAPE, parameters)

		this.shapeType ??= 1
	}

	get shapeName() {
		return ShapeTypes[this.shapeType] || "Unknown shape"
	}

	set shapeName(name) {
		for(const key in ShapeTypes) {
			if(ShapeTypes[key] === name) {
				this.shapeType = parseInt(key)
				return
			}
		}
		console.warn(`Unknown shape name: ${name}`)
	}
}

class DrawingsGroup extends DrawingsObject {
	constructor(parameters) {
		super(DrawingsObject.TYPE.GROUP, parameters)

		this.objectIDs = parameters.objectIDs || []
	}
}


export { DrawingsObject, DrawingsShape, DrawingsGroup }