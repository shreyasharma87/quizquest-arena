const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Public Tunnel Service...');

// Start Backend Tunnel (Port 3000)
const backendTunnel = exec('npx localtunnel --port 3000');

backendTunnel.stdout.on('data', (data) => {
    const url = data.toString().trim();
    if (url.includes('your url is:')) {
        const publicUrl = url.split('your url is:')[1].trim();
        console.log(`✅ Backend is now PUBLIC at: ${publicUrl}`);
        
        // Update Frontend .env
        const envPath = path.join(__dirname, 'frontend', '.env');
        const envContent = `VITE_API_URL=${publicUrl}\n`;
        fs.writeFileSync(envPath, envContent);
        console.log(`📝 Updated frontend/.env with public backend URL.`);
        console.log(`\n👉 Now run 'npm run dev' in the frontend folder.`);
        console.log(`👉 To make the frontend public too, run: npx localtunnel --port 5173`);
    }
});

backendTunnel.stderr.on('data', (data) => {
    console.error(`❌ Error: ${data}`);
});

console.log('⏳ Waiting for tunnel assignment...');
