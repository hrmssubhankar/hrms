#!/bin/bash
set -e

echo "=== Setting up GitHub SSH ==="

# 1. Generate SSH key if it doesn't exist
if [ ! -f "$HOME/.ssh/id_ed25519" ]; then
  ssh-keygen -t ed25519 -C "hrmssubhankar@gmail.com" -f "$HOME/.ssh/id_ed25519" -N ""
  echo "✅ SSH key generated"
else
  echo "✅ SSH key already exists"
fi

# 2. Configure SSH to auto-load key on Mac
mkdir -p "$HOME/.ssh"
if ! grep -q "Host github.com" "$HOME/.ssh/config" 2>/dev/null; then
  cat >> "$HOME/.ssh/config" << 'EOF'
Host github.com
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile ~/.ssh/id_ed25519
EOF
  echo "✅ SSH config updated"
fi

# 3. Add key to macOS Keychain (persists across reboots)
ssh-add --apple-use-keychain "$HOME/.ssh/id_ed25519" 2>/dev/null || ssh-add "$HOME/.ssh/id_ed25519"

# 4. Switch git remote to SSH
cd "/Users/subhankarmondal/Documents/Project/YahwehHrms"
git remote set-url origin git@github.com:hrmssubhankar/hrms.git
echo "✅ Remote switched to SSH"

# 5. Push the pending commit
git push
echo "✅ Pushed to GitHub"

echo ""
echo "============================================"
echo "NEXT STEP — Add this public key to GitHub:"
echo "============================================"
cat "$HOME/.ssh/id_ed25519.pub"
echo ""
echo "Go to: https://github.com/settings/ssh/new"
echo "Paste the key above → click 'Add SSH key'"
echo "============================================"
