import React, { useEffect, useState } from 'react';

function App() {
    const [schedules, setSchedules] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('Fetching data from server...');
                const res = await fetch('http://localhost:5000/api/schedules');
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const data = await res.json();
                console.log('Fetched data:', data); // Debugging log
                setSchedules(data);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError(error.message);
            }
        };
        fetchData();
    }, []);

    return (
        <div>
            {error ? (
                <p>Error: {error}</p>
            ) : schedules.length > 0 ? (
                schedules.map(schedule => (
                    <div key={schedule._id}>
                        <h1>{schedule.shiftName}</h1>
                        <p>{schedule.startTime} - {schedule.endTime}</p>
                        <p>{schedule.days.join(', ')}</p>
                    </div>
                ))
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
}

export default App;