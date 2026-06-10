import { getRawDashboardSheets } from '../utils/googleSheet';

export default defineEventHandler(async () => {
  return getRawDashboardSheets();
});
