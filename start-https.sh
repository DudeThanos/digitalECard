#!/bin/bash

echo "🚀 Starting Kaynes Digital Card with HTTPS..."
echo "📱 PWA features will now work on mobile devices!"
echo ""

# Check if certificates exist
if [ ! -f "certs/localhost.crt" ] || [ ! -f "certs/localhost.key" ]; then
    echo "❌ Certificates not found! Please run the certificate generation first."
    echo "   Run: mkdir -p certs && cd certs && openssl req -x509 -out localhost.crt -keyout localhost.key -newkey rsa:2048 -nodes -sha256 -subj '/CN=192.168.21.83' -addext 'subjectAltName=IP:192.168.21.83'"
    exit 1
fi

echo "✅ Certificates found!"
echo "🔐 Starting HTTPS server..."
echo ""

# Start React app with HTTPS
cd frontend
HTTPS=true SSL_CRT_FILE=../certs/localhost.crt SSL_KEY_FILE=../certs/localhost.key npm start
