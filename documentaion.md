# Traveling Salesman Problem Solver using Ant Colony Optimization

## Table of Contents
1. [Introduction](#introduction)
2. [The Traveling Salesman Problem (TSP)](#the-traveling-salesman-problem-tsp)
3. [Ant Colony Optimization (ACO)](#ant-colony-optimization-aco)
4. [Key Parameters and Their Relationships](#key-parameters-and-their-relationships)
5. [Core ACO Functions](#core-aco-functions)
6. [User Interface and Interaction](#user-interface-and-interaction)
7. [Visualization](#visualization)
8. [Advanced Features](#advanced-features)
9. [Conclusion](#conclusion)

## Introduction
This implementation provides a flexible and interactive way to explore the Ant Colony Optimization algorithm for solving the Traveling Salesman Problem. Users can experiment with different parameters, visualize the results, and gain insights into the behavior of the ACO algorithm in the context of TSP.

The combination of an intuitive user interface, real-time visualization, and advanced features like convergence analysis makes this tool valuable for both educational purposes and practical problem-solving.
This document describes an implementation of a Traveling Salesman Problem (TSP) solver using Ant Colony Optimization (ACO). The solver is implemented in JavaScript and provides an interactive web-based interface for users to experiment with the algorithm.

## The Traveling Salesman Problem (TSP)

The Traveling Salesman Problem is a classic optimization problem in computer science and operations research. The problem statement is as follows:

Given a list of cities and the distances between each pair of cities, what is the shortest possible route that visits each city exactly once and returns to the origin city?

In this implementation, cities are represented as points on a 2D plane:

```javascript
let cities = [];
```

The distances between cities are calculated using Euclidean distance:

```javascript
function distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
```

## Ant Colony Optimization (ACO)
Ant Colony Optimization is a probabilistic technique inspired by the behavior of ants finding paths between their colony and food sources. In the context of TSP:

1. Ants construct tours by probabilistically choosing the next city to visit.
2. They deposit pheromones on the paths they traverse.
3. The pheromone levels influence future ants' choices.
4. Over time, shorter paths accumulate more pheromones, becoming more attractive to future ants.

The main ACO loop is implemented in the runACO() function:

```javascript
async function runACO() {
    // ...
    for (let i = 0; i < iterations; i++) {
        let tours = Array(antCount).fill().map(antTour);
        updatePheromones(tours);
        // ...
    }
    // ...
}
```

## Key Parameters

1. **Number of Ants (`antCount`)**
   - **Description:** Represents the number of ants used in each iteration.
   - **Effect:** More ants can explore more solutions but increase computation time.
   - **In the Code:** `let antCount = 20;`

2. **Alpha (α)**
   - **Description:** Controls the importance of pheromone trails.
   - **Effect:** Higher values make ants more likely to follow strong pheromone trails.
   - **In the Code:** `let alpha = 1;`

3. **Beta (β)**
   - **Description:** Controls the importance of distances between cities.
   - **Effect:** Higher values make ants more likely to choose closer cities.
   - **In the Code:** `let beta = 5;`

4. **Evaporation Rate**
   - **Description:** Determines how quickly pheromone trails evaporate.
   - **Effect:** Helps prevent premature convergence to suboptimal solutions.
   - **In the Code:** `let evaporationRate = 0.1;`

5. **Q (Pheromone Deposit Factor)**
   - **Description:** Influences the amount of pheromone deposited by ants.
   - **Effect:** Higher values lead to stronger pheromone trails.
   - **In the Code:** `let Q = 1;`

6. **Number of Iterations**
   - **Description:** Determines how long the algorithm runs.
   - **Effect:** More iterations can lead to better solutions but increase computation time.
   - **In the Code:** `let iterations = 100;`

## Relationships and Trade-offs

- **Alpha vs Beta:**
  - **High α, Low β:** Ants follow strong pheromone trails (exploitation).
  - **Low α, High β:** Ants prefer shorter distances (exploration).

- **Evaporation Rate:**
  - **Higher Rates:** Allow faster adaptation but may lose good solutions.
  - **Lower Rates:** Provide more stable convergence but may get stuck in local optima.

- **Number of Ants vs Iterations:**
  - **More Ants with Fewer Iterations:** Wider exploration per iteration.
  - **Fewer Ants with More Iterations:** Deeper exploration over time.

  These relationships are explored in the runConvergenceAnalysis() function:

```javascript
  async function runConvergenceAnalysis() {
    const parameterSets = [
        { antCount: 10, alpha: 1, beta: 1 },
        { antCount: 20, alpha: 1, beta: 5 },
        { antCount: 30, alpha: 2, beta: 3 },
    ];
    // ...
}
```

## Core ACO Functions

1. **Initializing Pheromones:**

```javascript
function initializePheromones() {
    pheromones = Array(cities.length).fill().map(() => Array(cities.length).fill(1));
}
```

2. **Updating Pheromones:**
```javascript
function updatePheromones(tours) {
    // Evaporation
    for (let i = 0; i < cities.length; i++) {
        for (let j = 0; j < cities.length; j++) {
            pheromones[i][j] *= (1 - evaporationRate);
            pheromones[i][j] = Math.max(pheromones[i][j], 0.1);
        }
    }
    // Deposit
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
    // ...
}
```

3. **Ant Tour Construction:**
```javascript
function antTour() {
    // ...
    while (unvisited.size > 0) {
        let current = tour[tour.length - 1];
        let probabilities = Array.from(unvisited).map(city => {
            let pheromone = pheromones[current][city] ** alpha;
            let visibility = (1 / distances[current][city]) ** beta;
            return { city, probability: pheromone * visibility };
        });
        // ...
    }
    // ...
}
```

## User Interface and Interaction
The implementation provides an interactive web interface where users can:

1. Add cities by clicking on a canvas.
2. Adjust algorithm parameters using sliders and input fields.
3. Run the ACO algorithm to solve the TSP.
4. Clear cities and reset the problem.
5. Run a convergence analysis to compare different parameter sets.

## Visualization

The solver offers two main visualizations:

1. **TSP Map:** A canvas showing the cities and the best tour found.

```javascript
function drawSolution() {
    // ...
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(cities[bestTour[0]].x, cities[bestTour[0]].y);
    for (let i = 1; i < bestTour.length; i++) {
        ctx.lineTo(cities[bestTour[i]].x, cities[bestTour[i]].y);
    }
    ctx.stroke();
    // ...
}
```
2. **Performance Chart:** A line chart showing the improvement of the best tour length over iterations.

```javascript 
function updateChart() {
    chart.data.labels = iterationData.map((_, index) => index + 1);
    chart.data.datasets[0].data = iterationData;
    chart.update();
}
```

## Advanced Features

1. **Fixed Starting Node:** Option to set a fixed starting city for all tours.
```javascript
let fixedStart = false;
let startNode = 0;
```

2. **Convergence Analysis:** Capability to compare different parameter sets.

```javascript
async function runConvergenceAnalysis() {
    // ...
}
```

2. **Seeded Random Number Generation:** Ensures reproducibility of results.

```javascript
class SeededRandom {
    // ...
}
```

## Conclusion
This implementation provides a flexible and interactive way to explore the Ant Colony Optimization algorithm for solving the Traveling Salesman Problem. Users can experiment with different parameters, visualize the results, and gain insights into the behavior of the ACO algorithm in the context of TSP.
The combination of an intuitive user interface, real-time visualization, and advanced features like convergence analysis makes this tool valuable for both educational purposes and practical problem-solving.
