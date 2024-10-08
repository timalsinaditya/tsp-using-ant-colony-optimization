class SeededRandom {
    constructor(seed) {
        this.seed = seed % 2147483647;
        if (this.seed <= 0) this.seed += 2147483646;
    }

    next() {
        return this.seed = this.seed * 16807 % 2147483647;
    }

    random() {
        return (this.next() - 1) / 2147483646;
    }
}

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

let fixedStart = false;
let startNode = 0;
let ACOSolutionTime = 0;

let rng;

function initializeRNG(seed = 12345) {
    rng = new SeededRandom(seed);
}

// function resizeCanvas() {
//     const container = document.querySelector('.canvas-container');
//     const canvas = document.getElementById('tspCanvas');
//     const containerWidth = container.clientWidth - 10; 
//     const containerHeight = container.clientHeight - 10; 
//     canvas.width = containerWidth;
//     canvas.height = containerHeight;

//     if (cities.length > 0) {
//         drawSolution();
//     }
// }

// window.addEventListener('resize', resizeCanvas);

// resizeCanvas();

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
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Tour Length'
                    }
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

function resetChart() {
    chart.data.labels = [];
    chart.data.datasets = [{
        label: 'Best Tour Length',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
    }];
    chart.options.scales.y.title.text = 'Tour Length';
    chart.update();
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
    let start = fixedStart ? startNode : Math.floor(rng.random() * cities.length);
    let tour = [start];
    let unvisited = new Set([...Array(cities.length).keys()]);
    unvisited.delete(start);

    while (unvisited.size > 0) {
        let current = tour[tour.length - 1];
        let probabilities = Array.from(unvisited).map(city => {
            let pheromone = pheromones[current][city] ** alpha;
            let visibility = (1 / distances[current][city]) ** beta;
            return { city, probability: pheromone * visibility };
        });

        let sum = probabilities.reduce((sum, { probability }) => sum + probability, 0);
        let random = rng.random() * sum;
        let selected = probabilities.find(({ probability }) => (random -= probability) <= 0).city;

        tour.push(selected);
        unvisited.delete(selected);
    }

    tour.push(start);
    return tour;
}

async function runACO() {
    const start = performance.now();

    if (cities.length < 2) {
        alert("Please add at least 2 cities before running the algorithm.");
        return;
    }

    resetChart();

    initializeRNG(12345);

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
    const end = performance.now();
    ACOSolutionTime = (end - start) / 1000;
    
    bestTour = globalBestTour;
    bestTourLength = globalBestTourLength;
    drawSolution();
    updateBestTourInfo();
}

async function runConvergenceAnalysis() {
    const parameterSets = [
        { antCount: 10, alpha: 1, beta: 1 },
        { antCount: 20, alpha: 1, beta: 5 },
        { antCount: 30, alpha: 2, beta: 3 },
    ];

    chart.data.datasets = parameterSets.map((params, index) => ({
        label: `Set ${index + 1}: Ants=${params.antCount}, α=${params.alpha}, β=${params.beta}`,
        data: [],
        borderColor: `hsl(${index * 360 / parameterSets.length}, 100%, 50%)`,
        tension: 0.1
    }));

    chart.options.scales.y.title = {
        display: true,
        text: 'Best Tour Length'
    };

    initializeRNG(12345);

    for (let i = 0; i < iterations; i++) {
        for (let j = 0; j < parameterSets.length; j++) {
            const params = parameterSets[j];
            antCount = params.antCount;
            alpha = params.alpha;
            beta = params.beta;

            initializeRNG(12345 + j);
	    
            let tours = Array(antCount).fill().map(antTour);
            updatePheromones(tours);

            let iterationBestTour = tours.reduce((best, tour) =>
                calculateTourLength(tour) < calculateTourLength(best) ? tour : best
            );

            let iterationBestLength = calculateTourLength(iterationBestTour);
            chart.data.datasets[j].data.push(iterationBestLength);
        }

        if (i === 0) {
            chart.data.labels = [1];
        } else {
            chart.data.labels.push(i + 1);
        }

        if (i % 10 === 0) {
            chart.update();
            await new Promise(resolve => setTimeout(resolve, 0)); 
        }
    }

    chart.update();
}

function bruteForceOptimalTour() {
    const n = cities.length;
    let optimalTour = [];
    let optimalLength = Infinity;

    function* permutations(arr, n = arr.length) {
        if (n <= 1) yield arr.slice();
        else for (let i = 0; i < n; i++) {
            yield* permutations(arr, n - 1);
            const j = n % 2 ? 0 : i;
            [arr[n-1], arr[j]] = [arr[j], arr[n-1]];
        }
    }

    let cityIndices = [...Array(n).keys()];
    
    if (fixedStart) {
        cityIndices.splice(startNode, 1);
        
        for (let perm of permutations(cityIndices)) {
            let tour = [startNode, ...perm, startNode];
            let length = calculateTourLength(tour);
            if (length < optimalLength) {
                optimalLength = length;
                optimalTour = tour;
            }
        }
    } else {
        for (let perm of permutations(cityIndices)) {
            let tour = [...perm, perm[0]];
            let length = calculateTourLength(tour);
            if (length < optimalLength) {
                optimalLength = length;
                optimalTour = tour;
            }
        }
    }

    return { tour: optimalTour, length: optimalLength };
}

