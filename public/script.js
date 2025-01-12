const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const brush = document.getElementById('brush');
const bucket = document.getElementById('fill');
const eraser = document.getElementById('eraser');
const eyedrop = document.getElementById('eyedropper');
const trash = document.getElementById('clear');
const saveButton = document.getElementById('export');
const color = document.getElementById('color');
const size = document.getElementById('size');

let mode = 'brush';
let prevX = 0, prevY = 0;

let prevWidth = canvas.width;
let prevHeight = canvas.height;


canvas.addEventListener('mousedown', (e) => startBrush(e));
canvas.addEventListener('mousemove', (e) => moveBrush(e));
canvas.addEventListener('mouseup', () => endBrush());
canvas.addEventListener('mouseout', () => endBrush());

brush.addEventListener('click', () => setColor());
eraser.addEventListener('click', () => erase());
trash.addEventListener('click', () => resetBtn());
saveButton.addEventListener('click', () => saveFile());
size.addEventListener('input', () => setFont());
color.addEventListener('input', () => setColor());

window.addEventListener('resize', () => rescale());


reset();


function startBrush(e) {
    if (mode === 'fill') {
        fill(e);
    } else if (mode === 'brush' || mode === 'eraser') {
        mode = 'brushing';
        [prevX, prevY] = [e.offsetX, e.offsetY];
    } else if (mode === 'eyedropper') {
        dropEye(e);
    }
}

function moveBrush(e) {
    if (!(mode === 'brushing')) return;

    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();

    [prevX, prevY] = [e.offsetX, e.offsetY];
}

function endBrush() {
    if (mode === 'brushing') {
        mode = 'brush';
    }
}

function fill(e) {
    setColor();

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const dpr = window.devicePixelRatio || 1;
    const scaledX = Math.floor(e.offsetX * dpr);
    const scaledY = Math.floor(e.offsetY * dpr);

    const pixel = ctx.getImageData(scaledX, scaledY, 1, 1);
    const [tr, tg, tb] = pixel.data;
    const [fr, fg, fb] = ctx.strokeStyle.replace('#', '').match(/.{2}/g).map(val => parseInt(val, 16));

    if (tr === fr && tg === fg && tb === fb) return;

    const queue = [[scaledX, scaledY]];
    const visited = new Uint8Array(canvas.width * canvas.height);
    const data = imageData.data;

    function matchColor(x, y) {
        const index = (y * canvas.width + x) * 4;
        const dr = Math.abs(data[index] - tr);
        const dg = Math.abs(data[index + 1] - tg);
        const db = Math.abs(data[index + 2] - tb);
        const tolerance = 12;

        return dr <= tolerance && dg <= tolerance && db <= tolerance;
    }

    while (queue.length) {
        const [currentX, currentY] = queue.pop();
        const index = currentY * canvas.width + currentX;

        if (currentX < 0 || currentX >= canvas.width || currentY < 0 || currentY >= canvas.height || visited[index]) continue;
        visited[index] = 1;

        if (matchColor(currentX, currentY)) {
            queue.push([currentX + 1, currentY], [currentX - 1, currentY], [currentX, currentY + 1], [currentX, currentY - 1]);
        }

        const dataIndex = index * 4;
        data[dataIndex] = fr;
        data[dataIndex + 1] = fg;
        data[dataIndex + 2] = fb;
    }

    ctx.putImageData(imageData, 0, 0);
}

function dropEye(e) {
    const dpr = window.devicePixelRatio || 1;
    const scaledX = Math.floor(e.offsetX * dpr);
    const scaledY = Math.floor(e.offsetY * dpr);

    const pixel = ctx.getImageData(scaledX, scaledY, 1, 1);
    const [r,g,b] = pixel.data;

    setColor(c='#' + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase());
}

function selectTool(tool) {
    mode = tool;

    const buttons = document.querySelectorAll('.icon');
    buttons.forEach(button => button.classList.remove('active'));

    const selectedButton = document.getElementById(tool);
    selectedButton.classList.add('active');
}

function erase() {
    ctx.strokeStyle = 'white';
}

function resetBtn() {
    reset();
    ctx.strokeStyle = color.value;
}

function saveFile() {
    const imageURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');

    link.href = imageURL;
    link.download = 'drawing.png';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function setFont() {
    brushSize = size.value;
    ctx.lineWidth = brushSize;
}

function setColor(c=color.value) {
    color.value = c;
    ctx.strokeStyle = c;
    document.getElementById('color-label').style.backgroundColor = c;
}

function rescale() {
    const dpr = window.devicePixelRatio || 1;

    const cssWidth = canvas.offsetWidth;
    const cssHeight = canvas.offsetHeight;

    if (cssWidth !== prevWidth || cssHeight !== prevHeight) {
        imageDataBackup = ctx.getImageData(0, 0, canvas.width, canvas.height);

        canvas.width = cssWidth * dpr;
        canvas.height = cssHeight * dpr;

        ctx.putImageData(imageDataBackup, 0, 0);

        prevWidth = cssWidth;
        prevHeight = cssHeight;
    }

    ctx.scale(dpr, dpr);
}

function reset() {
    rescale();
    setFont();
    setColor();

    ctx.lineCap = 'round';
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "black";
}
