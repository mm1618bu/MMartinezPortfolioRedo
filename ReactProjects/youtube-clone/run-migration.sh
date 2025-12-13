#!/bin/bash

# YouTube Clone - Database Migration Script
# This script creates the subscriptions and video_reactions tables

echo "🚀 Starting database migration..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the youtube-clone directory."
    exit 1
fi

echo "📋 This will create the following tables in your Supabase database:"
echo "   1. video_reactions - Track user likes/dislikes on videos"
echo "   2. subscriptions - Track channel subscriptions"
echo ""
echo "⚠️  Make sure you have:"
echo "   - Access to your Supabase project dashboard"
echo "   - The SQL Editor open in your browser"
echo ""

read -p "Press Enter to continue or Ctrl+C to cancel..."

echo ""
echo "📂 Opening SQL migration file..."
echo ""

# Check if the migration file exists
if [ -f "database/migrations/add_reactions_and_subscriptions.sql" ]; then
    echo "✅ Migration file found at: database/migrations/add_reactions_and_subscriptions.sql"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Open your Supabase project: https://supabase.com/dashboard/project/ruwkbhmdfbuapnqeajci"
    echo "   2. Go to SQL Editor"
    echo "   3. Click 'New Query'"
    echo "   4. Copy the contents from: database/migrations/add_reactions_and_subscriptions.sql"
    echo "   5. Paste into SQL Editor and click 'Run'"
    echo ""
    echo "💡 Tip: You can also view the file contents with:"
    echo "   cat database/migrations/add_reactions_and_subscriptions.sql"
    echo ""
    
    # Try to open in default editor
    if command -v code &> /dev/null; then
        echo "🔧 Opening in VS Code..."
        code database/migrations/add_reactions_and_subscriptions.sql
    fi
else
    echo "❌ Error: Migration file not found!"
    echo "Expected location: database/migrations/add_reactions_and_subscriptions.sql"
    exit 1
fi

echo ""
echo "✅ Migration preparation complete!"
echo ""
echo "🔗 Quick links:"
echo "   - Supabase Dashboard: https://supabase.com/dashboard/project/ruwkbhmdfbuapnqeajci"
echo "   - SQL Editor: https://supabase.com/dashboard/project/ruwkbhmdfbuapnqeajci/sql"
echo ""
