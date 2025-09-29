import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import JSZip from 'jszip';
// TODO: Update export/import to work with Firestore instead of SQLite
// import { getAssessmentDetails, listAssessments, upsertAssessmentWithDefectFromImport } from './db';

const photosDir = FileSystem.documentDirectory! + 'photos/';
const dbPath = FileSystem.documentDirectory! + 'SQLite/asset_audit.db';

function csvEscape(s: string) {
  const needs = s.includes(',') || s.includes('\n') || s.includes('"');
  const out = s.replace(/"/g, '""');
  return needs ? `"${out}"` : out;
}

async function fileExists(uri: string) {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return !!info.exists;
  } catch {
    return false;
  }
}

export async function exportZip() {
  throw new Error('Export functionality is temporarily disabled. The app has been migrated from SQLite to Firestore. Export/import features will be updated in a future version.');
  const rows = await listAssessments();
  const zip = new JSZip();

  // CSV header
  const header = ['id','created_at','latitude','longitude','category','element','condition','priority','notes','photo_filename'];
  const lines: string[] = [header.join(',')];

  for (const r of rows) {
    const d = await getAssessmentDetails(r.id);
    const notes = d?.notes ?? '';
    const photoFilename = r.photo_uri.split('/').pop() || `${r.id}.jpg`;
    lines.push([
      r.id,
      String(r.created_at),
      r.latitude == null ? '' : String(r.latitude),
      r.longitude == null ? '' : String(r.longitude),
      csvEscape(r.category),
      csvEscape(r.element),
      String(r.condition),
      String(r.priority),
      csvEscape(notes),
      photoFilename,
    ].join(','));

    // Add photo
    if (await fileExists(r.photo_uri)) {
      const b64 = await FileSystem.readAsStringAsync(r.photo_uri, { encoding: FileSystem.EncodingType.Base64 });
      zip.file(`photos/${photoFilename}`, b64, { base64: true });
    }
  }

  zip.file('assessments.csv', lines.join('\n'));

  // Include DB file if present
  if (await fileExists(dbPath)) {
    const b64db = await FileSystem.readAsStringAsync(dbPath, { encoding: FileSystem.EncodingType.Base64 });
    zip.file('db/asset_audit.db', b64db, { base64: true });
  }

  const b64zip = await zip.generateAsync({ type: 'base64' });
  const outPath = FileSystem.cacheDirectory! + `asset-audit-export-${Date.now()}.zip`;
  await FileSystem.writeAsStringAsync(outPath, b64zip, { encoding: FileSystem.EncodingType.Base64 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(outPath, { mimeType: 'application/zip', dialogTitle: 'Share Asset Audit Export' });
  }

  return outPath;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let i = 0, field = '', inQuotes = false; const cur: string[] = [];
  while (i < text.length) {
    const ch = text[i++];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { cur.push(field); field = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i] === '\n') i++;
        if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push([...cur]); cur.length = 0; field=''; }
      } else field += ch;
    }
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
  return rows;
}

export async function importZip() {
  throw new Error('Import functionality is temporarily disabled. The app has been migrated from SQLite to Firestore. Export/import features will be updated in a future version.');
  const pick = await DocumentPicker.getDocumentAsync({ type: 'application/zip' });
  if (pick.canceled || !pick.assets?.length) return false;
  const uri = pick.assets[0].uri;

  const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const zip = await JSZip.loadAsync(b64, { base64: true });

  const csvFile = zip.file('assessments.csv');
  if (!csvFile) throw new Error('assessments.csv not found in ZIP');
  const csvText = await csvFile.async('string');
  const rows = parseCsv(csvText);
  const [header, ...data] = rows;

  const idx = (name: string) => header.indexOf(name);
  for (const r of data) {
    if (!r.length) continue;
    const id = r[idx('id')];
    const created_at = Number(r[idx('created_at')] || Date.now());
    const latitude = r[idx('latitude')] ? Number(r[idx('latitude')]) : null;
    const longitude = r[idx('longitude')] ? Number(r[idx('longitude')]) : null;
    const category = r[idx('category')] || '';
    const element = r[idx('element')] || '';
    const condition = Number(r[idx('condition')] || 0);
    const priority = Number(r[idx('priority')] || 0);
    const notes = r[idx('notes')] || '';
    const photo_filename = r[idx('photo_filename')] || `${id}.jpg`;

    // Write photo from zip
    const photoEntry = zip.file(`photos/${photo_filename}`);
    let dest = photosDir + photo_filename;
    if (photoEntry) {
      const pB64 = await photoEntry.async('base64');
      await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true }).catch(() => {});
      await FileSystem.writeAsStringAsync(dest, pB64, { encoding: FileSystem.EncodingType.Base64 });
    }

    await upsertAssessmentWithDefectFromImport({
      id, created_at, latitude, longitude, category, element, condition, priority, notes, photo_uri: dest,
    });
  }

  return true;
}

