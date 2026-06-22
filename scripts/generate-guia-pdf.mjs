import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const docsDir = join(root, 'docs')
const sourcePath = join(docsDir, 'GUIA-CLIENTE.md')
const pdfPath = join(docsDir, 'GUIA-CLIENTE.pdf')

const source = readFileSync(sourcePath, 'utf8')
const truncated = source.split('\n## 10.')[0]
const body = truncated
  .replace(/^10\. \[.*\n11\. \[.*\n12\. \[.*\n/m, '')
  .trimEnd()
  .concat('\n\n---\n\n*Documento generado a partir del estado del sistema — junio 2026.*\n')

const htmlBody = execFileSync(
  'python3',
  ['-c', 'import sys, markdown; print(markdown.markdown(sys.stdin.read(), extensions=["tables", "fenced_code", "nl2br"]))'],
  { input: body, encoding: 'utf8' }
)

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Coty Café — Guía del Sistema</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      color: #1a1a1a;
      font-size: 11pt;
      line-height: 1.55;
      max-width: 780px;
      margin: 0 auto;
      padding: 24px;
    }
    h1 {
      color: #053E38;
      font-size: 24pt;
      margin: 0 0 8px;
      border-bottom: 3px solid #C5DDD9;
      padding-bottom: 12px;
    }
    h2 {
      color: #2D5A57;
      font-size: 15pt;
      margin: 28px 0 10px;
      page-break-after: avoid;
    }
    h3 {
      color: #2D5A57;
      font-size: 12pt;
      margin: 18px 0 8px;
      page-break-after: avoid;
    }
    p { margin: 8px 0; }
    ul, ol { margin: 8px 0 12px; padding-left: 22px; }
    li { margin: 4px 0; }
    hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 20px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 16px;
      font-size: 10pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #d1d5db;
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #F8FBFA;
      color: #2D5A57;
      font-weight: 600;
    }
    tr:nth-child(even) td { background: #fafafa; }
    blockquote {
      margin: 12px 0;
      padding: 10px 14px;
      border-left: 4px solid #C5DDD9;
      background: #F8FBFA;
      color: #374151;
    }
    code, pre {
      font-family: ui-monospace, "Cascadia Code", monospace;
      font-size: 9pt;
    }
    pre {
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      overflow-x: auto;
      white-space: pre-wrap;
      page-break-inside: avoid;
    }
    strong { color: #053E38; }
    a { color: #2D5A57; text-decoration: none; }
    em { color: #4b5563; }
  </style>
</head>
<body>
${htmlBody}
</body>
</html>`

const chromeCandidates = [
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
]

const chrome = chromeCandidates.find((path) => {
  try {
    readFileSync(path)
    return true
  } catch {
    return false
  }
})

if (!chrome) {
  console.error('No se encontró Chrome/Chromium para generar el PDF.')
  process.exit(1)
}

console.log('Generando PDF...')

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

try {
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="width:100%;font-size:9px;text-align:center;color:#6b7280;font-family:'Segoe UI',system-ui,sans-serif;">
        <span class="pageNumber"></span>
      </div>
    `,
    margin: {
      top: '18mm',
      right: '16mm',
      bottom: '22mm',
      left: '16mm',
    },
  })
} finally {
  await browser.close()
}

console.log(`PDF generado: ${pdfPath}`)
