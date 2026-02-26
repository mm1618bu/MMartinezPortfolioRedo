import react from 'react';
import '../design/main.css';
import { handleDropdownKeyboard, generateId } from '../a11yUtils';

// Custom Dropdown Component - NFR-4.1: Keyboard accessible
function CustomDropdown({ label, options, value, onChange, labelId }) {
    const [isOpen, setIsOpen] = react.useState(false);
    const [focusedIndex, setFocusedIndex] = react.useState(0);
    const dropdownRef = react.useRef(null);
    const selectedIndex = options.findIndex(opt => (opt.display || opt.value) === value);

    react.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // NFR-4.1: Handle keyboard navigation
    const handleKeyDown = (event) => {
        handleDropdownKeyboard(
            event,
            () => setIsOpen(true),
            () => setIsOpen(false),
            (index) => {
                setFocusedIndex(index);
                onChange(options[index].display || options[index].value);
            },
            focusedIndex,
            options.length,
            isOpen
        );
    };

    return (
        <div className="custom-dropdown" ref={dropdownRef}>
            <div 
                className="dropdown-header" 
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                role="button"
                tabIndex="0"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-labelledby={labelId}
                aria-label={`${label}. Current selection: ${value || `Select ${label}`}`}
            >
                <span>{value || `Select ${label}`}</span>
                <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
            </div>
            {isOpen && (
                <div 
                    className={`dropdown-menu ${isOpen ? 'show' : ''}`}
                    role="listbox"
                    aria-label={label}
                >
                    {options.map((option, index) => (
                        <div
                            key={option.value}
                            className={`dropdown-item ${focusedIndex === index ? 'focused' : ''}`}
                            onClick={() => {
                                onChange(option.display || option.value);
                                setIsOpen(false);
                            }}
                            onKeyDown={handleKeyDown}
                            role="option"
                            aria-selected={focusedIndex === index}
                            tabIndex={focusedIndex === index ? 0 : -1}
                            onMouseEnter={() => setFocusedIndex(index)}
                        >
                            {option.display || option.value}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CreateTrip({ tripInfo, setTripInfo, onTripCreated }) {
    const [selectedJourney, setSelectedJourney] = react.useState('outbound');
    
    const handleSubmit = (e) => {
        e.preventDefault();
        // Navigate to TripChoices page
        if (onTripCreated) {
            onTripCreated();
        }
    }

    const updateTravelDetails = (journey, mode, field, value) => {
        setTripInfo({
            ...tripInfo,
            travelDetails: {
                ...tripInfo.travelDetails,
                [journey]: {
                    ...tripInfo.travelDetails[journey],
                    [mode]: {
                        ...tripInfo.travelDetails[journey][mode],
                        [field]: value
                    }
                }
            }
        });
    };

    const travelersOptions = [
        { value: '1' },
        { value: '2' },
        { value: '3' },
        { value: '4' },
        { value: '5+' }
    ];

    const travelModeOptions = [
        { value: 'car', display: 'Car' },
        { value: 'plane', display: 'Plane' },
        { value: 'train', display: 'Train' },
        { value: 'bus', display: 'Bus' }
    ];

    const accommodationOptions = [
        { value: 'hotel', display: 'Hotel' },
        { value: 'hostel', display: 'Hostel' },
        { value: 'airbnb', display: 'Airbnb' },
        { value: 'none', display: 'None' }
    ];
    
    return (
        <div className="createTripBox">
            <div className="createTrip-header">
                <h1>✈️ Create a New Trip</h1>
                <p className="header-subtitle">Plan your adventure step by step</p>
            </div>
            
            <form onSubmit={handleSubmit}>
                {/* BASIC TRIP DETAILS SECTION */}
                <div className="form-section">
                    <h2 className="section-title">📍 Trip Basics</h2>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label>From</label>
                            <input 
                                type="text" 
                                placeholder="e.g., New York City" 
                                required 
                                value={tripInfo.startPoint} 
                                onChange={(e) => setTripInfo({...tripInfo, startPoint: e.target.value})} 
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>To</label>
                            <input 
                                type="text" 
                                placeholder="e.g., Los Angeles" 
                                required 
                                value={tripInfo.endPoint} 
                                onChange={(e) => setTripInfo({...tripInfo, endPoint: e.target.value})} 
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Departure Date</label>
                            <input 
                                type="date" 
                                required 
                                value={tripInfo.departureDate} 
                                onChange={(e) => setTripInfo({...tripInfo, departureDate: e.target.value})} 
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>Return Date</label>
                            <input 
                                type="date" 
                                required 
                                value={tripInfo.returnDate} 
                                onChange={(e) => setTripInfo({...tripInfo, returnDate: e.target.value})} 
                                className="form-input"
                            />
                        </div>
                    </div>
                </div>

                {/* TRIP DETAILS SECTION */}
                <div className="form-section">
                    <h2 className="section-title">👥 Trip Details</h2>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label>Number of Travelers</label>
                            <CustomDropdown 
                                label="Travelers"
                                options={travelersOptions}
                                value={tripInfo.travelers}
                                onChange={(value) => setTripInfo({...tripInfo, travelers: value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Mode of Travel</label>
                            <CustomDropdown 
                                label="Mode of Travel"
                                options={travelModeOptions}
                                value={tripInfo.modeOfTravel}
                                onChange={(value) => setTripInfo({...tripInfo, modeOfTravel: value})}
                            />
                        </div>
                    </div>
                </div>

                {/* Journey Selection Tabs */}
                {tripInfo.modeOfTravel && (
                    <>
                        <div className="form-section">
                            <h2 className="section-title">🛫 Travel Details</h2>
                            <div className="journey-tabs">
                                <button 
                                    type="button"
                                    className={`journey-tab ${selectedJourney === 'outbound' ? 'active' : ''}`}
                                    onClick={() => setSelectedJourney('outbound')}
                                >
                                    ➜ Outbound Journey
                                </button>
                                <button 
                                    type="button"
                                    className={`journey-tab ${selectedJourney === 'return' ? 'active' : ''}`}
                                    onClick={() => setSelectedJourney('return')}
                                >
                                    ↩️ Return Journey
                                </button>
                            </div>
                        </div>

                {/* Travel Details Section - Plane */}
                {tripInfo.modeOfTravel === 'Plane' && (
                    <div className="travel-details-section">
                        <h3>✈️ Flight Information - {selectedJourney === 'outbound' ? 'To Destination' : 'Returning Home'}</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Airline</label>
                                <input type="text" placeholder="e.g., United Airlines" value={tripInfo.travelDetails[selectedJourney].plane.airline} onChange={(e) => updateTravelDetails(selectedJourney, 'plane', 'airline', e.target.value)} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Flight Number</label>
                                <input type="text" placeholder="e.g., UA123" value={tripInfo.travelDetails[selectedJourney].plane.flightNumber} onChange={(e) => updateTravelDetails(selectedJourney, 'plane', 'flightNumber', e.target.value)} className="form-input" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Departure Time</label>
                                <input type="time" value={tripInfo.travelDetails[selectedJourney].plane.departureTime} onChange={(e) => updateTravelDetails(selectedJourney, 'plane', 'departureTime', e.target.value)} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Arrival Time</label>
                                <input type="time" value={tripInfo.travelDetails[selectedJourney].plane.arrivalTime} onChange={(e) => updateTravelDetails(selectedJourney, 'plane', 'arrivalTime', e.target.value)} className="form-input" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Travel Details Section - Train */}
                {tripInfo.modeOfTravel === 'Train' && (
                    <div className="travel-details-section">
                        <h3>🚂 Train Information - {selectedJourney === 'outbound' ? 'To Destination' : 'Returning Home'}</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Train Number</label>
                                <input type="text" placeholder="e.g., Amtrak 100" value={tripInfo.travelDetails[selectedJourney].train.trainNumber} onChange={(e) => updateTravelDetails(selectedJourney, 'train', 'trainNumber', e.target.value)} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Station</label>
                                <input type="text" placeholder="e.g., Grand Central Station" value={tripInfo.travelDetails[selectedJourney].train.station} onChange={(e) => updateTravelDetails(selectedJourney, 'train', 'station', e.target.value)} className="form-input" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Departure Time</label>
                                <input type="time" value={tripInfo.travelDetails[selectedJourney].train.departureTime} onChange={(e) => updateTravelDetails(selectedJourney, 'train', 'departureTime', e.target.value)} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Arrival Time</label>
                                <input type="time" value={tripInfo.travelDetails[selectedJourney].train.arrivalTime} onChange={(e) => updateTravelDetails(selectedJourney, 'train', 'arrivalTime', e.target.value)} className="form-input" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Travel Details Section - Bus */}
                {tripInfo.modeOfTravel === 'Bus' && (
                    <div className="travel-details-section">
                        <h3>🚌 Bus Information - {selectedJourney === 'outbound' ? 'To Destination' : 'Returning Home'}</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Bus Company</label>
                                <input type="text" placeholder="e.g., Greyhound" value={tripInfo.travelDetails[selectedJourney].bus.company} onChange={(e) => updateTravelDetails(selectedJourney, 'bus', 'company', e.target.value)} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Station</label>
                                <input type="text" placeholder="e.g., Main Bus Terminal" value={tripInfo.travelDetails[selectedJourney].bus.station} onChange={(e) => updateTravelDetails(selectedJourney, 'bus', 'station', e.target.value)} className="form-input" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Departure Time</label>
                                <input type="time" value={tripInfo.travelDetails[selectedJourney].bus.departureTime} onChange={(e) => updateTravelDetails(selectedJourney, 'bus', 'departureTime', e.target.value)} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Arrival Time</label>
                                <input type="time" value={tripInfo.travelDetails[selectedJourney].bus.arrivalTime} onChange={(e) => updateTravelDetails(selectedJourney, 'bus', 'arrivalTime', e.target.value)} className="form-input" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Travel Details Section - Car */}
                {tripInfo.modeOfTravel === 'Car' && (
                    <div className="travel-details-section">
                        <h3>🚗 Car Rental Information - {selectedJourney === 'outbound' ? 'To Destination' : 'Returning Home'}</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Rental Company</label>
                                <input type="text" placeholder="e.g., Hertz, Enterprise" value={tripInfo.travelDetails[selectedJourney].car.rentalCompany} onChange={(e) => updateTravelDetails(selectedJourney, 'car', 'rentalCompany', e.target.value)} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Vehicle Type</label>
                                <input type="text" placeholder="e.g., SUV, Sedan" value={tripInfo.travelDetails[selectedJourney].car.vehicleType} onChange={(e) => updateTravelDetails(selectedJourney, 'car', 'vehicleType', e.target.value)} className="form-input" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Pickup Location</label>
                                <input type="text" placeholder="e.g., Los Angeles Airport" value={tripInfo.travelDetails[selectedJourney].car.pickupLocation} onChange={(e) => updateTravelDetails(selectedJourney, 'car', 'pickupLocation', e.target.value)} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Dropoff Location</label>
                                <input type="text" placeholder="e.g., San Francisco Airport" value={tripInfo.travelDetails[selectedJourney].car.dropoffLocation} onChange={(e) => updateTravelDetails(selectedJourney, 'car', 'dropoffLocation', e.target.value)} className="form-input" />
                            </div>
                        </div>
                    </div>
                )}
                    </>
                )}

                {/* Accommodation Preferences Section */}
                <div className="form-section">
                    <h2 className="section-title">🏨 Accommodation</h2>
                    <div className="form-group">
                        <label>Accommodation Preferences</label>
                        <CustomDropdown 
                            label="Accommodation"
                            options={accommodationOptions}
                            value={tripInfo.accommodation}
                            onChange={(value) => setTripInfo({...tripInfo, accommodation: value})}
                        />
                    </div>
                </div>

                {/* Submit Button Section */}
                <div className="form-section">
                    <button type="submit" className="submit-btn">
                        ✓ Create Trip
                    </button>
                </div>
            </form>
        </div>
    );
}