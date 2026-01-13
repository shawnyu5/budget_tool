#!/bin/sh
set -e
# source backend/.env
# source frontend/.env
#
# export basic_auth
# export db_connection_string
# export db_name
# export private_key
# export public_key
# export vapid_private_key
# export vapid_public_key
# export VITE_BACKEND_URL
#
# Function to cleanup background processes
cleanup() {
    echo "Stopping background processes..."
    # Kill all child processes started by this script
    kill "$rust_pid" "$node_pid" 2>/dev/null || true
    wait "$rust_pid" "$node_pid" 2>/dev/null || true
    echo "Cleanup done."
}


# # Start Rust backend in background
./backend/bin &
rust_pid=$!
# Start Node SSR in background
node frontend/.output/server/index.mjs &
node_pid=$!

# Start Nginx in foreground
nginx -c ./nginx.conf -g "daemon off;"
