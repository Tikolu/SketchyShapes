import { SketchyShape, SketchyText, SketchyFormatting, SketchyGroup } from "./object.js"
import { Color } from "./color.js"
import { Path, MoveCommand, LineCommand, CubicCommand, CloseCommand } from "./path.js"

const SCALE = 381
const FONT_SCALE = 0.743

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

	// Fill gradient
	if(styles.fill.startsWith("url(")) {
		const gradientID = styles.fill.slice(4, -1).replaceAll(/["']/g, "")
		const gradientElement = element.ownerSVGElement.querySelector(gradientID)
		if(gradientElement) {
			shape.fillGradientType = gradientElement.tagName == "linearGradient" ? "linear" : "radial"
			shape.fillGradientColors = []
			for(const stop of gradientElement.querySelectorAll("stop")) {
				let offset = stop.getAttribute("offset")
				if(offset.endsWith("%")) offset = Number(offset.replace("%", "")) / 100
				else offset = Number(offset)

				const stopStyle = window.getComputedStyle(stop)
				const color = new Color(stopStyle.stopColor)
				const opacity = Number(stopStyle.stopOpacity || 1)
				color.alpha *= opacity
				shape.fillGradientColors.push({color, offset})
			}

			const gradientTransform = gradientElement.gradientTransform?.baseVal.consolidate()
			if(gradientTransform) {
				const {a, b, c, d, e, f} = gradientTransform.matrix
				shape.fillGradientAngle = Math.atan2(b, a)
			}

		} else {
			console.warn(`Gradient #${gradientID} not found`)
		}

	// Fill color
	} else {
		shape.fillColor = new Color(styles.fill)
	}

	// Fill opacity
	const fillOpacity = Number(styles.fillOpacity || 1)
	if(fillOpacity != 1) shape.fillOpacity = fillOpacity

	// Border
	const strokeWidth = parsePx(styles.strokeWidth)
	if(strokeWidth) {
		shape.borderWidth = SCALE * strokeWidth
	}
	shape.borderColor = new Color(styles.stroke)
	const borderOpacity = Number(styles.strokeOpacity || 1)
	if(borderOpacity != 1) shape.borderOpacity = borderOpacity

	// Overall opacity
	const opacity = Number(styles.opacity || 1)
	if(opacity != 1) {
		shape.fillOpacity ??= 1
		shape.fillOpacity *= opacity

		shape.borderOpacity ??= 1
		shape.borderOpacity *= opacity
	}

	// Line join
	shape.lineJoin = styles["stroke-linejoin"] || "miter"

	// Points
	if(element.hasAttribute("points")) {
		const points = element.getAttribute("points").trim().split(/[\s,]+/)
		const path = new Path([
			new MoveCommand(points[0] * SCALE, points[1] * SCALE)
		])
		for(let i = 2; i < points.length; i += 2) {
			path.commands.push(
				new LineCommand(points[i] * SCALE, points[i + 1] * SCALE)
			)
		}
		shape.paths = [path]
		shape.updateBoundsFromPaths()
	}

	return shape
}

function processPathData(element, shape) {
	const path = new Path()

	for(const command of element.getPathData({normalize: true})) {
		let newCommand
		if(command.type == "M") newCommand = MoveCommand
		else if(command.type == "L") newCommand = LineCommand
		else if(command.type == "C") newCommand = CubicCommand
		else if(command.type == "Z") newCommand = CloseCommand
		else {
			throw new Error(`Unsupported path command ${command.type}`)
		}

		path.commands.push(new newCommand(...command.values.map(p => p * SCALE)))
	}
	path.moveBy(-shape.x, -shape.y)

	shape.paths ||= []
	shape.paths.push(path)
}

const converters = {
	rect(element, styles) {
		const shape = createShape(element, styles)

		// Border radius
		let rx = element.getAttribute("rx")
		let ry = element.getAttribute("ry")

		if(rx || ry) {
			shape.shapeType = "Rounded Rectangle"
			processPathData(element, shape)
		} else {
			shape.shapeType = "Rectangle"
		}

		return [shape]
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

		return [shape]
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

		return [shape]
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

		return [shape]
	},

	polyline(element, styles) {
		const shape = createShape(element, styles)

		shape.shapeType = "Polyline"

		return [shape]
	},

	polygon(element, styles) {
		const shape = createShape(element, styles)

		shape.shapeType = "Polygon"

		// Add close command to path
		shape.paths[0]?.commands.push(new CloseCommand())

		return [shape]
	},

	path(element, styles) {
		const shape = createShape(element, styles)

		shape.shapeType = "Customised"

		if(element.hasAttribute("d")) {
			processPathData(element, shape)
		}

		return [shape]
	},

	text(element, styles) {
		const shape = createShape(element, styles)

		shape.shapeType = "Text Box"

		// Remove fill
		delete shape.fillColor
		delete shape.fillOpacity
		delete shape.fillEnabled

		const text = new SketchyText({
			content: element.textContent
		})

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

		shape.attachObject(text, formatting)
		return [shape, text, formatting]
	},

	g(element, styles) {
		const group = new SketchyGroup()

		const objects = SVGToObjects(element)
		group.attachObject(...objects)

		return [...objects, group]
	}

}

const ignoreElements = ["linearGradient", "radialGradient"]
export function SVGToObjects(svg) {
	const objects = []

	for(const element of svg.children) {
		const converter = converters[element.tagName]
		if(!converter) {
			if(!ignoreElements.includes(element.tagName)) {
				console.warn("Skipping unsupported element", element)
			}
			continue
		}

		// Call converter
		const styles = window.getComputedStyle(element)
		const shapes = converter(element, styles)

		for(const shape of shapes) {
			objects.push(shape)
		}
	}

	return objects
}