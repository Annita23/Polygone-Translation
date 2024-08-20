const tool = document.getElementById('tool');
const canvas = document.getElementById('board');
const context = canvas.getContext('2d');
const offsetX = canvas.offsetLeft;
const offsetY = canvas.offsetTop;

canvas.width = window.innerWidth - offsetX;
canvas.height = window.innerHeight - offsetY;

class Polygone {
    constructor(context, pencilSize = 6) {
        this.context = context;
        this.pencilSize = pencilSize;
        this.points = [];
        this.polygonDrawn = false;
        this.posX = 0;
        this.posY = 0;
        this.mouseIsDown = false;
        this.vector = {posX: 0, posY: 0};
        this.save = null;
    }

    isValidPoint(p1, p2, p3)
    {
        const determinant = (p2.posX - p1.posX) * (p3.posY - p2.posY) - (p2.posY - p1.posY) * (p3.posX - p2.posX);

        if (determinant < 0) {
            console.log("Le point est concave")
            return 0;
        }
        console.log("Le point est convexe")
        return 1;
    }

    checkLastPoint(p1, p2)
    {
        const dx = p1.posX - p2.posX;
        const dy = p1.posY - p2.posY;

        return (dx * dx + dy * dy) < (10 * 10);
    };

    draw()
    {
        if (this.points.length < 2 || this.polygonDrawn)
            return;

        this.context.lineCap = 'round';
        this.context.lineWidth = this.pencilSize;
        if (this.points.length > 2) {
            if (!this.isValidPoint(this.points[this.points.length - 3], this.points[this.points.length - 2],
                this.points[this.points.length - 1]))
                this.points.pop();
        }
        this.context.beginPath();
        for (let point of this.points)
            this.context.lineTo(point.posX, point.posY)
        if (this.points.length > 2 && this.checkLastPoint(this.points[0], this.points[this.points.length - 1])) {
            this.context.closePath();
            this.polygonDrawn = true;
        }
        this.context.stroke();
    }

    isPointInPolygon()
    {
        let inPolygon = false;
        let j = this.points.length - 1;

        for (let i = 0; i < this.points.length; i++) {
            let xi = this.points[i].posX;
            let yi = this.points[i].posY;
            let xj = this.points[j].posX;
            let yj = this.points[j].posY;

            if ((yi > this.posY) !== (yj > this.posY)) {
                let intersection = (xj - xi) * (this.posY - yi) / (yj - yi) + xi;
                if (this.posX < intersection)
                    inPolygon = !inPolygon;
            }
            j = i;
        }
        return inPolygon;
    }

    vectorDrawing(currentX, currentY)
    {
        this.context.beginPath();
        this.context.moveTo(this.vector.posX, this.vector.posY);
        this.context.lineTo(currentX, currentY);
        this.context.strokeStyle = 'green';
        this.context.lineWidth = this.pencilSize;
        this.context.stroke();
        this.context.closePath();
    }

    translationFunction(deltaX, deltaY, allPoints)
    {
        this.context.beginPath();
        for (let point of this.points) {
            this.context.lineTo((point.posX + deltaX), (point.posY + deltaY));
            allPoints.push({posX: point.posX + deltaX, posY: point.posY + deltaY});
        }
        this.context.strokeStyle = 'black';
        this.context.closePath();
        this.context.stroke();
    }

    startPoint(pts)
    {
        let min = pts[0];

        for (let point of pts) {
            if (point.posX < min.posX || (point.posX === min.posX && point.posY < min.posY))
                min = point;
        }
        return min;
    }

    polarAngle(p0, p1)
    {
        return Math.atan2(p1.posY - p0.posY, p1.posX - p0.posX);
    }

    determinant(o, a, b)
    {
        return (a.posX - o.posX) * (b.posY - o.posY) - (a.posY - o.posY) * (b.posX - o.posX);
    }

    convexHull(allPoints)
    {
        let start = this.startPoint(allPoints);
        allPoints.sort((a, b) => this.polarAngle(start, a) - this.polarAngle(start, b));
        let hull = [start];

        this.context.beginPath();
        for (let point of allPoints) {
            while (hull.length > 1 && this.determinant(hull[hull.length - 2], hull[hull.length - 1], point) <= 0)
                hull.pop();
            hull.push(point);
        }

        for (let elt of hull)
            this.context.lineTo(elt.posX, elt.posY);
        this.context.strokeStyle = 'red';
        this.context.closePath();
        this.context.stroke();
    }
}

const polygone = new Polygone(context);

tool.addEventListener('click', (ev) =>
    {
        if (ev.target.id === 'clear') {
            polygone.context.clearRect(0, 0, canvas.width, canvas.height);
            polygone.save = null;
            polygone.context.strokeStyle = 'black';
            polygone.mouseIsDown = false;
            polygone.polygonDrawn = false;
            polygone.points = [];
            polygone.vector = {posX: 0, posY: 0};
        }
    }
);

canvas.addEventListener('mousedown', (ev) =>
    {
        polygone.posX = ev.clientX - offsetX;
        polygone.posY = ev.clientY - offsetY;
        if (!polygone.polygonDrawn)
            polygone.points.push({posX: polygone.posX, posY: polygone.posY});
        polygone.draw();
        if (polygone.polygonDrawn) {
            polygone.save = polygone.context.getImageData(0, 0, canvas.width, canvas.height);
            polygone.vector.posX = polygone.posX;
            polygone.vector.posY = polygone.posY;
            polygone.mouseIsDown = true;
        }
    }
);

canvas.addEventListener('mouseup', () =>
    {
        polygone.mouseIsDown = false;
        if (polygone.save)
            polygone.context.putImageData(polygone.save, 0, 0);
    }
);

canvas.addEventListener('mousemove', (ev) =>
    {
        if (!polygone.mouseIsDown)
            return;

        let currentX = ev.clientX - offsetX;
        let currentY = ev.clientY - offsetY;
        const deltaX = currentX - polygone.vector.posX;
        const deltaY = currentY - polygone.vector.posY;
        let allPoints = polygone.points.slice();

        polygone.context.putImageData(polygone.save, 0, 0);

        if (polygone.isPointInPolygon()) {
            polygone.vectorDrawing(currentX, currentY);
            polygone.translationFunction(deltaX, deltaY, allPoints);
            polygone.convexHull(allPoints);
        }
    }
);
