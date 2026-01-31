import { Router } from 'express';
import { staffingBufferService } from '../services/staffing-buffer.service';
import { createStaffingBufferSchema, updateStaffingBufferSchema } from '../schemas/staffing-buffer.schema';
import { validateQuery, validateBody } from '../middleware/validation.middleware';

const router = Router();

/**
 * GET /api/staffing-buffers
 * Get all staffing buffers with optional filtering
 */
router.get('/', validateQuery, async (req, res) => {
  try {
    const query = (req as any).validatedQuery;
    const buffers = await staffingBufferService.getAll(query);
    res.json(buffers);
  } catch (error: any) {
    console.error('Error fetching staffing buffers:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/staffing-buffers/:id
 * Get a single staffing buffer by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const buffer = await staffingBufferService.getById(req.params.id);
    res.json(buffer);
  } catch (error: any) {
    console.error('Error fetching staffing buffer:', error);
    res.status(404).json({ error: 'Staffing buffer not found' });
  }
});

/**
 * POST /api/staffing-buffers
 * Create a new staffing buffer
 */
router.post('/', validateBody(createStaffingBufferSchema), async (req, res) => {
  try {
    const validatedData = (req as any).validatedBody;
    const buffer = await staffingBufferService.create(validatedData);
    res.status(201).json(buffer);
  } catch (error: any) {
    console.error('Error creating staffing buffer:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/staffing-buffers/:id
 * Update a staffing buffer
 */
router.put('/:id', validateBody(updateStaffingBufferSchema), async (req, res) => {
  try {
    const validatedData = (req as any).validatedBody;
    const buffer = await staffingBufferService.update(req.params.id, validatedData);
    res.json(buffer);
  } catch (error: any) {
    console.error('Error updating staffing buffer:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/staffing-buffers/:id
 * Delete a staffing buffer
 */
router.delete('/:id', async (req, res) => {
  try {
    await staffingBufferService.delete(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting staffing buffer:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
