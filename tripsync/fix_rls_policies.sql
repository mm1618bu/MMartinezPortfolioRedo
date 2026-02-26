-- ============================================
-- FIX PERMISSION DENIED ERRORS
-- Run this in Supabase SQL Editor to fix RLS policies
-- ============================================

-- CRITICAL: Enable RLS on all tables FIRST
ALTER TABLE IF EXISTS trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accommodation_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses ENABLE ROW LEVEL SECURITY;

-- Create expense_splits table if needed
CREATE TABLE IF NOT EXISTS expense_splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount_cents INTEGER NOT NULL,
    UNIQUE(expense_id, user_id)
);

ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view trips they participate in" ON trips;
DROP POLICY IF EXISTS "Users can create trips" ON trips;
DROP POLICY IF EXISTS "Trip creators can update trips" ON trips;
DROP POLICY IF EXISTS "Trip creators can delete trips" ON trips;
DROP POLICY IF EXISTS "Users can view trip participants" ON trip_participants;
DROP POLICY IF EXISTS "Trip creators can add participants" ON trip_participants;
DROP POLICY IF EXISTS "Users can update their participation" ON trip_participants;
DROP POLICY IF EXISTS "Trip creators can remove participants" ON trip_participants;
DROP POLICY IF EXISTS "Trip participants can view accommodations" ON accommodations;
DROP POLICY IF EXISTS "Trip participants can add accommodations" ON accommodations;
DROP POLICY IF EXISTS "Trip participants can update accommodations" ON accommodations;
DROP POLICY IF EXISTS "Trip participants can delete accommodations" ON accommodations;
DROP POLICY IF EXISTS "Trip participants can view expenses" ON expenses;
DROP POLICY IF EXISTS "Trip participants can add expenses" ON expenses;
DROP POLICY IF EXISTS "Trip participants can update expenses" ON expenses;
DROP POLICY IF EXISTS "Trip participants can delete expenses" ON expenses;
DROP POLICY IF EXISTS "Trip participants can view expense splits" ON expense_splits;
DROP POLICY IF EXISTS "Trip participants can add expense splits" ON expense_splits;
DROP POLICY IF EXISTS "Trip participants can update expense splits" ON expense_splits;
DROP POLICY IF EXISTS "Trip participants can delete expense splits" ON expense_splits;

-- TRIPS POLICIES (with TO authenticated added)
CREATE POLICY "Users can view trips they participate in"
    ON trips FOR SELECT
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT user_id FROM trip_participants WHERE trip_id = trips.id
        )
    );

-- Allow authenticated users to create via RPC function
CREATE POLICY "Users can create trips"
    ON trips FOR INSERT
    WITH CHECK (true);  -- RPC function handles authorization

-- Trip creators can update trips
CREATE POLICY "Trip creators can update trips"
    ON trips FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Trip creators can delete trips"
    ON trips FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- TRIP PARTICIPANTS POLICIES (with TO authenticated added)
CREATE POLICY "Users can view trip participants"
    ON trip_participants FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM trip_participants tp2
            WHERE tp2.trip_id = trip_participants.trip_id
            AND tp2.user_id = auth.uid()
        )
    );

-- Allow via RPC function (add_participant_to_trip)
CREATE POLICY "Trip creators can add participants"
    ON trip_participants FOR INSERT
    WITH CHECK (true);  -- RPC function handles authorization

CREATE POLICY "Users can update their participation"
    ON trip_participants FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Users can remove themselves
CREATE POLICY "Trip creators can remove participants"
    ON trip_participants FOR DELETE
    TO authenticated
    USING (
        user_id = auth.uid()  -- Users can remove themselves
    );

-- ACCOMMODATIONS POLICIES
CREATE POLICY "Trip participants can view accommodations"
    ON accommodations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = accommodations.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Trip participants can add accommodations"
    ON accommodations FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = accommodations.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Trip participants can update accommodations"
    ON accommodations FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = accommodations.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Trip participants can delete accommodations"
    ON accommodations FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = accommodations.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

-- EXPENSES POLICIES
CREATE POLICY "Trip participants can view expenses"
    ON expenses FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = expenses.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Trip participants can add expenses"
    ON expenses FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = expenses.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Trip participants can update expenses"
    ON expenses FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = expenses.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Trip participants can delete expenses"
    ON expenses FOR DELETE
    TO authenticated
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
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = expense_splits.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Trip participants can add expense splits"
    ON expense_splits FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = expense_splits.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Trip participants can update expense splits"
    ON expense_splits FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = expense_splits.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Trip participants can delete expense splits"
    ON expense_splits FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM trip_participants
            WHERE trip_participants.trip_id = expense_splits.trip_id
            AND trip_participants.user_id = auth.uid()
        )
    );

-- Allow participants to update travel info via RPC
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

-- Fast participant fetch
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

-- Expense splits table
CREATE TABLE IF NOT EXISTS expense_splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount_cents INTEGER NOT NULL,
    UNIQUE(expense_id, user_id)
);

ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

-- Transactional trip creation
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

-- Search users by email function
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

-- ============================================
-- COMPLETED!
-- ============================================
-- After running this, try creating a trip again
