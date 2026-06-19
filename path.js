import { PathCommands } from "./definitions.js"
import * as Properties from "./properties.js"

class PathError extends Error {
	constructor(message) {
		super(message)
		this.name = "PathError"
	}
}

class Command {
	static findClass(type) {
		const commandType = PathCommands[type] || type
		for(const classType of classes) {
			if(commandType === classType.commandType) {
				return classType
			}
		}
	}

	constructor(points=[], type) {
		if(type) {
			const commandClass = Command.findClass(type)
			if(commandClass) return new commandClass(...points)
		}

		Object.defineProperties(this, {
			type: {value: this.constructor.commandType || "Command"}
		})

		if(this.constructor.pointCount && this.constructor.pointCount != points.length) {
			throw new PathError(`Invalid number of points for ${this.type} command: expected ${this.constructor.pointCount}, got ${points.length}`)
		}
		for(const point of points) {
			if(typeof point != "number") {
				throw new PathError(`Invalid value ${point} in ${this.type} command`)
			}
		}

		this.points = points.map(p => Math.round(p))
	}

	toArray() {
		return this.points.map(p => Math.round(p))
	}

	get typeCode() {
		return Properties.findKey(PathCommands, this.type)
	}

	calculateBounds(points=this.points) {
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
		for(let i = 0; i < points.length; i += 2) {
			const x = points[i]
			const y = points[i + 1]
			if(x < minX) minX = x
			if(y < minY) minY = y
			if(x > maxX) maxX = x
			if(y > maxY) maxY = y
		}
		return [minX, minY, maxX, maxY]
	}

	moveBy(dx, dy) {
		for(let i = 0; i < this.points.length; i += 2) {
			this.points[i] += dx
			this.points[i + 1] += dy
		}
	}
}

class MoveCommand extends Command {
	static commandType = "Move"
	static pointCount = 2

	constructor(x, y) {
		super([x, y])
	}
}

class LineCommand extends Command {
	static commandType = "Line"
	static pointCount = 2

	constructor(x, y) {
		super([x, y])
	}
}

class QuadCommand extends Command {
	static commandType = "Quad"
	static pointCount = 4

	constructor(cx, cy, x, y) {
		super([cx, cy, x, y])
	}
}

class CubicCommand extends Command {
	static commandType = "Cubic"
	static pointCount = 6

	constructor(cx1, cy1, cx2, cy2, x, y) {
		super([cx1, cy1, cx2, cy2, x, y])
	}
}

class ArcCommand extends Command {
	static commandType = "Arc"
	static pointCount = 7

	constructor(rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y) {
		super([rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y])
	}

	calculateBounds() {
		return super.calculateBounds(this.points.slice(5))
	}

	moveBy(dx, dy) {
		this.points[5] += dx
		this.points[6] += dy
	}
}

class CloseCommand extends Command {
	static commandType = "Close"
	static pointCount = 0
}

const classes = [MoveCommand, LineCommand, QuadCommand, CubicCommand, ArcCommand, CloseCommand]
export { MoveCommand, LineCommand, QuadCommand, CubicCommand, ArcCommand, CloseCommand }

export class Path {
	static fromArray(data) {
		const pathMetadata = data[2]
		const pathPoints = data[3]

		const newPath = new Path()
		let pointIndex = 0
		for(let i = 0; i < pathMetadata.length; i += 2) {
			const commandType = pathMetadata[i]
			const pointLength = pathMetadata[i + 1]
			const points = pathPoints.slice(pointIndex, pointIndex + pointLength)
			pointIndex += pointLength

			newPath.addCommands(commandType, points)
		}
		
		return newPath
	}

	static combinedBounds(...paths) {
		let	minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity

		for(const path of paths) {
			const bounds = path.calculateBounds()
			if(bounds.x < minX) minX = bounds.x
			if(bounds.y < minY) minY = bounds.y
			if(bounds.x + bounds.width > maxX) maxX = bounds.x + bounds.width
			if(bounds.y + bounds.height > maxY) maxY = bounds.y + bounds.height
		}

		return {
			x: minX,
			y: minY,
			width: maxX - minX,
			height: maxY - minY
		}
	}
	
	constructor(commands = []) {
		this.commands = []
		for(const command of commands) {
			if(command instanceof Command) {
				this.commands.push(command)
			} else {
				throw new PathError(`Invalid command in path: ${command}`)
			}
		}
	}

	addCommands(commandType, points) {
		commandType = PathCommands[commandType] || commandType
		const commandClass = Command.findClass(commandType) || Command
		const pointCount = commandClass.pointCount ?? 2

		if(pointCount && points.length % pointCount != 0) {
			throw new PathError(`Invalid number of points for ${commandType} command: expected multiple of ${pointCount}, got ${points.length}`)
		}

		for(let i = 0; i < points.length; i += pointCount) {
			const commandPoints = points.slice(i, i + pointCount)
			this.commands.push(new commandClass(...commandPoints))
		}
	}

	get length() {
		return this.commands.length
	}

	moveBy(dx, dy) {
		for(const command of this.commands) {
			command.moveBy(dx, dy)
		}
	}

	calculateBounds() {
		let	minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity

		for(const command of this.commands) {
			const [cMinX, cMinY, cMaxX, cMaxY] = command.calculateBounds()
			if(cMinX < minX) minX = cMinX
			if(cMinY < minY) minY = cMinY
			if(cMaxX > maxX) maxX = cMaxX
			if(cMaxY > maxY) maxY = cMaxY
		}

		return {
			x: minX,
			y: minY,
			width: maxX - minX,
			height: maxY - minY
		}
	}

	toArray() {
		const pathMetadata = []
		const pointsList = []

		let currentCommandType, currentPoints
		const syncCommands = () => {
			if(currentCommandType !== undefined) {
				pathMetadata.push(currentCommandType, currentPoints.length)
				pointsList.push(...currentPoints)
			}
		}
		for(const command of this.commands) {
			const typeCode = command.typeCode
			if(typeCode !== currentCommandType) {
				syncCommands()
				currentCommandType = typeCode
				currentPoints = []
			}
			currentPoints.push(...command.toArray())
		}
		syncCommands()


		return [
			1,
			1,
			pathMetadata,
			pointsList,
			[],
			0
		]
	}
}