-- ============================================
-- TRIPSYNC DATABASE SCHEMA FOR SUPABASE
-- ============================================
-- Run this SQL in your Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TRIPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Trip basic info
    name VARCHAR(255),
    start_point VARCHAR(255),
    end_point VARCHAR(255),
    departure_date DATE,
    return_date DATE,
    expected_travelers INTEGER,
    mode_of_travel VARCHAR(50),
    accommodation_type VARCHAR(100),
    
    -- Travel details stored as JSONB for flexibility
    travel_details JSONB,
    
    -- Shareable link token
    share_token UUID DEFAULT uuid_generate_v4() UNIQUE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    trip_status VARCHAR(50) DEFAULT 'planning'
);

-- ============================================
-- TRIP PARTICIPANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trip_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Role in trip
    role VARCHAR(50) DEFAULT 'participant', -- 'creator', 'participant'
    
    -- Participation status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    
    -- Unique constraint: one user per trip
    UNIQUE(trip_id, user_id)
);

-- ============================================
-- ACCOMMODATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS accommodations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    name VARCHAR(255) NOT NULL,
    url TEXT,
    price_cents INTEGER,
    beds INTEGER,
    is_booked BOOLEAN DEFAULT false
);

-- ============================================
-- ACCOMMODATION VOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS accommodation_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    accommodation_id UUID REFERENCES accommodations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Unique constraint: one vote per user per accommodation
    UNIQUE(accommodation_id, user_id)
);

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    description VARCHAR(500) NOT NULL,
    amount_cents INTEGER NOT NULL,
    paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    category VARCHAR(100) DEFAULT 'other',
    expense_date DATE DEFAULT CURRENT_DATE
);

-- ============================================
-- EXPENSE SPLITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expense_splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount_cents INTEGER NOT NULL,

    -- Unique constraint: one split per user per expense
    UNIQUE(expense_id, user_id)
);

-- ============================================
-- PAYMENTS TABLE (for tracking settlement transactions)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    settled_at TIMESTAMP WITH TIME ZONE,

    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount_cents INTEGER NOT NULL,
    
    -- Payment status: 'pending', 'settled'
    status VARCHAR(50) DEFAULT 'pending',
    
    -- Notes or reference (optional)
    notes TEXT
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_trips_created_by ON trips(created_by);
CREATE INDEX IF NOT EXISTS idx_trips_share_token ON trips(share_token);
CREATE INDEX IF NOT EXISTS idx_trip_participants_trip_id ON trip_participants(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_participants_user_id ON trip_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_accommodations_trip_id ON accommodations(trip_id);
CREATE INDEX IF NOT EXISTS idx_accommodation_votes_accommodation_id ON accommodation_votes(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_trip_id ON expense_splits(trip_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_payments_trip_id ON payments(trip_id);
CREATE INDEX IF NOT EXISTS idx_payments_from_user ON payments(from_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_to_user ON payments(to_user_id);

-- ============================================
-- ENABLE ROW LEVEL SECURITY - MUST BE DONE FIRST
-- ============================================
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodation_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- TRIPS POLICIES
-- Users can view trips they are participants in
CREATE POLICY "Users can view trips they participate in"
    ON trips FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM trip_participants WHERE trip_id = trips.id
        )
    );

-- Users can create new trips via RPC function
CREATE POLICY "Users can create trips"
    ON trips FOR INSERT
    WITH CHECK (true);  -- RPC function (create_trip_with_creator) handles authorization

-- Trip creators can update their trips
CREATE POLICY "Trip creators can update trips"
    ON trips FOR UPDATE
    USING (auth.uid() = created_by);

-- Trip creators can delete their trips
CREATE POLICY "Trip creators can delete trips"
    ON trips FOR DELETE
    USING (auth.uid() = created_by);

-- TRIP PARTICIPANTS POLICIES
-- Users can view participants of trips they're in (avoiding recursion)
CREATE POLICY "Users can view trip participants"
    ON trip_participants FOR SELECT
    USING (
        -- Check if user is a participant in the same trip
        EXISTS (
            SELECT 1 FROM trip_participants tp2
            WHERE tp2.trip_id = trip_participants.trip_id
            AND tp2.user_id = auth.uid()
        )
    );

-- Trip creators can add participants via RPC function
CREATE POLICY "Trip creators can add participants"
    ON trip_participants FOR INSERT
    WITH CHECK (true);  -- RPC function (add_participant_to_trip) handles authorization

-- Users can update their own participation status
CREATE POLICY "Users can update their participation"
    ON trip_participants FOR UPDATE
    USING (user_id = auth.uid());

-- Users can remove themselves from trips
CREATE POLICY "Trip creators can remove participants"
    ON trip_participants FOR DELETE
    USING (
        user_id = auth.uid()
    );

-- ACCOMMODATIONS POLICIES
-- Trip participants can view accommodations
CREATE POLICY "Trip participants can view accommodations"
    ON accommodations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = accommodations.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

-- Trip participants can add accommodations
CREATE POLICY "Trip participants can add accommodations"
    ON accommodations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = accommodations.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

-- Trip participants can update/delete accommodations
CREATE POLICY "Trip participants can update accommodations"
    ON accommodations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = accommodations.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Trip participants can delete accommodations"
    ON accommodations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = accommodations.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

-- ACCOMMODATION VOTES POLICIES
-- Trip participants can view votes
CREATE POLICY "Trip participants can view votes"
    ON accommodation_votes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM accommodations a
            JOIN trip_participants tp ON tp.trip_id = a.trip_id
            WHERE a.id = accommodation_votes.accommodation_id
            AND tp.user_id = auth.uid()
        )
    );

