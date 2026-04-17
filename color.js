export function hexToRgb(hex) {
	hex = hex.replace(/^#/, "")
	const r = (parseInt(hex.slice(0, 2), 16) / 255).toFixed(3)
	const g = (parseInt(hex.slice(2, 4), 16) / 255).toFixed(3)
	const b = (parseInt(hex.slice(4, 6), 16) / 255).toFixed(3)
	return [
		Number(r),
		Number(g),
		Number(b)
	]
}

export function rgbToHex(r, g, b) {
	const rHex = Math.round(r * 255).toString(16).padStart(2, "0")
	const gHex = Math.round(g * 255).toString(16).padStart(2, "0")
	const bHex = Math.round(b * 255).toString(16).padStart(2, "0")
	return `#${rHex}${gHex}${bHex}`
}