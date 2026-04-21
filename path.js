class Point {
	constructor(x, y) {
		this.x = x
		this.y = y
	}

	toArray() {
		return [this.x, this.y]
	}
}

export class Path {
	static fromPoints(pointsList) {
		const points = []
		for(let i = 0; i < pointsList.length; i += 2) {
			points.push(new Point(pointsList[i], pointsList[i + 1]))
		}

		return new Path(points)
	}

	static fromArray(data) {
		const pathMetadata = data[2]
		const pointsList = data[3]
		const closedPath = pathMetadata[4] == 5

		const newPath = Path.fromPoints(pointsList)
		newPath.closed = closedPath
		
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
	
	constructor(points, closed=false) {
		this.points = points
		this.closed = closed
	}

	get length() {
		return this.points.length
	}

	moveBy(dx, dy) {
		for(const point of this.points) {
			point.x += dx
			point.y += dy
		}
	}

	calculateBounds() {
		let	minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity

		for(const point of this.points) {
			if(point.x < minX) minX = point.x
			if(point.y < minY) minY = point.y
			if(point.x > maxX) maxX = point.x
			if(point.y > maxY) maxY = point.y
		}

		return {
			x: minX,
			y: minY,
			width: maxX - minX,
			height: maxY - minY
		}
	}

	toArray() {
		const metaLength = (this.length - 1) * 2
		const pathMetadata = [
			0,
			2,
			this.pathType ?? 1,
			metaLength
		]
		if(this.closed) pathMetadata.push(5, 0)

		const pointsList = []
		for(const point of this.points) {
			pointsList.push(...point.toArray())
		}

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