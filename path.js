export class Path {
	static fromArray(data) {
		const pathMetadata = data[2]
		const pointsList = data[3]
		const closedPath = pathMetadata[4] == 5

		const points = []
		for(let i = 0; i < pointsList.length; i += 2) {
			points.push({x: pointsList[i], y: pointsList[i + 1]})
		}
		
		return new Path(points, closedPath)
	}
	
	constructor(points, closed=false) {
		this.points = points
		this.closed = closed
	}

	get length() {
		return this.points.length
	}

	toArray() {
		const metaLength = (this.length - 1) * 2
		const pathMetadata = [0, 2, 1, metaLength]
		if(this.closed) pathMetadata.push(5, 0)

		const pointsList = []
		for(const point of this.points) {
			pointsList.push(point.x, point.y)
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