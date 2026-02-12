#!/bin/bash
# HireGen AI - Production Setup Script
# Automatically sets up systemd service and Nginx

echo "🚀 Setting up HireGen AI Backend for production..."

# 1. Create systemd service file
echo "📝 Creating systemd service..."
sudo tee /etc/systemd/system/hiregen-backend.service > /dev/null <<EOF
[Unit]
Description=HireGen AI Backend
After=network.target

[Service]
Type=simple
User=azureuser
WorkingDirectory=/opt/hiregen-ai
Environment="PATH=/opt/hiregen-ai/venv/bin"
ExecStart=/opt/hiregen-ai/venv/bin/uvicorn Backend.main:app --host 0.0.0.0 --port 8000 --workers 2
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 2. Enable and start service
echo "✅ Enabling and starting backend service..."
sudo systemctl daemon-reload
sudo systemctl enable hiregen-backend
sudo systemctl start hiregen-backend

# 3. Create Nginx config
echo "📝 Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/hiregen > /dev/null <<EOF
server {
    listen 80;
    server_name 20.98.82.167;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }
}
EOF

# 4. Enable Nginx site
echo "✅ Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/hiregen /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 5. Check status
echo ""
echo "🎯 Checking service status..."
sudo systemctl status hiregen-backend --no-pager -l

echo ""
echo "✅ Setup complete!"
echo "🌐 Your backend is now available at:"
echo "   - http://20.98.82.167/health"
echo "   - http://20.98.82.167/"
echo ""
echo "📊 To check logs: sudo journalctl -u hiregen-backend -f"
echo "🔄 To restart: sudo systemctl restart hiregen-backend"
