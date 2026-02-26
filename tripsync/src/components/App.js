import React from 'react';
import '../design/main.css';
import CreateTrip from './CreateTrip';
import TripChoices from './TripChoices';
import TripDashboard from './TripDashboard';
import Login from './login';
import Register from './register';
import ForgotPassword from './forgotPassword';
import { supabase } from '../supabaseClient';
import {
  createTrip,
  duplicateTripAsTemplate,
  getUserTrips,
  joinTripByToken,
  updateTripStatus,
} from '../tripService';

function App() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [authView, setAuthView] = React.useState('login'); // 'login', 'register', 'forgotPassword'
  const [viewMode, setViewMode] = React.useState('dashboard');
  const [currentTripId, setCurrentTripId] = React.useState(null);
  const [trips, setTrips] = React.useState([]);

  const buildDefaultTravelDetails = () => ({
    outbound: {
      plane: {
        airline: '',
        flightNumber: '',
        departureTime: '',
        arrivalTime: ''
      },
      train: {
        trainNumber: '',
        departureTime: '',
        arrivalTime: '',
        station: ''
      },
      bus: {
        company: '',
        departureTime: '',
        arrivalTime: '',
        station: ''
      },
      car: {
        rentalCompany: '',
        vehicleType: '',
        pickupLocation: '',
        dropoffLocation: ''
      }
    },
    return: {
      plane: {
        airline: '',
        flightNumber: '',
        departureTime: '',
        arrivalTime: ''
      },
      train: {
        trainNumber: '',
        departureTime: '',
        arrivalTime: '',
        station: ''
      },
      bus: {
        company: '',
        departureTime: '',
        arrivalTime: '',
        station: ''
      },
      car: {
        rentalCompany: '',
        vehicleType: '',
        pickupLocation: '',
        dropoffLocation: ''
      }
    }
  });

  const buildTripInfo = (trip = {}) => ({
    startPoint: trip.start_point || '',
    endPoint: trip.end_point || '',
    departureDate: trip.departure_date || '',
    returnDate: trip.return_date || '',
    travelers: trip.expected_travelers?.toString() || '',
    modeOfTravel: trip.mode_of_travel || '',
    accommodation: trip.accommodation_type || '',
    tripStatus: trip.trip_status || 'planning',
    travelDetails: trip.travel_details || buildDefaultTravelDetails()
  });

  const [tripInfo, setTripInfo] = React.useState(buildTripInfo());

  // Check for existing session on mount
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadTrips = React.useCallback(async () => {
    if (!user) return;
    const { data } = await getUserTrips(user.id);
    setTrips(data || []);
  }, [user]);

  React.useEffect(() => {
    if (user) {
      loadTrips();
      setViewMode('dashboard');
    }
  }, [user, loadTrips]);

  // Check for share token in URL to join trip
  React.useEffect(() => {
    const checkShareToken = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('join');
      
      if (token && user) {
        try {
          const { data: trip, message } = await joinTripByToken(token, user.id);
          if (trip) {
            // Load the trip
            setCurrentTripId(trip.id);
            setTripInfo(buildTripInfo(trip));
            setViewMode('trip');
            alert(message || 'Joined trip successfully!');
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (error) {
          console.error('Error joining trip:', error);
          alert('Failed to join trip. Please try again.');
        }
      }
    };

    checkShareToken();
  }, [user]);

  const handleTripCreated = async () => {
    if (!user) {
      alert('You must be logged in to create a trip');
      return;
    }

    try {
      console.warn('Attempting to create trip...');
      // Save trip to database
      const { data: trip, error } = await createTrip(tripInfo, user.id);
      
      if (error) {
        console.error('Error saving trip:', error);
        
        // Provide helpful error messages
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
          alert('Database tables not created yet. Please run the SQL schema in Supabase first. Check TRIP_PARTICIPANTS_GUIDE.md for instructions.');
        } else if (error.message?.includes('permission denied') || error.message?.includes('policy')) {
          alert('Permission denied. Please check your Supabase Row Level Security policies.');
        } else {
          alert(`Failed to save trip: ${error.message || 'Unknown error'}. Check browser console for details.`);
        }
        return;
      }

      console.warn('Trip created successfully:', trip);
      // Store trip ID
      setCurrentTripId(trip.id);
      setTripInfo(buildTripInfo(trip));
      setViewMode('trip');
      await loadTrips();
      
      // Scroll to top when showing trip choices
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Unexpected error creating trip:', error);
      alert('An unexpected error occurred. Check browser console for details.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentTripId(null);
    setAuthView('login');
    setViewMode('dashboard');
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setAuthView('login');
  };

  const handleSelectTrip = (trip) => {
    setCurrentTripId(trip.id);
    setTripInfo(buildTripInfo(trip));
    setViewMode('trip');
  };

  const handleCreateTrip = () => {
    setTripInfo(buildTripInfo());
    setCurrentTripId(null);
    setViewMode('create');
  };

  const handleBackToDashboard = () => {
    setViewMode('dashboard');
  };

  const handleDuplicateTrip = async (trip) => {
    if (!user) return;
    const { data, error } = await duplicateTripAsTemplate(trip.id, user.id);
    if (error) {
      alert(error.message || 'Unable to duplicate trip');
      return;
    }
    await loadTrips();
    setCurrentTripId(data.id);
    setTripInfo(buildTripInfo(data));
    setViewMode('trip');
  };

  const handleStatusChange = async (trip, nextStatus) => {
    if (!user) return;
    const { data, error } = await updateTripStatus(trip.id, user.id, nextStatus);
    if (error) {
      alert(error.message || 'Unable to update status');
      return;
    }

    setTrips((prev) => prev.map((item) => (
      item.id === trip.id
        ? { ...item, trip_status: data.trip_status }
        : item
    )));

    if (currentTripId === trip.id) {
      setTripInfo((prev) => ({ ...prev, tripStatus: data.trip_status }));
    }
  };

  if (loading) {
    return (
      <div className="App" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  // If user is not authenticated, show auth components
  if (!user) {
    return (
      <div className="App">
        {authView === 'login' && (
          <Login 
            onNavigate={setAuthView} 
            onLoginSuccess={handleLoginSuccess}
          />
        )}
        {authView === 'register' && (
          <Register onNavigate={setAuthView} />
        )}
        {authView === 'forgotPassword' && (
          <ForgotPassword onNavigate={setAuthView} />
        )}
      </div>
    );
  }

  // If user is authenticated, show main app
  return (
    <div className="App">
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        background: 'white',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '14px', color: '#666' }}>
          {user.email}
        </span>
        <button 
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Logout
        </button>
      </div>
      
      {viewMode !== 'dashboard' && (
        <button
          type="button"
          onClick={handleBackToDashboard}
          className="secondary-btn"
          style={{ marginBottom: '16px' }}
        >
          ← Back to Dashboard
        </button>
      )}

      {viewMode === 'dashboard' && (
        <TripDashboard
          trips={trips}
          onCreateTrip={handleCreateTrip}
          onSelectTrip={handleSelectTrip}
          onDuplicateTrip={handleDuplicateTrip}
          onStatusChange={handleStatusChange}
        />
      )}

      {viewMode === 'create' && (
        <CreateTrip 
          tripInfo={tripInfo} 
          setTripInfo={setTripInfo} 
          onTripCreated={handleTripCreated}
        />
      )}

      {viewMode === 'trip' && (
        <TripChoices 
          tripInfo={tripInfo} 
          tripId={currentTripId}
          currentUser={user}
        />
      )}
    </div>
  );
}

export default App;
