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

const OT_SPREADSHEET_ID = process.env.GOOGLE_OT_SHEET_ID || '1ucCTBZBLF8tkTWyuIE46_aRx0vUwen382wWokuR55UQ';
const OT_SHEET_ID = Number(process.env.GOOGLE_OT_SHEET_ID_NUM || 2120946153);

async function getSheetTitleById(client: ReturnType<typeof getSheetsClient>, spreadsheetId: string, sheetId: number) {
  const metadata = await client.sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets(properties(sheetId,title))',
  });
  const sheet = metadata.data.sheets?.find(item => item.properties?.sheetId === sheetId);
  return sheet?.properties?.title || '';
}

function quoteSheetName(sheetName: string) {
  return `'${sheetName.replace(/'/g, "''")}'`;
}

export async function getRawDashboardSheets() {
  const client = getSheetsClient();
  const otSummaryTitle = await getSheetTitleById(client, OT_SPREADSHEET_ID, OT_SHEET_ID);

  const [dashboardRes, infoRes, otSummaryRes, otCheckErrorRes] = await Promise.all([
    client.sheets.spreadsheets.values.get({
      spreadsheetId: client.sheetId,
      range: "'Dashboard W10 All'!A1:CZ1000",
    }),
    client.sheets.spreadsheets.values.get({
      spreadsheetId: client.sheetId,
      range: "'Dashboard W10 All info'!A1:CZ5000",
    }),
    client.sheets.spreadsheets.values.get({
      spreadsheetId: OT_SPREADSHEET_ID,
      range: `${quoteSheetName(otSummaryTitle)}!A1:AP1000`,
    }),
    client.sheets.spreadsheets.values.get({
      spreadsheetId: OT_SPREADSHEET_ID,
      range: `${quoteSheetName(process.env.GOOGLE_OT_CHECK_ERROR_SHEET_TITLE || 'Check OT Error')}!A1:AP1000`,
    }),
  ]);

  return {
    dashboard: dashboardRes.data.values || [],
    info: infoRes.data.values || [],
    otSummary: otSummaryRes.data.values || [],
    otCheckError: otCheckErrorRes.data.values || [],
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
