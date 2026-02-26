# Setting Up Trip Participants & Sharing

## 📋 Database Setup

### Step 1: Run the SQL Schema

1. Go to your Supabase project dashboard
2. Navigate to: **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy the entire contents of `supabase_schema.sql` file
5. Paste it into the SQL editor
6. Click **"RUN"** to execute

This will create all necessary tables and security policies.

### Step 2: Verify Tables Created

After running the SQL, go to **Table Editor** and verify these tables exist:
- ✅ `trips` - Stores trip information
- ✅ `trip_participants` - Stores who's in each trip
- ✅ `accommodations` - Stores accommodation options
- ✅ `accommodation_votes` - Stores votes for accommodations
- ✅ `expenses` - Stores trip expenses

## 🎯 Features Implemented

### 1. **User Account Management**
- Users must be logged in to create or join trips
- All participants have Supabase authentication accounts
- Trip data is associated with user IDs (not just names)

### 2. **Add People to Trips** 
- **Search by email**: Type an email address to find registered users
- **Add to trip**: Click "Add" to invite them to your trip
- **Invitation status**: Shows if invitation is pending or accepted

### 3. **Shareable Trip Links**
- Click the **"📤 Share Trip"** button
- Copy the unique shareable link
- Anyone with a TripSync account can join via the link
- Link format: `http://localhost:3000/? join=xxxxx-xxxx-xxxx`

### 4. **Join Trip via Link**
- Users click the shared link
- If logged in: Automatically joins the trip
- If not logged in: Prompted to login/register first
- After joining: Redirected to the trip page

### 5. **Participant Management**
- See all trip members with their usernames and emails
- Shows creator badge for trip owner
- Shows "YOU" badge for current user
- Remove participants (if you're the creator)
- Real-time participant list updates

### 6. **Voting System**
- Only accepted participants can vote
- Select yourself from the dropdown before voting
- Votes are tied to user accounts
- See who voted for each accommodation

### 7. **Expense Tracking**
- Select who paid from the list of participants
- Expenses are tied to user accounts
- Automatic settlement calculations based on participants

## 🔒 Security Features

All implemented with Supabase Row Level Security (RLS):

1. **Trip Privacy**: Users can only see trips they're part of
2. **Data Protection**: Users can only modify their own data
3. **Invite Control**: Only trip creators can add/remove participants
4. **Secure Sharing**: Share tokens are unique UUIDs (impossible to guess)

## 🚀 How to Use

### Creating a Trip:
1. Login to TripSync
2. Fill out the "Create Trip" form
3. Click "Create Trip"
4. Trip is saved to database with you as the creator

### Adding People:
**Method 1: Search & Add**
1. In "Who is coming on this trip?" section
2. Type an email in the search box
3. Click "Add" next to the user

**Method 2: Share Link**
1. Click "📤 Share Trip" button
2. Click "📋 Copy" to copy the link
3. Share link via email, text, etc.
4. Recipients click link and automatically join

### Voting on Accommodations:
1. Make sure you're added as a participant
2. Select yourself from "Voting as:" dropdown
3. Click "Vote" on your preferred accommodation(s)
4. The winner is automatically calculated

### Tracking Expenses:
1. Add expenses with description and amount
2. Select who paid from the dropdown (only participants)
3. Settlements are automatically calculated
4. Everyone can see who owes whom

## 🐛 Troubleshooting

### "User not found" when searching:
- The person must have a TripSync account first
- They need to register at your site
- Search uses the email they registered with

### "Failed to create trip":
- Check your Supabase connection in `.env`
- Verify the SQL schema was run successfully
- Check browser console for errors

### "Can't join trip via link":
- Make sure you're logged in
- Check that the link wasn't truncated when copied
- Verify the trip still exists

### Voting doesn't work:
- Make sure you're an accepted participant
- Select yourself from the "Voting as" dropdown
- Refresh the page if needed

## 📱 Mobile Features

- All participant management is mobile-optimized
- Touch-friendly buttons (44px minimum)
- Responsive search and selection
- Easy copy/paste for share links
- Mobile-friendly participant list

## 🔄 Data Sync

- Trip data automatically saves to Supabase
- Participants see real-time updates (on page refresh)
- All changes persist across sessions
- Works across devices with same account

## 🎨 UI Components

### TripParticipants Component:
- User search with live results
- Participant list with avatars
- Share link modal
- Status badges (Creator, You, Pending)
- Remove participant action

### Updated TripChoices:
- Integrated participant management
- Account-based voting system
- Account-based expense tracking
- Participant names displayed correctly

## 📝 Notes

- Participants must accept to fully join (currently auto-accepted)
- Trip creators have full control over participant list
- Share links never expire (until trip is deleted)
- Username comes from metadata or email prefix
- Trip data includes all form details from creation

## 🔮 Future Enhancements

Could be added:
- Notification system for invitations
- Real-time updates (without page refresh)
- Profile pictures for participants
- Trip chat/comments section
- Email invitations (not just shared links)
- Accept/decline invitation flow
- Trip history and archived trips
