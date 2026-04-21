import { LineStyles, LinePatterns, TextAlignments, LineJoins } from "./definitions.js"
import { Path } from "./path.js"
import { Color } from "./color.js"

export function findKey(definition, value) {
	for(const key in definition) {
		if(definition[key] === value) return Number(key)
	}
	throw new Error(`Invalid value ${value}`)
}

const propertyProcessors = {
	paths: [
		v => v.map(Path.fromArray),
		v => v.map(path => path.toArray())
	],
	borderPattern: [
		v => LinePatterns[v] || 0,
		v => findKey(LinePatterns, v)
	],
	borderStyle: [
		v => LineStyles[v] || 0,
		v => findKey(LineStyles, v)
	],
	textAlign: [
		v => TextAlignments[v] || 0,
		v => findKey(TextAlignments, v)
	],
	lineJoin: [
		v => LineJoins[v] || 0,
		v => findKey(LineJoins, v)
	]
}

// Unpacks properties array into an object
export function parse(definition, data) {
	const properties = {}

	for(let i = 0; i < data.length; i += 2) {
		const key = definition[data[i]]
		let value = data[i + 1]
		if(!key) {
			if(!properties.unknownProperties) properties.unknownProperties = {}
			properties.unknownProperties[data[i]] = value
			continue
		}

		if(key.endsWith("Enabled")) {
			value = Boolean(value)
		}

		if(key.endsWith("Color") && typeof value == "string") {
			value = new Color(value)
		}

		if(propertyProcessors[key]) {
			value = propertyProcessors[key][0](value)
		}

		properties[key] = value
	}

	return properties
}

// Creates an array from properties object
export function toArray(definition, properties) {
	const propertiesData = []
	for(const key in definition) {
		const propertyName = definition[key]
		let value = properties[propertyName]
		if(value === undefined) continue

		if(typeof value == "boolean") {
			value = Number(value)
		}

		if(propertyName.endsWith("Color") && value instanceof Color) {
			value = value.toHex()
		}

		if(propertyProcessors[propertyName]) {
			value = propertyProcessors[propertyName][1](value)
		}

		propertiesData.push(Number(key), value)
	}

	for(const key in properties.unknownProperties || {}) {
		propertiesData.push(Number(key), properties.unknownProperties[key])
	}

	return propertiesData
}