import { SketchyObject } from "./object.js"

// Converts a google-docs-drawings-object string to an array of SketchyObjects
export function clipboardDataToObjects(str, raw=false) {
	const {data} = JSON.parse(str)
	const json = JSON.parse(data)

	if(raw) {
		return json.resolved
	} else {
		return json.resolved.map(o => new SketchyObject(null, o))
	}
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
