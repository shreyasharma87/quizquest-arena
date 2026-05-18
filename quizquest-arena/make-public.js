const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for terminal formatting
const colors = {
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  bgBlue: '\x1b[44m',
  fgWhite: '\x1b[37m'
};

console.clear();
console.log(`${colors.cyan}${colors.bold}`);
console.log(`╔═════════════════════════════════════════════════════════════════╗`);
console.log(`║                  ⚡ QUIZQUEST ARENA PUBLIC TUNNEL ⚡             ║`);
console.log(`║          Deploying Multiplayer Platform to the Public Internet  ║`);
console.log(`╚═════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

const activeProcesses = [];
let backendPublicUrl = '';
let frontendPublicUrl = '';

// Create a log file stream to keep the console clean but inspectable
const logPath = path.join(__dirname, 'tunnels.log');
// Delete old logs if they exist
if (fs.existsSync(logPath)) {
  try { fs.unlinkSync(logPath); } catch (e) {}
}
const logStream = fs.createWriteStream(logPath, { flags: 'a' });

function writeToLog(source, data) {
  const timestamp = new Date().toISOString();
  const cleanData = data.toString().replace(/\x1B\[[0-9;]*[a-zA-Z]/g, ''); // strip ansi codes for clean logs
  logStream.write(`[${timestamp}] [${source}] ${cleanData}`);
}

function cleanup() {
  console.log(`\n${colors.red}${colors.bold}🛑  Stopping all servers and closing tunnels...${colors.reset}`);
  activeProcesses.forEach(proc => {
    if (proc && !proc.killed) {
      try {
        // On Windows, taskkill /f /t is required to kill child processes of node shells reliably
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', proc.pid, '/f', '/t'], { stdio: 'ignore' });
        } else {
          proc.kill('SIGINT');
        }
      } catch (err) {
        // Ignore
      }
    }
  });
  logStream.end();
  console.log(`${colors.green}✔ Cleaned up successfully! Goodbye.${colors.reset}\n`);
  process.exit();
}

// Bind cleanup events
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Helper to spawn a shell process
function startProcess(name, command, args, options = {}) {
  const proc = spawn(command, args, { ...options, shell: true });
  activeProcesses.push(proc);

  proc.stdout.on('data', (data) => {
    writeToLog(`${name} STDOUT`, data);
  });

  proc.stderr.on('data', (data) => {
    writeToLog(`${name} STDERR`, data);
  });

  proc.on('error', (err) => {
    console.error(`${colors.red}[Error starting ${name}]: ${err.message}${colors.reset}`);
    writeToLog(`${name} ERROR`, err.message + '\n');
  });

  return proc;
}

// Extract Cloudflare URL from stream
function monitorTunnel(name, proc, onUrlFound) {
  const handler = (data) => {
    const output = data.toString();
    const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
    if (match) {
      const url = match[0];
      proc.stdout.off('data', handler);
      proc.stderr.off('data', handler);
      onUrlFound(url);
    }
  };

  proc.stdout.on('data', handler);
  proc.stderr.on('data', handler);
}

// Main execution flow
async function run() {
  console.log(`⏳ ${colors.yellow}Step 1: Spawning Backend Server (Port 3000)...${colors.reset}`);
  const backendServer = startProcess('Backend Server', 'npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'backend')
  });

  console.log(`⏳ ${colors.yellow}Step 2: Spawning Backend Tunnel (Cloudflare)...${colors.reset}`);
  const backendTunnel = startProcess('Backend Tunnel', 'npx', ['cloudflared', 'tunnel', '--url', 'http://localhost:3000']);

  monitorTunnel('Backend Tunnel', backendTunnel, (url) => {
    backendPublicUrl = url;
    console.log(`🔥 ${colors.green}${colors.bold}Backend Public Tunnel URL:${colors.reset} ${colors.cyan}${colors.bold}${backendPublicUrl}${colors.reset}`);

    // Update frontend/.env with the exact backend URL
    const envPath = path.join(__dirname, 'frontend', '.env');
    fs.writeFileSync(envPath, `VITE_API_URL=${backendPublicUrl}\n`);
    console.log(`📝 ${colors.green}Updated frontend/.env successfully.${colors.reset}\n`);

    startFrontend();
  });
}

function startFrontend() {
  console.log(`⏳ ${colors.yellow}Step 3: Spawning Frontend Server (Port 5173)...${colors.reset}`);
  const frontendServer = startProcess('Frontend Server', 'npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'frontend')
  });

  console.log(`⏳ ${colors.yellow}Step 4: Spawning Frontend Tunnel (Cloudflare)...${colors.reset}`);
  const frontendTunnel = startProcess('Frontend Tunnel', 'npx', ['cloudflared', 'tunnel', '--url', 'http://localhost:5173']);

  monitorTunnel('Frontend Tunnel', frontendTunnel, (url) => {
    frontendPublicUrl = url;
    
    // Complete dashboard rendering!
    console.clear();
    console.log(`${colors.green}${colors.bold}`);
    console.log(`╔═════════════════════════════════════════════════════════════════╗`);
    console.log(`║             🎉 QUIZQUEST ARENA IS NOW LIVE ONLINE! 🎉           ║`);
    console.log(`║        Exposed to the public internet securely via Cloudflare   ║`);
    console.log(`╚═════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

    console.log(`📱 ${colors.bold}FRONTEND URL (Share this with your players & hosts):${colors.reset}`);
    console.log(`👉 ${colors.cyan}${colors.bold}${frontendPublicUrl}${colors.reset}\n`);

    console.log(`⚙ ${colors.bold}BACKEND API & SOCKET SERVER URL:${colors.reset}`);
    console.log(`👉 ${colors.yellow}${backendPublicUrl}${colors.reset}\n`);

    console.log(`📝 ${colors.bold}All logs are written live to:${colors.reset} ${colors.dim}tunnels.log${colors.reset}`);
    console.log(`⌨ ${colors.bold}Press${colors.red} Ctrl + C ${colors.bold}at any time to shut down the servers & close the tunnels.${colors.reset}\n`);
    console.log(`-----------------------------------------------------------------\n`);
    console.log(`${colors.dim}Enjoy your game session! 🚀${colors.reset}\n`);
  });
}

run().catch(err => {
  console.error('Fatal error starting the tunnel services:', err);
  cleanup();
});
