(() => {
    const config = {
        dotRad: 20,
        sphereRad: 350,
        linkSphereRad: 100,
        bigDotRad: 35,
        mouseSize: 120,
        massFactor: 0.002,
        defColor: `#FA0A1E`,
        smooth: 0.85,
    }
    const TWO_PI = 2 * Math.PI;
    const canvas = document.querySelector(`canvas`);
    const textarea = document.getElementById('textarea');
    const ctx = canvas.getContext(`2d`);
    const colorsDiv = document.getElementById('colors');
    let w, h, mouse, dots, graph;
    let takenDot = null;
    let selectedColor = config.defColor;
    dots = []

    class Dot {
        constructor(index, x = mouse.x, y = mouse.y) {
            this.pos = {x: x + random(-2, +2), y: y + random(-2, +2)}
            this.vel = {x: 0, y: 0}
            this.rad = config.dotRad
            this.mass = this.rad * config.massFactor;
            this.color = config.defColor;
            this.number = index
            this.isHovered = false
        }

        static number = 0

        draw(x, y) {
            this.pos.x = x || this.pos.x + this.vel.x;
            this.pos.y = y || this.pos.y + this.vel.y;

            createCircle(this.pos.x, this.pos.y, this.rad, true, this.color + (this.isHovered ? '90' : 'B0'));
            createCircle(this.pos.x, this.pos.y, this.rad, false, this.color);
            ctx.fillStyle = "#FFF";
            ctx.font = "bold 20px Arial";
            ctx.fillText(this.number + 1, this.pos.x - (this.rad / 2) + 3, this.pos.y + (this.rad / 2) - 2);
        }
    }

    class Graph {
        constructor(matrix) {
            this.tryGraph(matrix)
            this.updateTextArea()
        }

        tryGraph(strMatrix) {
            const {matrix, size} = Graph.strToMatrix(strMatrix)
            if (!Graph.isValid(matrix, size)) return
            this.matrix = matrix
            this.size = size
            dots = []
            for (let i = 0; i < this.size; i++) {
                dots.push(new Dot(i, w / 2, h / 2))
            }
            this.isSuspended = this.getIsSuspended()
            console.log(this.matrix);
        }

        getIsSuspended() {
            return !this.matrix.every(row => row.every(el => el === 0 || el === 1))
        }

        addDot() {
            dots.push(new Dot(dots.length))
            dots[dots.length - 1].color = selectedColor
            this.size++
            this.matrix.forEach(row => row.push(0))
            this.matrix.push(new Array(this.size).fill(0))
            this.updateTextArea()
        }

        addLink(from, to) {
            this.matrix[from][to] = 1
        }


        updateTextArea() {
            textarea.value = Graph.matrixToStr(this.matrix)
            autoResizeOfTextArea()
        }

        static matrixToStr(table) {
            return table.map(row => row.join(' ')).join('\n')
        }

        static isValid(matrix, size) {
            return matrix.length === size && matrix.every(row => row.length === size);
        }

        static strToMatrix(str) {
            let matrix = str
                .replace(/^\s+|\s+$/g, '')
                .split(`\n`)
                .map(row => row.split(` `).map(x => +x));
            let size, table
            if (Graph.isMatrix(matrix)) {
                size = matrix.length;
            } else {
                matrix = matrix.map(row => row.map(x => x-1))
                console.log(matrix);
                matrix = Graph.getMatrixFromTable(matrix);
                size = matrix.length
            }
            return {matrix, size}
        }

        static isMatrix(matrix) {
            return matrix.every((row, id) => row.length && row.length === matrix.length && row[id] === 0);
        }


        static getMatrixFromTable(table) {
            const convertedTable = [];
            table.forEach((row) => {
                convertedTable[row[0]] = row.slice(1)
            });
            const size = convertedTable.reduce((acc, row) => Math.max(acc, ...row), 0) + 1;
            const matrix = [];
            for (let i = 0; i < size; i++) {
                matrix[i] = [];
                for (let j = 0; j < size; j++) {
                    matrix[i][j] = convertedTable[i]?.includes(j) ? 1 : 0;
                }
            }
            return matrix;
        }
    }

    function updateDots() {
        for (let i = 0; i < dots.length; i++) {
            let acc = {x: 0, y: 0}

            for (let j = 0; j < dots.length; j++) {
                if (i === j) continue;
                let [a, b] = [dots[i], dots[j]];


                let delta = {x: b.pos.x - a.pos.x, y: b.pos.y - a.pos.y}
                let dist = Math.sqrt(delta.x * delta.x + delta.y * delta.y) || 1;

                let linkDistance = config.sphereRad
                if (graph.isSuspended) {
                    if(graph.matrix[i][j] || graph.matrix[j][i]) {
                        const maxWeightInGraph = Math.max(...graph.matrix.flat())
                        const maxWeightInPair = Math.max(graph.matrix[i][j], graph.matrix[j][i])
                        linkDistance = linkDistance / maxWeightInGraph * maxWeightInPair
                    }
                } else {
                    if (graph.matrix[i][j] || graph.matrix[j][i]) {
                        linkDistance -= 100
                    }
                    if (graph.matrix[i][j] && graph.matrix[j][i]) {
                        linkDistance -= 200
                    }
                }

                const force = (dist - linkDistance) / dist * b.mass;
                acc.x += delta.x * force;
                acc.y += delta.y * force;

            }
            if (isMouseHover(dots[i])) {
                dots[i].isHovered = true
                document.body.style.cursor = 'pointer'
            } else {
                dots[i].isHovered = false
                if (!(document.body.style.cursor === 'pointer' && i > 0)) {
                    document.body.style.cursor = 'default'
                }
            }


            if (takenDot === null && mouse.down) {
                takenDot = isMouseHover(dots[i]) && mouse.down ? i : null
            }
            if (i === takenDot) {
                dots[i].pos.x = mouse.x;
                dots[i].pos.y = mouse.y;
            } else {
                dots[i].vel.x = dots[i].vel.x * config.smooth + acc.x * dots[i].mass;
                dots[i].vel.y = dots[i].vel.y * config.smooth + acc.y * dots[i].mass;
            }
        }
        dots.forEach(e => e.draw());
    }

    function isMouseHover(a) {
        let delta = {x: mouse.x - a.pos.x, y: mouse.y - a.pos.y}
        let dist = Math.sqrt(delta.x ** 2 + delta.y ** 2) || 1;
        return dist <= config.dotRad
    }

    function drawArrow(context, color, fromx, fromy, tox, toy, weight) {
        ctx.fillStyle = ctx.strokeStyle = color;
        context.beginPath()
        let headlen = 15; // length of head in pixels
        let dx = tox - fromx;
        let dy = toy - fromy;
        let angle = Math.atan2(dy, dx);
        fromx += Math.cos(angle) * config.dotRad;
        fromy += Math.sin(angle) * config.dotRad;
        tox -= Math.cos(angle) * config.dotRad;
        toy -= Math.sin(angle) * config.dotRad;

        context.moveTo(fromx, fromy);
        context.lineTo(tox, toy);
        context.lineTo(
            tox - headlen * Math.cos(angle - Math.PI / 6),
            toy - headlen * Math.sin(angle - Math.PI / 6)
        )
        context.moveTo(tox, toy);
        context.lineTo(
            tox - headlen * Math.cos(angle + Math.PI / 6),
            toy - headlen * Math.sin(angle + Math.PI / 6)
        )
        context.stroke()
        context.strokeStyle = config.defColor
        context.lineWidth = 2
        context.closePath()
        if(weight){
            context.fillStyle = color
            context.fillText(weight, (fromx + tox) / 2, (fromy + toy) / 2)
            context.fillStyle = '#FFFFFF33'
            context.fillText(weight, (fromx + tox) / 2, (fromy + toy) / 2)
        }
    }

    function drawLinks() {
        graph.matrix.forEach((row, from) => {
            row.forEach((weight, to) => {
                if (!weight) return;
                drawArrow(
                    ctx,
                    dots[from].color,
                    dots[from]?.pos.x,
                    dots[from]?.pos.y,
                    dots[to]?.pos.x,
                    dots[to]?.pos.y,
                    graph.isSuspended && weight
                )
            })
        })

    }

    function createCircle(x, y, rad, fill, color) {
        ctx.fillStyle = ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, TWO_PI);
        ctx.closePath();
        fill ? ctx.fill() : ctx.stroke();
    }

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    function init() {
        w = canvas.width = innerWidth;
        h = canvas.height = innerHeight;
        mouse = {x: w / 2, y: h / 2, down: false, leftDown: false, selectedDot: null}
        dots = []
        graph = new Graph(`
3 1 2
4 5
5 4 2 3 6
6 2 3
`)
    }

    function loop() {
        ctx.clearRect(0, 0, w, h);
        if (mouse.selectedDot !== null && mouse.selectedDot !== findHoveredDot()) {
            drawArrow(
                ctx,
                dots[mouse.selectedDot].color,
                dots[mouse.selectedDot]?.pos.x,
                dots[mouse.selectedDot]?.pos.y,
                mouse.x,
                mouse.y
            )
        }
        drawLinks()
        updateDots();
        window.requestAnimationFrame(loop);
    }

    init();
    loop();

    function setPos({layerX, layerY}) {
        [mouse.x, mouse.y] = [layerX, layerY];
    }

    function isDown(e) {
        e.preventDefault()
        const rightButton = 2
        if (e.button === rightButton) {
            mouse.down = !mouse.down;
            if (!mouse.down) {
                takenDot = null
            }
        } else {
            mouse.leftDown = !mouse.leftDown;
            const hoveredDot = findHoveredDot()
            if (!mouse.leftDown) {

                if (
                    hoveredDot !== null
                    && mouse.selectedDot !== hoveredDot
                ) {
                    if(graph.matrix[mouse.selectedDot][hoveredDot]){
                        if(graph.isSuspended){
                            graph.matrix[mouse.selectedDot][hoveredDot] = +prompt('Введите вес связи', graph.matrix[mouse.selectedDot][hoveredDot])
                        }else{
                            graph.matrix[mouse.selectedDot][hoveredDot] = 0
                        }
                    }else{
                        graph.addLink(mouse.selectedDot, hoveredDot)
                        graph.updateTextArea()
                    }
                }
                if (mouse.selectedDot === hoveredDot) {
                    dots[hoveredDot].color = selectedColor;
                }
                mouse.selectedDot = null
            } else {
                if (hoveredDot !== null) {
                    mouse.selectedDot = hoveredDot
                } else {
                    graph.addDot()
                    mouse.selectedDot = graph.size - 1
                }
            }
        }
    }

    function findHoveredDot() {
        let idOfDot = null
        dots.forEach((dot, id) => {
            if (isMouseHover(dot)) {
                idOfDot = id
            }
        })
        return idOfDot
    }

    function autoResizeOfTextArea() {
        textarea.style.height = "5px";
        textarea.style.width = "5px";
        textarea.style.height = (textarea.scrollHeight) + "px";
        textarea.style.width = (textarea.scrollWidth) + "px";
    }

    window.addEventListener(`mousemove`, setPos);
    canvas.addEventListener(`mousedown`, isDown);
    window.addEventListener(`contextmenu`, e => e.preventDefault());
    canvas.addEventListener(`mouseup`, isDown);
    textarea.addEventListener(`input`, e => {
        graph.tryGraph(e.target.value)
        autoResizeOfTextArea()
    })
    let colorsDivs = Array.from(colorsDiv.children)
    colorsDivs[0].classList.add('selected')
    colorsDivs.forEach(el => {
        el.style.backgroundColor = el.dataset.color + '80'
        el.style.borderColor = el.dataset.color
        el.addEventListener(`click`, () => {
            selectedColor = el.dataset.color
            colorsDivs.forEach(el => el.classList.remove('selected'))
            el.classList.add('selected')
        })
    })

})();
//https://docs.pyscript.net/latest/howtos/passing-objects.html