import { BrowserWindow, ipcMain, app, shell } from 'electron'
import { join } from 'path'
import fs from 'fs'
import path from 'path'
import Groq from 'groq-sdk'
import { logger } from '../logger'

let promptWindow: BrowserWindow | null = null

export function isAuthError(err: any): boolean {
  if (err.status === 401 || err.status === 403) return true
  const msg = String(err.message || '').toLowerCase()
  return msg.includes('api key') || msg.includes('apikey') || msg.includes('unauthorized') || msg.includes('invalid api')
}

export async function saveApiKeyToEnv(key: string): Promise<void> {
  const envPath = path.join(process.cwd(), '.env')
  let content = ''

  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8')
    const regex = /^GROQ_API_KEY=.*$/m
    if (regex.test(content)) {
      content = content.replace(regex, `GROQ_API_KEY=${key}`)
    } else {
      content += `\nGROQ_API_KEY=${key}`
    }
  } else {
    const examplePath = path.join(process.cwd(), '.env.example')
    if (fs.existsSync(examplePath)) {
      content = fs.readFileSync(examplePath, 'utf8')
      const regex = /^GROQ_API_KEY=.*$/m
      if (regex.test(content)) {
        content = content.replace(regex, `GROQ_API_KEY=${key}`)
      } else {
        content += `\nGROQ_API_KEY=${key}`
      }
    } else {
      content = `GROQ_API_KEY=${key}\n`
    }
  }

  fs.writeFileSync(envPath, content, 'utf8')
  logger.info(`[API Key] Saved to ${envPath}`)
}

