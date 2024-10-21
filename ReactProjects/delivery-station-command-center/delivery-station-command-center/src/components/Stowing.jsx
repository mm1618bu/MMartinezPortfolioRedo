import React, { useState, useEffect } from "react";

const Stowing = () => {
    const [arrivedPackages, setArrivedPackages] = useState(Array(5).fill(0));
    const [stowedPackages, setStowedPackages] = useState(Array(5).fill(0));

    useEffect(() => {
        const arrivalInterval = setInterval(() => {
            setArrivedPackages(prevArrivedPackages => 
                prevArrivedPackages.map(packages => packages + Math.floor(Math.random() * 10) + 1)
            );
        }, 1000); // 1 second interval

        const stowInterval = setInterval(() => {
            setStowedPackages(prevStowedPackages => 
                prevStowedPackages.map((packages, index) => 
                    packages < arrivedPackages[index] ? packages + 1 : packages
                )
            );
        }, 8000); // 8 second interval

        return () => {
            clearInterval(arrivalInterval);
            clearInterval(stowInterval);
        };
    }, [arrivedPackages, stowedPackages]);

    return (
        <div>
            <h1>Stowing</h1>
            <table>
                <thead>
                    <tr>
                        <th>Row</th>
                        <th>Arrived Packages</th>
                        <th>Stowed Packages</th>
                    </tr>
                </thead>
                <tbody>
                    {arrivedPackages.map((packages, index) => (
                        <tr key={index}>
                            <td>Row {index + 1}</td>
                            <td>{packages}</td>
                            <td>{stowedPackages[index]}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Stowing;