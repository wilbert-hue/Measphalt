/**
 * One-off generator for Middle East Cold Mix Asphalt market JSON files.
 * Run: node scripts/generate-cold-mix-data.cjs
 */
const fs = require('fs')
const path = require('path')

const OUT_DIR = path.join(__dirname, '..', 'public', 'data')

const years = []
for (let y = 2021; y <= 2033; y++) years.push(y)

const geographies = ['GCC Countries', 'Israel', 'Rest of Middle East']

const segmentTypes = {
  'By Product Type': [
    'Emulsion Based Cold Mix',
    'Cutback Asphalt Mix',
    'Foamed Asphalt Mix',
    'Cold Recycled Mix',
    'Proprietary or Specialty Cold Mix',
  ],
  'By Gradation': [
    'Dense Graded Cold Mix',
    'Open Graded Cold Mix',
    'Gap Graded or Specialty Graded Cold Mix',
  ],
  'By Binder': [
    'Cationic Emulsion Based',
    'Anionic Emulsion Based',
    'Polymer Modified Emulsion Based',
    'Cutback Asphalt Based',
    'Foamed Bitumen Based',
    'Bio Based or Sustainable Binder Based',
  ],
  'By Setting or Curing Type': [
    'Rapid Setting Cold Mix',
    'Medium Setting Cold Mix',
    'Slow Setting Cold Mix',
    'Long Workability Stockpile Mix',
    'All Weather Cold Mix',
  ],
  'By Application': [
    'Pothole Repair',
    'Patch Repair',
    'Utility Cut Reinstatement',
    'Shoulder Repair',
    'Edge Repair',
    'Surface Restoration',
    'Pavement Rehabilitation',
    'Low Volume Road Construction',
    'Temporary Road Surfacing',
    'Parking Lot Repair',
    'Airport Pavement Repair',
    'Industrial Yard Repair',
  ],
  'By Distribution Channel': ['Direct Sales', 'Indirect Sales (via Distributors)'],
  'By End User': [
    'Government or Municipal Authorities',
    'Infrastructure & Government Projects',
    'Construction Companies or Contractors',
    'Commercial & Industrial Sector',
    'Real Estate Developers',
    'Others',
  ],
}

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

function buildSeries(geo, stype, seg, isVolume) {
  const geoIdx = geographies.indexOf(geo)
  const base = isVolume
    ? 8000 + (hash(geo + stype + seg) % 12000) + geoIdx * 1500
    : 12 + (hash(geo + stype + seg) % 55) + geoIdx * 4
  const out = {}
  let v = base
  for (const y of years) {
    const growth = 1.042 + (y - 2021) * 0.0065 + (hash(seg + y) % 7) / 1000
    v = v * growth + (isVolume ? (hash(String(y) + geo) % 200) : (hash(String(y) + geo) % 3) * 0.2)
    out[String(y)] = isVolume ? Math.round(v) : Math.round(v * 10) / 10
  }
  return out
}

function buildValueJson(isVolume) {
  const root = {}
  for (const geo of geographies) {
    root[geo] = {}
    for (const [stype, segments] of Object.entries(segmentTypes)) {
      root[geo][stype] = {}
      for (const seg of segments) {
        root[geo][stype][seg] = buildSeries(geo, stype, seg, isVolume)
      }
    }
  }
  return root
}

function buildSegmentationJson() {
  const root = {}
  for (const geo of geographies) {
    root[geo] = {}
    for (const [stype, segments] of Object.entries(segmentTypes)) {
      root[geo][stype] = {}
      for (const seg of segments) {
        root[geo][stype][seg] = {}
      }
    }
  }
  return root
}

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(path.join(OUT_DIR, 'value.json'), JSON.stringify(buildValueJson(false), null, 2))
fs.writeFileSync(path.join(OUT_DIR, 'volume.json'), JSON.stringify(buildValueJson(true), null, 2))
fs.writeFileSync(path.join(OUT_DIR, 'segmentation_analysis.json'), JSON.stringify(buildSegmentationJson(), null, 2))
console.log('Wrote value.json, volume.json, segmentation_analysis.json to', OUT_DIR)
