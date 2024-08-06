const canvas = document.getElementById('tspCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 400;
const width = canvas.width;
const height = canvas.height;
const canvasContainer = document.querySelector('.canvas-container');

let cities = [];
let distances = [];
let pheromones = [];
let bestTour = [];
let bestTourLength = Infinity;
let globalBestTour = [];
let globalBestTourLength = Infinity;

let antCount = 20;
let alpha = 1;
let beta = 5;
let evaporationRate = 0.1;
let Q = 1;
let iterations = 100;

let iterationData = [];
let chart;

function resizeCanvas() {
    const containerWidth = canvasContainer.clientWidth - 10; 
    const containerHeight = canvasContainer.clientHeight - 10; 
    
    const aspectRatio = 3 / 2;
    
    let canvasWidth, canvasHeight;
    
    if (containerWidth / containerHeight > aspectRatio) {
        canvasHeight = containerHeight;
        canvasWidth = canvasHeight * aspectRatio;
    } else {
        canvasWidth = containerWidth;
        canvasHeight = canvasWidth / aspectRatio;
    }
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    
    if (cities.length > 0) {
        drawSolution();
    }
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function initChart() {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Best Tour Length',
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false
                },
                x: {
                    title: {
                        display: true,
                        text: 'Iterations'
                    }
                }
            }
        }
    });
}

function updateChart() {
    chart.data.labels = iterationData.map((_, index) => index + 1);
    chart.data.datasets[0].data = iterationData;

    const maxIterations = Math.max(iterations, chart.data.labels.length);
    chart.options.scales.x.max = maxIterations;

    chart.update();
}

function distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function initializePheromones() {
    pheromones = Array(cities.length).fill().map(() => Array(cities.length).fill(1));
}

function updatePheromones(tours) {
    for (let i = 0; i < cities.length; i++) {
        for (let j = 0; j < cities.length; j++) {
            pheromones[i][j] *= (1 - evaporationRate);
            pheromones[i][j] = Math.max(pheromones[i][j], 0.1);
        }
    }

    for (let tour of tours) {
        let tourLength = calculateTourLength(tour);
        for (let i = 0; i < tour.length - 1; i++) {
            let from = tour[i];
            let to = tour[i + 1];
            let deltaPheromone = Q / tourLength;
            pheromones[from][to] += deltaPheromone;
            pheromones[to][from] += deltaPheromone;
        }
    }

    if (globalBestTour.length > 0) {
        let deltaPheromone = Q / globalBestTourLength;
        for (let i = 0; i < globalBestTour.length - 1; i++) {
            let from = globalBestTour[i];
            let to = globalBestTour[i + 1];
            pheromones[from][to] += deltaPheromone * 2;
            pheromones[to][from] += deltaPheromone * 2;
        }
    }
}

function calculateTourLength(tour) {
    let length = 0;
    for (let i = 0; i < tour.length - 1; i++) {
        length += distances[tour[i]][tour[i + 1]];
    }
    length += distances[tour[tour.length - 1]][tour[0]];
    return length;
}

function antTour() {
    let tour = [Math.floor(Math.random() * cities.length)];
    let unvisited = new Set([...Array(cities.length).keys()]);
    unvisited.delete(tour[0]);

    while (unvisited.size > 0) {
        let current = tour[tour.length - 1];
        let probabilities = Array.from(unvisited).map(city => {
            let pheromone = pheromones[current][city] ** alpha;
            let visibility = (1 / distances[current][city]) ** beta;
            return { city, probability: pheromone * visibility };
        });

        let sum = probabilities.reduce((sum, { probability }) => sum + probability, 0);
        let random = Math.random() * sum;
        let selected = probabilities.find(({ probability }) => (random -= probability) <= 0).city;

        tour.push(selected);
        unvisited.delete(selected);
    }

    tour.push(tour[0]);
    return tour;
}

async function runACO() {
    if (cities.length < 2) {
        alert("Please add at least 2 cities before running the algorithm.");
        return;
    }

    initializePheromones();
    globalBestTour = [];
    globalBestTourLength = Infinity;
    iterationData = [];

    for (let i = 0; i < iterations; i++) {
        let tours = Array(antCount).fill().map(antTour);
        updatePheromones(tours);

        let iterationBestTour = tours.reduce((best, tour) => 
            calculateTourLength(tour) < calculateTourLength(best) ? tour : best
        );

        let iterationBestLength = calculateTourLength(iterationBestTour);
        if (iterationBestLength < globalBestTourLength) {
            globalBestTour = iterationBestTour;
            globalBestTourLength = iterationBestLength;
        }

        iterationData.push(globalBestTourLength);
        updateChart();

        if (i % 10 === 0) {
            bestTour = globalBestTour;
            bestTourLength = globalBestTourLength;
            drawSolution();
            updateBestTourInfo();
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    bestTour = globalBestTour;
    bestTourLength = globalBestTourLength;
    drawSolution();
    updateBestTourInfo();
}

function drawSolution() {
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = 'black';
    cities.forEach((city, index) => {
        ctx.beginPath();
        ctx.arc(city.x, city.y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillText(index, city.x + 10, city.y + 10);
    });

    if (bestTour.length > 0) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cities[bestTour[0]].x, cities[bestTour[0]].y);
        for (let i = 1; i < bestTour.length; i++) {
            ctx.lineTo(cities[bestTour[i]].x, cities[bestTour[i]].y);
        }
        ctx.stroke();
    }
}

function updateBestTourInfo() {
    document.getElementById('bestTourLength').textContent = `Best Tour Length: ${bestTourLength.toFixed(2)}`;
    document.getElementById('bestTourPath').textContent = `Best Tour: ${bestTour.slice(0, -1).join(' -> ')}`;
}

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const minDistance = 20;
    const isTooClose = cities.some(city => distance(city, {x, y}) < minDistance);
    
    if (!isTooClose) {
        cities.push({ x, y });
        distances = cities.map(a => cities.map(b => distance(a, b)));
        drawSolution();
    } else {
        alert("City is too close to an existing city. Please choose a different location.");
    }
});

document.getElementById('runACO').addEventListener('click', runACO);

document.getElementById('clearCities').addEventListener('click', () => {
    cities = [];
    distances = [];
    bestTour = [];
    bestTourLength = Infinity;
    globalBestTour = [];
    globalBestTourLength = Infinity;
    ctx.clearRect(0, 0, width, height);
    chart.data.labels = [];
    chart.data.datasets[0].data = [];
    chart.update();
    updateBestTourInfo();
});

document.getElementById('antCount').addEventListener('input', (e) => {
    antCount = parseInt(e.target.value);
    document.getElementById('antCountValue').textContent = antCount;
});
document.getElementById('alpha').addEventListener('input', (e) => {
    alpha = parseFloat(e.target.value);
    document.getElementById('alphaValue').textContent = alpha.toFixed(2);
});
document.getElementById('beta').addEventListener('input', (e) => {
    beta = parseFloat(e.target.value);
    document.getElementById('betaValue').textContent = beta.toFixed(2);
});
document.getElementById('evaporationRate').addEventListener('input', (e) => {
    evaporationRate = parseFloat(e.target.value);
    document.getElementById('evaporationRateValue').textContent = evaporationRate.toFixed(2);
});
document.getElementById('Q').addEventListener('input', (e) => {
    Q = parseFloat(e.target.value);
    document.getElementById('QValue').textContent = Q.toFixed(2);
});
document.getElementById('iterations').addEventListener('input', (e) => {
    iterations = parseInt(e.target.value);
    document.getElementById('iterationsValue').textContent = iterations;
});

initChart();