-- Trip participants can vote
CREATE POLICY "Trip participants can vote"
    ON accommodation_votes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM accommodations a
            JOIN trip_participants tp ON tp.trip_id = a.trip_id
            WHERE a.id = accommodation_votes.accommodation_id
            AND tp.user_id = auth.uid()
        )
        AND user_id = auth.uid()
    );

-- Users can delete their own votes
CREATE POLICY "Users can delete their votes"
    ON accommodation_votes FOR DELETE
    USING (user_id = auth.uid());

-- EXPENSES POLICIES
-- Trip participants can view expenses
CREATE POLICY "Trip participants can view expenses"
    ON expenses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = expenses.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

-- Trip participants can add expenses
CREATE POLICY "Trip participants can add expenses"
    ON expenses FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = expenses.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

-- Trip participants can update/delete expenses
CREATE POLICY "Trip participants can update expenses"
    ON expenses FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = expenses.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Trip participants can delete expenses"
    ON expenses FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = expenses.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

-- EXPENSE SPLITS POLICIES
CREATE POLICY "Trip participants can view expense splits"
    ON expense_splits FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = expense_splits.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Trip participants can add expense splits"
    ON expense_splits FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = expense_splits.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Trip participants can update expense splits"
    ON expense_splits FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = expense_splits.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Trip participants can delete expense splits"
    ON expense_splits FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = expense_splits.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

-- PAYMENTS POLICIES
-- Trip participants can view payments for their trip
CREATE POLICY "Trip participants can view payments"
    ON payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = payments.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

-- Trip participants can create payment records
CREATE POLICY "Trip participants can create payments"
    ON payments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = payments.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

-- Users can update payments they are involved in or trip participants
CREATE POLICY "Trip participants can update payments"
    ON payments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = payments.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

-- Trip participants can delete payments
CREATE POLICY "Trip participants can delete payments"
    ON payments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = payments.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get user profile info (email, username from metadata)
CREATE OR REPLACE FUNCTION get_user_profile(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    username TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email::TEXT,
        COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1))::TEXT as username
    FROM auth.users au
    WHERE au.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Transactional trip creation (creator + participant)
CREATE OR REPLACE FUNCTION create_trip_with_creator(
    p_name TEXT,
    p_start_point TEXT,
    p_end_point TEXT,
    p_departure_date DATE,
    p_return_date DATE,
    p_expected_travelers INTEGER,
    p_mode_of_travel TEXT,
    p_accommodation_type TEXT,
    p_travel_details JSONB
) RETURNS trips AS $$
DECLARE
    v_trip trips;
BEGIN
    INSERT INTO trips (
        created_by,
        name,
        start_point,
        end_point,
        departure_date,
        return_date,
        expected_travelers,
        mode_of_travel,
        accommodation_type,
        travel_details
    ) VALUES (
        auth.uid(),
        p_name,
        p_start_point,
        p_end_point,
        p_departure_date,
        p_return_date,
        p_expected_travelers,
        p_mode_of_travel,
        p_accommodation_type,
        p_travel_details
    ) RETURNING * INTO v_trip;

    INSERT INTO trip_participants (trip_id, user_id, role, status)
    VALUES (v_trip.id, auth.uid(), 'creator', 'accepted');

    RETURN v_trip;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_trip_with_creator(TEXT, TEXT, TEXT, DATE, DATE, INTEGER, TEXT, TEXT, JSONB) TO authenticated;

-- Function to search users by email
CREATE OR REPLACE FUNCTION search_users_by_email(search_term TEXT)
RETURNS TABLE (
    id UUID,
    email TEXT,
    username TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email::TEXT,
        COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1))::TEXT as username
    FROM auth.users au
    WHERE au.email ILIKE '%' || search_term || '%'
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION search_users_by_email(TEXT) TO authenticated;

