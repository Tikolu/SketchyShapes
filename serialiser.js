import { SketchyObject } from "./object.js"

// Converts a google-docs-drawings-object string to an array of SketchyObjects
export function clipboardDataToObjects(str, raw=false) {
	const {data} = JSON.parse(str)
	const json = JSON.parse(data)

	if(raw) {
		return json.resolved
	}

	const objects = []
	for(const objectData of json.resolved) {
		const object = new SketchyObject(null, objectData)
		object.defineSource("clipboardData", objectData)
		objects.push(object)
	}

	// Resolve groups
	for(const group of objects.filter(o => o.type == "Group")) {
		const objectIDs = group.objectIDs || []
		for(const objectID of objectIDs) {
			const object = objects.find(o => o.id == objectID)
			if(object) {
				group.attachObject(object)
			} else {
				console.warn(`Object with ID ${objectID} not found for group ${group.id}`)
			}
		}
	}

	return objects
}

// Converts an array of SketchyObjects to a google-docs-drawings-object string
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
