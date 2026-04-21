import { SketchyShape, SketchyText, SketchyFormatting } from "./object.js"
import { Color } from "./color.js"
import { Path } from "./path.js"

const SCALE = 1000
const RELATIVE_SCALE = 315
const FONT_SCALE = 1.95

function parsePx(value) {
	return Number(value.replace("px", ""))
}

function createShape(element, styles) {
	const rect = element.getBBox()

	// Create shape
	const shape = new SketchyShape({
		x: (SCALE * rect.x) || 0,
		y: (SCALE * rect.y) || 0
	})

	shape.defineSource("svgElement", element)

	// Width and height
	if(rect.width) shape.width = rect.width * SCALE
	if(rect.height) shape.height = rect.height * SCALE

	// Fill color
	if(styles.fill && styles.fill != "none") {
		const color = new Color(styles.fill)
		if(color.alpha !== 1) {
			shape.fillOpacity = color.alpha
			color.alpha = 1
		}
		shape.fillColor = color
	}

	// Opacity
	const opacity = Number(styles.opacity || 1)
	if(opacity != 1) shape.fillOpacity = opacity

	// Border
	const strokeWidth = parsePx(styles.strokeWidth)
	if(strokeWidth) {
		shape.borderWidth = SCALE * strokeWidth
	}
	shape.borderColor = new Color(styles.stroke)

	// Line join
	shape.lineJoin = styles["stroke-linejoin"] || "miter"

	// Points
	if(element.hasAttribute("points")) {
		const points = element.getAttribute("points").trim().split(/[\s,]+/)
		shape.paths = [
			Path.fromPoints(points.map(p => Number(p) * SCALE))
		]
		shape.updateBoundsFromPaths()
	}

	return shape
}

const converters = {
	rect(element, styles) {
		const shape = createShape(element, styles)

		// Border radius
		let rx = element.getAttribute("rx")
		let ry = element.getAttribute("ry")

		if(rx || ry) {
			shape.shapeType = "Rounded Rectangle"

			if(rx === null) rx = ry
			if(ry === null) ry = rx

			rx *= SCALE
			ry *= SCALE

			shape.shapeModifier0 = (rx + ry) * 1.45

		} else {
			shape.shapeType = "Rectangle"
		}

		return shape
	},

	circle(element, styles) {
		const shape = createShape(element, styles)

		shape.shapeType = "Oval"

		const cx = element.getAttribute("cx") * SCALE
		const cy = element.getAttribute("cy") * SCALE
		const r = element.getAttribute("r") * SCALE

		shape.x = cx - r
		shape.y = cy - r
		shape.width = r * 2
		shape.height = r * 2

		return shape
	},

	ellipse(element, styles) {
		const shape = createShape(element, styles)

		shape.shapeType = "Oval"

		const cx = element.getAttribute("cx") * SCALE
		const cy = element.getAttribute("cy") * SCALE
		const rx = element.getAttribute("rx") * SCALE
		const ry = element.getAttribute("ry") * SCALE

		shape.x = cx - rx
		shape.y = cy - ry
		shape.width = rx * 2
		shape.height = ry * 2

		return shape
	},

	line(element, styles) {
		const shape = createShape(element, styles)

		shape.shapeType = "Line"

		const x1 = element.getAttribute("x1") * SCALE
		const y1 = element.getAttribute("y1") * SCALE
		const x2 = element.getAttribute("x2") * SCALE
		const y2 = element.getAttribute("y2") * SCALE

		shape.x = x1
		shape.y = y1
		shape.width = x2 - x1
		shape.height = y2 - y1

		return shape
	},

	polyline(element, styles) {
		const shape = createShape(element, styles)

		shape.shapeType = "Polyline"

		return shape
	},

	polygon(element, styles) {
		const shape = createShape(element, styles)

		shape.shapeType = "Polyline"
		shape.paths[0].closed = true

		if(shape.fillColor) {
			shape.fillEnabled = true
		}

		return shape
	},

	text(element, styles) {
		const shape = createShape(element, styles)

		shape.shapeType = "Text Box"
		shape.textContent = element.textContent

		const formatting = new SketchyFormatting({
			range: [0, element.textContent.length],

			fontColor: new Color(styles.fill),
			fontSize: parsePx(styles.fontSize) * FONT_SCALE
		})

		// Bold
		let fontWeight = Number(styles.fontWeight) || 400
		if(fontWeight == "normal") fontWeight = 400
		else if(fontWeight == "bold") fontWeight = 700
		if(fontWeight > 400) formatting.boldEnabled = true

		// Italic, underline, strikethrough
		if(styles.fontStyle == "italic") formatting.italicEnabled = true
		if(styles.textDecoration.includes("underline")) formatting.underlineEnabled = true
		if(styles.textDecoration.includes("line-through")) formatting.strikethroughEnabled = true

		// Font family
		if(styles.fontFamily) {
			let font = styles.fontFamily.split(",")[0].trim()
			font = font.replace(/['"]/g, "")

			if(font == "sans-serif") font = "Arial"
			else if(font == "serif") font = "Times New Roman"
			else if(font == "monospace") font = "Courier New"

			formatting.fontFamily = font
		}

		// Text align
		if(styles["text-align"]) {
			let align = styles["text-align"]
			if(align == "start") align = "left"
			else if(align == "end") align = "right"

			formatting.textAlignment = align
		}

		// Padding
		shape.textPadding = {
			top: parsePx(styles.paddingTop || 0),
			right: parsePx(styles.paddingRight || 0),
			bottom: parsePx(styles.paddingBottom || 0),
			left: parsePx(styles.paddingLeft || 0)
		}

		shape.attachObject(formatting)
		return [shape, formatting]
	}
}

export function SVGToObjects(svg) {
	const objects = []

	for(const element of svg.children) {
		const converter = converters[element.tagName]
		if(!converter) {
			console.warn("Skipping unsupported element", element)
			continue
		}

		// Call converter
		const styles = window.getComputedStyle(element)
		let shape = converter(element, styles)
		if(!Array.isArray(shape)) shape = [shape]
		objects.push(...shape)
	}

	return objects
}