-- Transactional expense creation with split validation
CREATE OR REPLACE FUNCTION create_expense_with_splits(
    p_trip_id UUID,
    p_added_by UUID,
    p_description TEXT,
    p_amount_cents INTEGER,
    p_paid_by UUID,
    p_category TEXT,
    p_expense_date DATE,
    p_splits JSONB
) RETURNS expenses AS $$
DECLARE
    v_expense expenses;
    v_split_total INTEGER := 0;
    v_split JSONB;
    v_user_id UUID;
    v_amount_cents INTEGER;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM trip_participants
        WHERE trip_id = p_trip_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Not a trip participant';
    END IF;

    IF p_amount_cents IS NULL OR p_amount_cents <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    INSERT INTO expenses (
        trip_id,
        added_by,
        description,
        amount_cents,
        paid_by,
        category,
        expense_date
    ) VALUES (
        p_trip_id,
        p_added_by,
        p_description,
        p_amount_cents,
        p_paid_by,
        COALESCE(p_category, 'other'),
        COALESCE(p_expense_date, CURRENT_DATE)
    ) RETURNING * INTO v_expense;

    FOR v_split IN SELECT * FROM jsonb_array_elements(p_splits)
    LOOP
        v_user_id := (v_split->>'user_id')::UUID;
        v_amount_cents := (v_split->>'amount_cents')::INTEGER;

        IF v_user_id IS NULL OR v_amount_cents IS NULL THEN
            RAISE EXCEPTION 'Invalid split entry';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_id = p_trip_id AND user_id = v_user_id
        ) THEN
            RAISE EXCEPTION 'Split user is not a trip participant';
        END IF;

        INSERT INTO expense_splits (expense_id, trip_id, user_id, amount_cents)
        VALUES (v_expense.id, p_trip_id, v_user_id, v_amount_cents);

        v_split_total := v_split_total + v_amount_cents;
    END LOOP;

    IF abs(v_split_total - p_amount_cents) > 1 THEN
        RAISE EXCEPTION 'Split total must match expense total within 1 cent';
    END IF;

    RETURN v_expense;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_expense_with_splits(UUID, UUID, TEXT, INTEGER, UUID, TEXT, DATE, JSONB) TO authenticated;

-- Function to get participants with profile info in one call
CREATE OR REPLACE FUNCTION get_trip_participants(p_trip_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    email TEXT,
    username TEXT,
    role TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        tp.id,
        tp.user_id,
        au.email::TEXT,
        COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1))::TEXT as username,
        tp.role::TEXT,
        tp.status::TEXT
    FROM trip_participants tp
    JOIN auth.users au ON au.id = tp.user_id
    WHERE tp.trip_id = p_trip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_trip_participants(UUID) TO authenticated;

-- Add participant safely via RPC (bypasses policy recursion)
CREATE OR REPLACE FUNCTION add_participant_to_trip(
    p_trip_id UUID,
    p_user_id UUID,
    p_role TEXT DEFAULT 'participant',
    p_status TEXT DEFAULT 'pending'
) RETURNS trip_participants AS $$
DECLARE
    v_participant trip_participants;
BEGIN
    -- Verify caller is trip creator
    IF NOT EXISTS (
        SELECT 1 FROM trips
        WHERE id = p_trip_id AND created_by = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Only trip creator can add participants';
    END IF;

    -- Insert participant
    INSERT INTO trip_participants (trip_id, user_id, role, status)
    VALUES (p_trip_id, p_user_id, p_role, p_status)
    ON CONFLICT (trip_id, user_id) DO UPDATE SET status = EXCLUDED.status
    RETURNING * INTO v_participant;

    RETURN v_participant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION add_participant_to_trip(UUID, UUID, TEXT, TEXT) TO authenticated;

-- Function to update travel info (mode_of_travel + travel_details)
-- Allows any trip participant to update travel info without changing core trip fields
CREATE OR REPLACE FUNCTION update_trip_travel_info(
    p_trip_id UUID,
    p_mode_of_travel TEXT,
    p_travel_details JSONB
) RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM trip_participants
        WHERE trip_id = p_trip_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Not a trip participant';
    END IF;

    UPDATE trips
    SET
        mode_of_travel = COALESCE(p_mode_of_travel, mode_of_travel),
        travel_details = COALESCE(p_travel_details, travel_details),
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = p_trip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_trip_travel_info(UUID, TEXT, JSONB) TO authenticated;

-- ============================================
-- COMPLETED!
-- ============================================
-- After running this, your database is ready for TripSync
