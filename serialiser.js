import { ObjectProperties } from "./definitions.js"
import { DrawingsObject, DrawingsShape, DrawingsGroup } from "./drawingsObject.js"
import { Path } from "./path.js"

// Unpacks properties array into an object
function parseProperties(data) {
	const properties = {}
	for(let i = 0; i < data.length; i += 2) {
		const key = ObjectProperties[data[i]]
		if(!key) continue
		let value = data[i + 1]

		if(key.endsWith("Enabled")) {
			value = Boolean(value)
		}
		else if(key == "paths") {
			value = value.map(Path.fromArray)
		}

		properties[key] = value
	}
	return properties
}

// Creates an array from properties object
function propertiesToArray(properties) {
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

		propertiesData.push(Number(key), value)
	}
	return propertiesData
}
	
// Creates a DrawingsObject from data array
export function arrayToObject(data) {
	const objectType = data[0]
	const positionData = data[3]

	const newObject = new DrawingsObject(objectType, {
		id: data[1],
		x: positionData[4],
		y: positionData[5],
		widthScale: positionData[0],
		heightScale: positionData[3],
		skewX: positionData[1],
		skewY: positionData[2]
	})

	if(objectType == DrawingsObject.TYPE.SHAPE) {
		newObject.shapeType = data[2]

		const properties = parseProperties(data[4])
		newObject.setProperties(properties)
	}

	else if(objectType == DrawingsObject.TYPE.GROUP) {
		newObject.objectIDs = data[2]
	}

	else {
		console.warn(`Unknown object type: ${objectType}`)
	}

	return newObject
}


// Creates an array from a DrawingsObject
export function objectToArray(object) {
	const data = [
		object.type,
		object.id
	]

	if(object.type == DrawingsObject.TYPE.SHAPE) {
		data.push(object.shapeType)
	}
	else if(object.type == DrawingsObject.TYPE.GROUP) {
		data.push(object.objectIDs)
	}

	data.push(
		[
			object.widthScale,
			object.skewX,
			object.skewY,
			object.heightScale,
			object.x,
			object.y
		],
		propertiesToArray(object)
	)

	return data
}

// Converts a google-docs-drawings-object string to an array of DrawingsObjects
export function clipboardDataToObjects(str, raw=false) {
	const {data} = JSON.parse(str)
	const json = JSON.parse(data)

	if(raw) {
		return json.resolved
	} else {
		return json.resolved.map(arrayToObject)
	}
}

// Converts an array of DrawingsObjects to a google-docs-drawings-object string
export function objectsToClipboardData(objects, raw=false) {
	let resolved
	if(raw) {
		resolved = objects
	} else {
		resolved = objects.map(objectToArray)
	}

	return JSON.stringify({
		data: JSON.stringify({resolved})
	})
}
