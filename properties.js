import {
	LineStyles,
	LinePatterns,
	TextAlignments,
	LineJoins,
	LineCaps,
	GradientTypes,
	GradientCenters
} from "./definitions.js"
import { Path } from "./path.js"
import { Color } from "./color.js"

export function findKey(definition, value) {
	for(const key in definition) {
		if(definition[key] === value) return Number(key)
	}
	throw new Error(`Invalid value ${value}`)
}

export function decimalRound(value, p=4) {
	const f = Math.pow(10, p)
	return Math.round((value + Number.EPSILON) * f) / f
}

const propertyProcessors = {
	shapeModifier0: v => Math.round(v),
	shapeModifier1: v => Math.round(v),
	width: v => Math.round(v),
	height: v => Math.round(v),
	paths: [
		v => v.map(Path.fromArray),
		v => v.map(path => path.toArray())
	],
	borderWidth: v => Math.round(v),
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
	],
	lineCap: [
		v => LineCaps[v] || 0,
		v => findKey(LineCaps, v)
	],
	textPadding: [
		v => ({
			top: v[0],
			right: v[1],
			bottom: v[2],
			left: v[3]
		}),
		v => {
			if(Array.isArray(v)) return v
			else if(typeof v == "number") return [v, v, v, v]
			else return [v.top, v.right, v.bottom, v.left]
		}
	],
	fillGradientColors: [
		v => v.map(c => ({
			color: new Color(c[0]),
			offset: c[1]
		})),
		v => v.map(c => [c.color.toHex(), c.offset])
	],
	fillGradientType: [
		v => GradientTypes[v] || 0,
		v => findKey(GradientTypes, v)
	],
	fillGradientCenter: [
		v => GradientCenters[v] || 0,
		v => findKey(GradientCenters, v)
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
			const processor = propertyProcessors[key][0] || propertyProcessors[key]
			value = processor(value)
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
			const processor = propertyProcessors[propertyName][1] ||
							  propertyProcessors[propertyName][0] ||
							  propertyProcessors[propertyName]
			value = processor(value)
		}

		propertiesData.push(Number(key), value)
	}

	for(const key in properties.unknownProperties || {}) {
		propertiesData.push(Number(key), properties.unknownProperties[key])
	}

	return propertiesData
}