function validateACOSolution() {
    if (cities.length > 11) {
        alert("Brute force not feasible for no of cities greater than 11.");
        return;
    }

    const start = performance.now();
    const optimal = bruteForceOptimalTour();
    const end = performance.now();

    const executionTime = (end - start) / 1000;
    const difference = bestTourLength - optimal.length;
    const percentDifference = (difference / optimal.length * 100).toFixed(2);

    let validationResult = document.getElementById('validationResult');
    validationResult.innerHTML = `
        <h3>Validation Results</h3>
        <p><span class="label">Optimal Tour:</span> <span class="optimal">${optimal.tour.slice(0, -1).join(' -> ')}</span></p>
        <p><span class="label">Optimal Length:</span> <span class="optimal">${optimal.length.toFixed(2)}</span></p>
        <p><span class="label">ACO Best Tour:</span> <span class="aco">${bestTour.slice(0, -1).join(' -> ')}</span></p>
        <p><span class="label">ACO Best Length:</span> <span class="aco">${bestTourLength.toFixed(2)}</span></p>
        <p><span class="label">Difference:</span> <span class="difference">${difference.toFixed(2)} (${percentDifference}%)</span></p>
        <p class="execution-time"><span class="label">Brute Force Execution Time:</span> ${executionTime.toFixed(2)} seconds</p>
        <p class="execution-time"><span class="label">ACO Execution Time:</span> ${ACOSolutionTime.toFixed(2)} seconds</p>
    `;
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
    const scaleX = canvas.width / rect.width;   
    const scaleY = canvas.height / rect.height;  

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const minDistance = 10;
    const isTooClose = cities.some(city => distance(city, { x, y }) < minDistance);

    if (!isTooClose) {
        cities.push({ x, y });
        distances = cities.map(a => cities.map(b => distance(a, b)));
        drawSolution();
    } else {
        alert("City is too close to an existing city. Please choose a different location.");
    }
});


function updateUIElements() {
    document.getElementById('antCountValue').textContent = antCount;
    document.getElementById('alphaValue').textContent = alpha.toFixed(2);
    document.getElementById('betaValue').textContent = beta.toFixed(2);
    document.getElementById('evaporationRateValue').textContent = evaporationRate.toFixed(2);
    document.getElementById('QValue').textContent = Q.toFixed(2);
    document.getElementById('iterationsValue').textContent = iterations;
    document.getElementById('antCount').value = antCount;
    document.getElementById('alpha').value = alpha;
    document.getElementById('beta').value = beta;
    document.getElementById('evaporationRate').value = evaporationRate;
    document.getElementById('Q').value = Q;
    document.getElementById('iterations').value = iterations;
    document.getElementById('fixedStart').checked = fixedStart;
    document.getElementById('startNode').disabled = !fixedStart;
    document.getElementById('startNode').value = startNode;
}

document.getElementById('antCount').addEventListener('input', (e) => {
    antCount = parseInt(e.target.value);
    updateUIElements();
});
document.getElementById('alpha').addEventListener('input', (e) => {
    alpha = parseFloat(e.target.value);
    updateUIElements();
});
document.getElementById('beta').addEventListener('input', (e) => {
    beta = parseFloat(e.target.value);
    updateUIElements();
});
document.getElementById('evaporationRate').addEventListener('input', (e) => {
    evaporationRate = parseFloat(e.target.value);
    updateUIElements();
});
document.getElementById('Q').addEventListener('input', (e) => {
    Q = parseFloat(e.target.value);
    updateUIElements();
});
document.getElementById('iterations').addEventListener('input', (e) => {
    iterations = parseInt(e.target.value);
    updateUIElements();
});
document.getElementById('fixedStart').addEventListener('change', (e) => {
    fixedStart = e.target.checked;
    updateUIElements();
});
document.getElementById('startNode').addEventListener('input', (e) => {
    startNode = parseInt(e.target.value);
    if (startNode >= cities.length) {
        startNode = cities.length - 1;
    }
    updateUIElements();
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
    resetChart();
    //resizeCanvas();
    updateBestTourInfo();
    updateUIElements();
    document.getElementById('validationResult').innerHTML = '';
});
document.getElementById('runConvergence').addEventListener('click', runConvergenceAnalysis);
document.getElementById('validateSolution').addEventListener('click', validateACOSolution);

initChart();
updateUIElements();
