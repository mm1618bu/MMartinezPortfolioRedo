import React from "react";

const getRandomCombos = (locations, numbers, count) => {
    const combos = [];
    while (combos.length < count) {
        const randomLocation = locations[Math.floor(Math.random() * locations.length)];
        const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
        const combo = `${randomLocation}${randomNumber}`;
        if (!combos.includes(combo)) {
            combos.push(combo);
        }
    }
    return combos;
};

const RouteAssembly = () => {
    const aisles = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const aisleNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26];
    const bagLocation = ["A", "B", "C", "D", "E", "G"];
    const bagLocationNumbers = [1, 2, 3, 4];
    const bags = getRandomCombos(bagLocation, bagLocationNumbers, 100);

    return (
        <div>
            <h1>Route Assembly</h1>
            <div>
                {aisles.map((aisle, index) => (
                    <div key={index}>
                        Aisle {aisle}
                        {aisleNumbers.map((number, index) => (
                            <div key={index}>
                                {number}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <div>
                {bags.map((bag, index) => (
                    <div key={index}>
                        {bag}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RouteAssembly;