#!/bin/bash
set -e
cd /home/z/my-project/shine-web
npm install --legacy-peer-deps 2>&1 | tail -5
echo "=== npm install done ==="