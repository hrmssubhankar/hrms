#!/bin/bash
set -e

echo "=== Fixing SSH identity for GitHub ==="

# 1. Remove all keys from the SSH agent (clears the old hostsubho key)
ssh-add -D 2>/dev/null && echo "✅ Cleared old keys from SSH agent" || true

# 2. Add only our new key to the agent with keychain persistence
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
echo "✅ Added new key to SSH agent"

# 3. Rewrite SSH config to explicitly use only our key for GitHub
# (Remove any old github.com block first, then add clean one)
CONFIG="$HOME/.ssh/config"
if [ -f "$CONFIG" ]; then
  # Remove existing github.com Host block
  awk '
    /^Host github\.com/{found=1; next}
    found && /^Host /{found=0}
    !found{print}
  ' "$CONFIG" > /tmp/ssh_config_cleaned && mv /tmp/ssh_config_cleaned "$CONFIG"
fi

# 4. Add clean GitHub config pointing only to our new key
cat >> "$HOME/.ssh/config" << 'EOF'

Host github.com
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
EOF
echo "✅ SSH config updated (IdentitiesOnly yes forces new key)"

# 5. Test authentication — should say "Hi hrmssubhankar!"
echo ""
echo "=== Testing GitHub authentication ==="
ssh -T git@github.com 2>&1 || true

# 6. Push
echo ""
echo "=== Pushing to GitHub ==="
cd /Users/subhankarmondal/Documents/Project/YahwehHrms
git push && echo "✅ Push successful!"
