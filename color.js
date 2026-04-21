function parseColor(colorData) {
	// Hex string
	if(/^#?[0-9a-fA-F]{6}$/.test(colorData)) {
		const hex = colorData.replace(/^#/, "")
		const r = parseInt(hex.slice(0, 2), 16) / 255
		const g = parseInt(hex.slice(2, 4), 16) / 255
		const b = parseInt(hex.slice(4, 6), 16) / 255
		return [r, g, b].map(n => Number(n.toFixed(3)))
	}

	// rgb()
	else if(/^rgba?\(/.test(colorData)) {
		const [r, g, b, a=1] = colorData.match(/[0-9.]+/g).map(Number)
		return [
			Number(Number(r / 255).toFixed(3)),
			Number(Number(g / 255).toFixed(3)),
			Number(Number(b / 255).toFixed(3)),
			Number(Number(a).toFixed(3))
		]
	}

	// RGB array
	else if(Array.isArray(colorData) && (colorData.length == 3 || colorData.length == 4)) {
		return colorData.map(n => Number(Number(n).toFixed(3)))
	}

	else if(colorData == "none" || colorData == "transparent") {
		return [0, 0, 0]
	}

	else {
		console.error("Unknown color format", colorData)
		return [0, 0, 0]
	}
}

export class Color {
	constructor(colorData) {
		const [r, g, b, a] = parseColor(colorData)
		this.r = r
		this.g = g
		this.b = b

		if(a != 1) this.a = a

		Object.defineProperty(this, "alpha", {
			get() {
				return this.a ?? 1
			},
			set(value) {
				if(value == 1) delete this.a
				else this.a = value
			}
		})
	}

	toHex() {
		if(this.alpha !== 1) {
			console.warn(`Alpha value (${this.alpha}) ignored when serialising color`)
		}

		const rHex = Math.round(this.r * 255).toString(16).padStart(2, "0")
		const gHex = Math.round(this.g * 255).toString(16).padStart(2, "0")
		const bHex = Math.round(this.b * 255).toString(16).padStart(2, "0")
		return `#${rHex}${gHex}${bHex}`
	}
}