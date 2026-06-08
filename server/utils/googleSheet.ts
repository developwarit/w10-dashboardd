import { google } from 'googleapis';
import { requireServerEnv } from './env';

function sanitizePrivateKey(privateKey: string) {
  let key = privateKey.replace(/^"(.*)"$/, '$1');
  const keyStart = key.indexOf('-----BEGIN PRIVATE KEY-----');

  if (keyStart !== -1) {
    key = key.substring(keyStart);
  }

  return key.replace(/\\n/g, '\n');
}

function getSheetsClient() {
  const auth = new google.auth.JWT({
    email: requireServerEnv('GOOGLE_CLIENT_EMAIL'),
    key: sanitizePrivateKey(requireServerEnv('GOOGLE_PRIVATE_KEY')),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return {
    sheetId: requireServerEnv('GOOGLE_SHEET_ID'),
    sheets: google.sheets({ version: 'v4', auth }),
  };
}

export async function getRawDashboardSheets() {
  const client = getSheetsClient();

  const [dashboardRes, infoRes] = await Promise.all([
    client.sheets.spreadsheets.values.get({
      spreadsheetId: client.sheetId,
      range: "'Dashboard W10 All'!A1:CZ1000",
    }),
    client.sheets.spreadsheets.values.get({
      spreadsheetId: client.sheetId,
      range: "'Dashboard W10 All info'!A1:CZ5000",
    }),
  ]);

  return {
    dashboard: dashboardRes.data.values || [],
    info: infoRes.data.values || [],
  };
}

export async function updateDashboardFilters(year: string, month: string) {
  const client = getSheetsClient();

  await client.sheets.spreadsheets.values.update({
    spreadsheetId: client.sheetId,
    range: "'Dashboard W10 All info'!C2:C3",
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[year === 'all' ? 'All' : year], [month === 'all' ? 'รวมทุกเดือน' : month]],
    },
  });
}
