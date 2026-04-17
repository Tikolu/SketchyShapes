import { ObjectTypes, ShapeTypes } from "./definitions.js"
import { Path } from "./path.js"
import * as Properties from "./properties.js"

class SketchyObject {
	static generateID() {
		return `ga${Math.random().toString(16).slice(6)}`
	}

	constructor(parameters, rawData) {
		if(rawData) {
			const objectType = ObjectTypes[rawData[0]] || rawData[0]

			// Attempt to create a more specific object type
			for(const classType of classes) {
				if(objectType === classType.objectType && !(this instanceof classType)) {
					return new classType(parameters, rawData)
				}
			}

			Object.defineProperty(this, "type", {
				value: objectType,
				enumerable: true
			})

			this.id = rawData[1]
		}

		if(parameters) this.setProperties(parameters)

		this.id ||= SketchyObject.generateID()

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
		const data = [
			Properties.findKey(ObjectTypes, this.type),
			this.id,
		]

		data.push(
			[
				this.widthScale,
				this.skewX,
				this.skewY,
				this.heightScale,
				this.x,
				this.y
			],
			Properties.toArray(this)
		)

		return data
	}
}


class SketchyShape extends SketchyObject {
	static objectType = "Shape"

	constructor(parameters, rawData) {
		super(parameters, rawData)

		if(rawData) {
			this.shapeType = ShapeTypes[rawData[2]] || rawData[2]

			const positionData = rawData[3]
			this.setProperties({
				x: positionData[4],
				y: positionData[5],
				widthScale: positionData[0],
				heightScale: positionData[3],
				skewX: positionData[1],
				skewY: positionData[2]
			})

			this.setProperties(Properties.parse(rawData[4]))
		}

		this.shapeType ??= "Customised"

		this.shapeType ??= 1
	}

	toArray() {
		const data = super.toArray()
		data.splice(2, 0, Properties.findKey(ShapeTypes, this.shapeType))

		return data
	}
}


class SketchyGroup extends SketchyObject {
	static objectType = "Group"

	constructor(parameters, rawData) {
		super(parameters, rawData)

		if(rawData) {
			this.objectIDs = rawData[2]
		}

		this.objectIDs ||= parameters?.objectIDs || []
	}

	toArray() {
		const data = super.toArray()
		data.splice(2, 0, this.objectIDs)

		return data
	}
}


class SketchyText extends SketchyObject {
	static objectType = "Text"

	constructor(parameters, rawData) {
		super(parameters, rawData)

		if(rawData) {
			this.content = rawData[4]
		}

		this.content ||= parameters?.content || ""
	}

	toArray() {
		const data = super.toArray()
		data.splice(2, 0, null, 0, this.content)

		return data
	}
}


class SketchyFormatting extends SketchyObject {
	static objectType = "Formatting"

	constructor(parameters, rawData) {
		super(parameters, rawData)
	}
}


const classes = [SketchyObject, SketchyShape, SketchyGroup, SketchyText, SketchyFormatting]
export { SketchyObject, SketchyShape, SketchyGroup, SketchyText, SketchyFormatting }