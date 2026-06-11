import { Router } from 'express';
import { downloadPDFReport, downloadExcelReport } from '../controllers/reportController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/pdf', protect, downloadPDFReport);
router.get('/excel', protect, downloadExcelReport);

export default router;
