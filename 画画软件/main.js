console.log('main.js loaded');

const paintSound = new Audio('sounds/cartoon-pop.mp3');
paintSound.volume = 0.5;

const canvas = document.getElementById('drawingCanvas');
if (canvas) {
    canvas.addEventListener('mousedown', function() {
        console.log('mousedown on canvas');
        paintSound.currentTime = 0;
        paintSound.play().then(() => {
            console.log('音效播放成功');
        }).catch(e => {
            console.error('音效播放失败:', e);
        });
    });
} else {
    console.error('canvas not found');
}

const ctx = canvas.getContext('2d');
const brushSize = document.getElementById('brushSize');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
const colorBar = document.getElementById('colorBar');
const brushBar = document.getElementById('brushBar');
const langToggle = document.getElementById('langToggle');
const labelBrush = document.getElementById('label-brush');

// 54色卡颜色
const paletteColors = [
    // 粉色系
    '#FCE6E2', '#F7D5D0', '#E6C0B7', '#F7DEE6', '#FBC7D6', '#F199A6', '#E2B3C7', '#DD918F', '#C86473',
    // 黄色系
    '#F5E9A5', '#F2D58E', '#F8E6BB', '#EEB96B', '#F4C082', '#FEC976', '#FEE466', '#ECD55A', '#F6CB66',
    // 橙色系
    '#F4AA7E', '#F2B891', '#ECA85B', '#F3B33D', '#EEAA97', '#F7B845', '#F17D53', '#E3884B', '#E96A3A',
    // 绿色系
    '#AEB957', '#E2D88A', '#C3E1BF', '#A4C05C', '#E2EA3A', '#BBA228', '#739A08', '#8C8D6E', '#7D8B53',
    // 蓝色系
    '#9ECFC8', '#98C3CA', '#78BCD2', '#6A92A4', '#D7DAE2', '#7F95CC', '#94DAE3', '#95AEC6', '#7CBBE3',
    // 棕色系
    '#D3AD89', '#E2AF84', '#EFDD8F', '#7F5F49', '#B98B5A', '#9B6652', '#AEC663', '#5D2F20', '#CD8249'
];

let currentColor = paletteColors[0];
let currentBrush = 'normal'; // normal, bold, marker, eraser
let currentBrushSize = 5;

// 笔刷类型定义（更明显的手绘/像素SVG+中英文标识）
const brushes = [
    {
        key: 'normal',
        label: '细笔\nThin',
        size: 2,
        svg: `<svg width="32" height="32" viewBox="0 0 32 32"><path d="M6 28L26 6" stroke="#7f5f49" stroke-width="2.5" stroke-linecap="round"/><polygon points="26,6 30,2 28,10" fill="#fbc7d6" stroke="#7f5f49" stroke-width="1.2"/><ellipse cx="6" cy="28" rx="3" ry="2" fill="#fffbe6" stroke="#7f5f49" stroke-width="1.2"/></svg>`
    },
    {
        key: 'bold',
        label: '粗笔\nBold',
        size: 8,
        svg: `<svg width="32" height="32" viewBox="0 0 32 32"><path d="M6 28L26 6" stroke="#7f5f49" stroke-width="6" stroke-linecap="round"/><polygon points="26,6 30,2 28,10" fill="#fbc7d6" stroke="#7f5f49" stroke-width="1.2"/><ellipse cx="6" cy="28" rx="4" ry="2.5" fill="#fffbe6" stroke="#7f5f49" stroke-width="1.2"/></svg>`
    },
    {
        key: 'marker',
        label: '马克笔\nMarker',
        size: 14,
        svg: `<svg width="32" height="32" viewBox="0 0 32 32"><rect x="8" y="24" width="16" height="4" rx="2" fill="#ffe066" stroke="#7f5f49" stroke-width="1.2"/><rect x="14" y="4" width="4" height="20" rx="2" fill="#fbc7d6" stroke="#7f5f49" stroke-width="1.2"/><ellipse cx="16" cy="28" rx="6" ry="2" fill="#fffbe6" stroke="#7f5f49" stroke-width="1.2"/></svg>`
    },
    {
        key: 'eraser',
        label: '橡皮\nEraser',
        size: 18,
        svg: `<svg width="32" height="32" viewBox="0 0 32 32"><rect x="4" y="20" width="14" height="7" rx="2" fill="#fff" stroke="#7f5f49" stroke-width="1.5"/><rect x="18" y="20" width="10" height="7" rx="2" fill="#fbc7d6" stroke="#7f5f49" stroke-width="1.5"/><ellipse cx="9" cy="27" rx="3" ry="1.5" fill="#fffbe6" stroke="#7f5f49" stroke-width="1.2"/></svg>`
    }
];

