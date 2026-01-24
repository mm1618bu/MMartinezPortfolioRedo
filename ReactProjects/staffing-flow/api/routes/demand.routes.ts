import { Router } from 'express';
import multer from 'multer';
import { demandController } from '../controllers/demand.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Configure multer for CSV file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept CSV files only
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// Apply authentication middleware to all routes
router.use(authenticate);

// CSV upload and template routes
router.post('/upload', upload.single('file'), demandController.uploadCSV);
router.get('/template', demandController.downloadTemplate);

// Statistics route
router.get('/statistics', demandController.getStatistics);

// CRUD routes
router.get('/', demandController.getAll);
router.get('/:id', demandController.getById);
router.post('/', demandController.create);
router.put('/:id', demandController.update);
router.delete('/:id', demandController.delete);

export default router;
