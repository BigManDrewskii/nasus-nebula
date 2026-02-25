#!/bin/bash
# Returns JSON describing available tools and templates.
# Called by the agent loop after container start — output is injected into the system prompt
# so the LLM knows exactly what is available without guessing.

echo "{"

# Available CLI tools
echo '  "tools": {'
for cmd in node npm pnpm python3 pip3 git curl wget jq serve; do
    if command -v "$cmd" &>/dev/null; then
        ver=$("$cmd" --version 2>&1 | head -1 | grep -oP '[\d]+\.[\d]+\.[\d]+' | head -1)
        echo "    \"$cmd\": \"${ver:-available}\","
    fi
done
echo '    "_": null'
echo '  },'

# Pre-built templates
echo '  "templates": ['
for dir in /templates/*/; do
    [ -d "$dir" ] || continue
    name=$(basename "$dir")
    has_nm="false"
    [ -d "${dir}node_modules" ] && has_nm="true"
    desc=""
    [ -f "${dir}.template-desc" ] && desc=$(cat "${dir}.template-desc")
    echo "    {\"name\": \"$name\", \"has_node_modules\": $has_nm, \"description\": \"$desc\"},"
done
echo '    null'
echo '  ]'

echo "}"
