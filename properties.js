import { ObjectProperties, LineStyles, LinePatterns } from "./definitions.js"
import { Path } from "./path.js"
import * as Color from "./color.js"

export function findKey(object, value) {
	for(const key in object) {
		if(object[key] === value) return Number(key)
	}
	throw new Error(`Invalid value ${value}`)
}

// Unpacks properties array into an object
export function parse(data) {
	const properties = {}
	for(let i = 0; i < data.length; i += 2) {
		const key = ObjectProperties[data[i]]
		if(!key) continue
		let value = data[i + 1]

		if(key.endsWith("Enabled")) {
			value = Boolean(value)
		}

		if(key == "paths") {
			value = value.map(Path.fromArray)
		}

		if(key == "borderPattern") {
			value = LinePatterns[value] || value
		}

		if(key == "borderStyle") {
			value = LineStyles[value] || value
		}

		if(key.endsWith("Color") && typeof value == "string") {
			value = Color.hexToRgb(value)
		}

		properties[key] = value
	}
	return properties
}

// Creates an array from properties object
export function toArray(properties) {
	const propertiesData = []
	for(const key in ObjectProperties) {
		const propertyName = ObjectProperties[key]
		let value = properties[propertyName]
		if(value === undefined) continue

		if(typeof value == "boolean") {
			value = Number(value)
		}

		if(propertyName == "paths") {
			value = value.map(path => path.toArray())
		}

		if(propertyName == "borderPattern") {
			value = findKey(LinePatterns, value)
		}

		if(propertyName == "borderStyle") {
			value = findKey(LineStyles, value)
		}

		if(propertyName.endsWith("Color") && Array.isArray(value)) {
			value = Color.rgbToHex(...value)
		}

		propertiesData.push(Number(key), value)
	}
	return propertiesData
}