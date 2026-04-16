import { ShapeTypes, ObjectProperties } from "./definitions.js"


class DrawingsObject {
	static TYPE = {
		GROUP: 2,
		SHAPE: 3
	}

	static generateID() {
		return `ga${Math.random().toString(16).slice(6)}`
	}

	// Unpacks properties array into an object
	static parseProperties(data) {
		const properties = {}
		for(let i = 0; i < data.length; i += 2) {
			const key = ObjectProperties[data[i]]
			if(!key) continue
			properties[key] = data[i + 1]
		}
		return properties
	}
	
	// Creates a DrawingsObject from data array
	static fromArray(data) {
		const objectType = data[0]
		const positionData = data[3]

		let objectData = {
			id: data[1],
			x: positionData[4],
			y: positionData[5],
			width: positionData[0],
			height: positionData[3],
			skewX: positionData[1],
			skewY: positionData[2]
		}

		if(objectType == DrawingsObject.TYPE.SHAPE) {
			objectData.shapeType = data[2]

			objectData = {
				...objectData,
				...DrawingsObject.parseProperties(data[4])
			}

			return new DrawingsShape(objectData)
		}

		else if(objectType == DrawingsObject.TYPE.GROUP) {
			objectData.objectIDs = data[2]
			return new DrawingsGroup(objectData)
		}

		else {
			console.warn(`Unknown object type: ${objectType}`)
			return new DrawingsObject(objectType, objectData)
		}

	}

	// Seriailizes the object into an array
	toArray() {
		const data = [
			this.type,
			this.id
		]

		if(this.type == DrawingsObject.TYPE.SHAPE) {
			data.push(this.shapeType)
		}
		else if(this.type == DrawingsObject.TYPE.GROUP) {
			data.push(this.objectIDs)
		}

		data.push([
			this.width,
			this.skewX,
			this.skewY,
			this.height,
			this.x,
			this.y
		])

		const propertiesData = []
		for(const key in ObjectProperties) {
			const propertyName = ObjectProperties[key]
			const value = this[propertyName]

			if(value === undefined) continue
			propertiesData.push(Number(key), value)
		}
		data.push(propertiesData)

		return data

	}

	constructor(type, parameters) {
		this.type = type

		for(const key in parameters) {
			this[key] = parameters[key]
		}

		this.id ||= DrawingsObject.generateID()

		this.x ??= 0
		this.y ??= 0
		this.width ??= 1
		this.height ??= 1
		this.skewX ??= 0
		this.skewY ??= 0
	}
}

class DrawingsShape extends DrawingsObject {
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