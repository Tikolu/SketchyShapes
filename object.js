import { ObjectTypes, ShapeTypes, ShapeProperties, FormattingProperties } from "./definitions.js"
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

			this.id = rawData[1]
		}

		if(parameters) this.setProperties(parameters)

		this.id ||= SketchyObject.generateID()
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

			this.setProperties(Properties.parse(ShapeProperties, rawData[4]))
		}

		this.shapeType ??= "Customised"
	}

	toArray() {
		const data = super.toArray()

		data.push(
			Properties.findKey(ShapeTypes, this.shapeType),
			[
				this.widthScale ?? 1,
				this.skewX ?? 0,
				this.skewY ?? 0,
				this.heightScale ?? 1,
				this.x ?? 0,
				this.y ?? 0
			],
			Properties.toArray(ShapeProperties, this)
		)

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
	}

	toArray() {
		const data = super.toArray()
		data.push(this.objectIDs)

		return data
	}
}


class SketchyDescription extends SketchyObject {
	static objectType = "Description"

	constructor(parameters, rawData) {
		super(parameters, rawData)

		if(rawData) {
			this.title = rawData[2]
			this.description = rawData[3]
		}

		this.title ||= ""
		this.description ||= ""
	}

	toArray() {
		const data = super.toArray()
		data.push(this.title, this.description)

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

		this.content ||= ""
	}

	toArray() {
		const data = super.toArray()
		data.push(null, 0, this.content)

		return data
	}
}


class SketchyFormatting extends SketchyObject {
	static objectType = "Formatting"

	constructor(parameters, rawData) {
		super(parameters, rawData)

		if(rawData) {
			this.range = [rawData[3], rawData[4]]

			this.setProperties(Properties.parse(FormattingProperties, rawData[6]))
		}

		this.range ||= [0, 0]
	}

	toArray() {
		const data = super.toArray()

		data.push(
			null,
			...this.range,
			[],
			Properties.toArray(FormattingProperties, this)
		)

		return data
	}
}


const classes = [SketchyObject, SketchyShape, SketchyGroup, SketchyDescription, SketchyText, SketchyFormatting]
export { SketchyObject, SketchyShape, SketchyGroup, SketchyDescription, SketchyText, SketchyFormatting }