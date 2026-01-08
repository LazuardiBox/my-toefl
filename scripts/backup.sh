#!/bin/bash

# Get current date in ddmmyy format (e.g. 090126)
DATE_SUFFIX=$(date +'%d%m%y')
BRANCH_NAME="backup/$DATE_SUFFIX"

echo "Creating backup branch: $BRANCH_NAME"

# 1. Ensure we are on main
git checkout main

# 2. Create the new branch based on current main
# -B forces creation/reset ifg it happens to exist already, 
# ensuring it's an exact mirror of current main
git checkout -B "$BRANCH_NAME"

# 3. Push the new branch to origin
echo "Pushing $BRANCH_NAME to origin..."
git push origin "$BRANCH_NAME"

# 4. Go back to main
git checkout main

echo "✅ Backup complete: origin/$BRANCH_NAME"
