/**
 * Debug script: navigates to the Olympic schedule, intercepts network requests,
 * dumps HTML structure, and saves a screenshot.
 * Run with: npx tsx scripts/debug-scraper.ts
 */
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const URL = 'https://stacy.olympics.com/en/paris-2024/competition-schedule'
const OUT = path.join(process.cwd(), 'scripts', 'debug-output')

async function main() {
  fs.mkdirSync(OUT, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  const apiResponses: { url: string; body: unknown }[] = []

  page.on('response', async (response) => {
    const url = response.url()
    const ct = response.headers()['content-type'] ?? ''
    if (ct.includes('application/json')) {
      try {
        const body = await response.json()
        apiResponses.push({ url, body })
        console.log('[API]', url)
      } catch { /* ignore */ }
    }
  })

  console.log('Navigating to', URL)
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 })

  const screenshotPath = path.join(OUT, 'screenshot.png')
  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log('Screenshot saved:', screenshotPath)

  const html = await page.content()
  fs.writeFileSync(path.join(OUT, 'page.html'), html, 'utf-8')
  console.log('HTML saved: scripts/debug-output/page.html')

  if (apiResponses.length > 0) {
    fs.writeFileSync(
      path.join(OUT, 'api-responses.json'),
      JSON.stringify(apiResponses, null, 2),
      'utf-8'
    )
    console.log(`API responses saved: ${apiResponses.length} requests intercepted`)
  } else {
    console.log('No JSON API responses intercepted')
  }

  const sample = await page.evaluate(() => {
    const candidates = [
      '[class*="event"]',
      '[class*="match"]',
      '[class*="schedule"]',
      '[class*="row"]',
      '[class*="item"]',
      '[class*="card"]',
      'li',
      'tr',
    ]
    const results: Record<string, string[]> = {}
    for (const sel of candidates) {
      const els = Array.from(document.querySelectorAll(sel)).slice(0, 3)
      if (els.length) {
        results[sel] = els.map((el) => el.className + ' | ' + el.tagName)
      }
    }
    return results
  })

  fs.writeFileSync(path.join(OUT, 'element-sample.json'), JSON.stringify(sample, null, 2), 'utf-8')
  console.log('Element sample saved')
  console.log(JSON.stringify(sample, null, 2))

  await browser.close()
}

main().catch((e) => { console.error(e); process.exit(1) })
