import { Router } from 'express';
import {
  runTestsHandler,
  getTestStatusHandler,
  getTestLogsHandler,
  downloadExcelReportHandler
} from '../controllers/testRunnerController';

const router = Router();

router.post('/run', runTestsHandler);
router.get('/status', getTestStatusHandler);
router.get('/logs', getTestLogsHandler);
router.get('/download-excel', downloadExcelReportHandler);

export default router;