// 音效资源
const soundDraw = new Audio('sound/draw.mp3');
const soundSelect = new Audio('sound/select.mp3');
const soundEraser = new Audio('sound/eraser.mp3');
soundDraw.volume = 0.25;
soundSelect.volume = 0.4;
soundEraser.volume = 0.3;

function renderBrushBar() {
    brushBar.innerHTML = '';
    brushes.forEach((brush, idx) => {
        const btn = document.createElement('button');
        btn.className = 'brush-btn';
        btn.innerHTML = brush.svg + `<div class='brush-label'>${brush.label.replace(/\\n/g, '<br>')}</div>`;
        btn.title = brush.label.replace(/\\n/g, ' ');
        if (currentBrush === brush.key) btn.classList.add('selected');
        btn.onclick = () => {
            currentBrush = brush.key;
            currentBrushSize = brush.size;
            document.querySelectorAll('.brush-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            if (brush.key === 'eraser') {
                soundEraser.currentTime = 0; soundEraser.play();
            } else {
                soundSelect.currentTime = 0; soundSelect.play();
            }
        };
        brushBar.appendChild(btn);
    });
}
renderBrushBar();

// 动态生成颜色按钮
function renderColorBar() {
    // 保留brushBar在colorBar顶部
    document.querySelectorAll('.color-btn').forEach(e => e.remove());
    paletteColors.forEach((color, idx) => {
        const btn = document.createElement('button');
        btn.className = 'color-btn';
        btn.style.background = color;
        btn.title = color;
        btn.setAttribute('data-color', color);
        if (idx === 0) btn.classList.add('selected');
        btn.onclick = () => {
            currentColor = color;
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            // 切换颜色时自动退出橡皮擦
            if(currentBrush === 'eraser') {
                currentBrush = 'normal';
                currentBrushSize = brushes[0].size;
                renderBrushBar();
            }
            soundSelect.currentTime = 0; soundSelect.play();
        };
        colorBar.appendChild(btn);
    });
}
renderColorBar();

let drawing = false;
let lastX = 0;
let lastY = 0;

function startDraw(e) {
    drawing = true;
    [lastX, lastY] = getPos(e);
}

function endDraw() {
    drawing = false;
}

function draw(e) {
    if (!drawing) return;
    const [x, y] = getPos(e);
    if(currentBrush === 'eraser') {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = brushes.find(b => b.key === 'eraser').size;
    } else {
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentBrushSize;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    [lastX, lastY] = [x, y];
    // 播放画画音效
    if (drawing) {
        soundDraw.currentTime = 0;
        soundDraw.play();
    }
}

function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
        return [
            e.touches[0].clientX - rect.left,
            e.touches[0].clientY - rect.top
        ];
    } else {
        return [
            e.clientX - rect.left,
            e.clientY - rect.top
        ];
    }
}

canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('touchstart', startDraw);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('mouseup', endDraw);
canvas.addEventListener('mouseleave', endDraw);
canvas.addEventListener('touchend', endDraw);

clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

saveBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'my_drawing.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});

const cover = document.getElementById('cover');
const beginBtn = document.getElementById('beginBtn');
if (beginBtn) {
    beginBtn.onclick = function() {
        cover.style.display = 'none';
    };
} 