export async function ensureValidApiKey(forceShow = false, initialErrorMsg = ''): Promise<string> {
  let currentKey = process.env.GROQ_API_KEY || ''

  if (currentKey && !forceShow) {
    try {
      logger.info('[API Key] Validating existing Groq API key...')
      const groq = new Groq({ apiKey: currentKey })
      await groq.models.list()
      logger.info('[API Key] Existing Groq API key is valid.')
      return currentKey
    } catch (err: any) {
      if (isAuthError(err)) {
        logger.warn(`[API Key] Existing Groq API key is invalid: ${err.message}`)
        initialErrorMsg = 'Please insert a valid Groq API key to continue.'
      } else {
        logger.warn(`[API Key] Network/other error during validation: ${err.message}. Assuming key is valid for now.`)
        return currentKey
      }
    }
  } else if (!currentKey) {
    initialErrorMsg = 'Please insert API key to continue.'
  }

  // Set up shell helper
  ipcMain.handle('api-key:open-console', async () => {
    shell.openExternal('https://console.groq.com')
  })

  // Show dialog to request key
  return new Promise((resolve) => {
    // If prompt window is already showing, just focus it
    if (promptWindow) {
      promptWindow.focus()
      return
    }

    promptWindow = new BrowserWindow({
      width: 480,
      height: 280,
      frame: false,
      transparent: false,
      alwaysOnTop: true,
      center: true,
      resizable: false,
      backgroundColor: '#0f0f14',
      title: 'FlowClone - API Key Required',
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>FlowClone - API Key Required</title>
        <style>
          body {
            margin: 0;
            padding: 28px;
            background: #0f0f14;
            color: #e8e8f0;
            font-family: 'Inter', -apple-system, sans-serif;
            -webkit-font-smoothing: antialiased;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            height: 100vh;
            box-sizing: border-box;
          }
          .container {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          h2 {
            margin: 0 0 10px 0;
            font-size: 20px;
            font-weight: 700;
            background: linear-gradient(135deg, #7c6ff7, #f74f6e);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          p {
            margin: 0 0 20px 0;
            font-size: 13.5px;
            color: #8888a8;
            line-height: 1.5;
          }
          .input-container {
            position: relative;
            margin-bottom: 16px;
          }
          input {
            width: 100%;
            padding: 14px 16px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            font-size: 14px;
            color: #e8e8f0;
            outline: none;
            box-sizing: border-box;
            font-family: monospace;
            transition: all 0.2s ease;
          }
          input:focus {
            border-color: rgba(124, 111, 247, 0.5);
            background: rgba(255, 255, 255, 0.06);
            box-shadow: 0 0 12px rgba(124, 111, 247, 0.15);
          }
          .error-msg {
            color: #f74f6e;
            font-size: 12px;
            margin-top: -10px;
            margin-bottom: 16px;
            display: none;
            line-height: 1.4;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: auto;
          }
          .link {
            font-size: 12px;
            color: #7c6ff7;
            text-decoration: none;
            cursor: pointer;
            font-weight: 500;
            transition: color 0.15s;
          }
          .link:hover {
            color: #b8b4ff;
            text-decoration: underline;
          }
          .btn {
            background: #7c6ff7;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 10px 24px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
            box-shadow: 0 4px 12px rgba(124, 111, 247, 0.2);
          }
          .btn:hover {
            background: #6b5ee6;
            transform: translateY(-1px);
          }
          .btn:active {
            transform: translateY(0);
          }
          .btn:disabled {
            background: rgba(255, 255, 255, 0.08);
            color: rgba(255, 255, 255, 0.3);
            cursor: not-allowed;
            box-shadow: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div>
            <h2>Groq API Key</h2>
            <p id="desc-text">Please insert API key to continue.</p>
            <div class="input-container">
              <input type="password" id="api-key-input" placeholder="gsk_..." autocomplete="off">
            </div>
            <div id="error-box" class="error-msg"></div>
          </div>
          <div class="footer">
            <span class="link" onclick="window.flowAPI.openGroqConsole()">Get API Key from Groq console</span>
            <button class="btn" id="ok-btn">OK</button>
          </div>
        </div>
        <script>
          const input = document.getElementById('api-key-input');
          const btn = document.getElementById('ok-btn');
          const errorBox = document.getElementById('error-box');
          const descText = document.getElementById('desc-text');

          const initialError = "${initialErrorMsg.replace(/"/g, '\\"')}";
          if (initialError) {
            errorBox.innerText = initialError;
            errorBox.style.display = 'block';
            descText.innerText = "Please update API key to continue.";
          }

          input.focus();

          input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              submit();
            }
          });

          btn.addEventListener('click', submit);

          async function submit() {
            const val = input.value.trim();
            if (!val) {
              errorBox.innerText = "API key cannot be empty";
              errorBox.style.display = 'block';
              return;
            }
            errorBox.style.display = 'none';
            btn.disabled = true;
            btn.innerText = "Validating...";

            try {
              const res = await window.flowAPI.submitApiKey(val);
              if (res.success) {
                // Success is handled by main closing the window
              } else {
                errorBox.innerText = res.error || "Invalid API key";
                errorBox.style.display = 'block';
                btn.disabled = false;
                btn.innerText = "OK";
              }
            } catch (err) {
              errorBox.innerText = err.message || "An error occurred";
              errorBox.style.display = 'block';
              btn.disabled = false;
              btn.innerText = "OK";
            }
          }
        </script>
      </body>
      </html>
    `

    promptWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent))

    ipcMain.handle('api-key:submit', async (_, key) => {
      try {
        logger.info('[API Key Validation] Validating submitted key...')
        const groq = new Groq({ apiKey: key })
        await groq.models.list()
        
        // Key is valid! Save it
        await saveApiKeyToEnv(key)
        process.env.GROQ_API_KEY = key
        
        logger.info('[API Key Validation] Key is valid and saved.')
        
        if (promptWindow) {
          promptWindow.close()
        }
        
        ipcMain.removeHandler('api-key:submit')
        ipcMain.removeHandler('api-key:open-console')
        resolve(key)
        return { success: true }
      } catch (err: any) {
        logger.error(`[API Key Validation] Failed: ${err.message}`)
        return {
          success: false,
          error: isAuthError(err)
            ? 'Invalid API key. Please double check the key.'
            : 'Network error. Please check your connection and try again.'
        }
      }
    })

    promptWindow.on('closed', () => {
      promptWindow = null
      // Clean up the handlers if the window was closed without resolution
      try {
        ipcMain.removeHandler('api-key:submit')
      } catch (_) {}
      try {
        ipcMain.removeHandler('api-key:open-console')
      } catch (_) {}
      
      if (!process.env.GROQ_API_KEY) {
        logger.error('[API Key] Closed without setting key. Exiting app.')
        app.quit()
      }
    })
  })
}
