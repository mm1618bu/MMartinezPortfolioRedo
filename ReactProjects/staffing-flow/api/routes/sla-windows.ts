import { Router } from 'express';
import { slaWindowService } from '../services/sla-window.service';
import { createSLAWindowSchema, updateSLAWindowSchema } from '../schemas/sla-window.schema';
import { validateQuery, validateBody } from '../middleware/validation.middleware';

const router = Router();

/**
 * GET /api/sla-windows
 * Get all SLA windows with optional filtering
 */
router.get('/', validateQuery, async (req, res) => {
  try {
    const query = (req as any).validatedQuery;
    const windows = await slaWindowService.getAll(query);
    res.json(windows);
  } catch (error: any) {
    console.error('Error fetching SLA windows:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/sla-windows/:id
 * Get a single SLA window by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const window = await slaWindowService.getById(req.params.id);
    res.json(window);
  } catch (error: any) {
    console.error('Error fetching SLA window:', error);
    res.status(404).json({ error: 'SLA window not found' });
  }
});

/**
 * POST /api/sla-windows
 * Create a new SLA window
 */
router.post('/', validateBody(createSLAWindowSchema), async (req, res) => {
  try {
    const validatedData = (req as any).validatedBody;
    const window = await slaWindowService.create(validatedData);
    res.status(201).json(window);
  } catch (error: any) {
    console.error('Error creating SLA window:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/sla-windows/:id
 * Update an SLA window
 */
router.put('/:id', validateBody(updateSLAWindowSchema), async (req, res) => {
  try {
    const validatedData = (req as any).validatedBody;
    const window = await slaWindowService.update(req.params.id, validatedData);
    res.json(window);
  } catch (error: any) {
    console.error('Error updating SLA window:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/sla-windows/:id
 * Delete an SLA window
 */
router.delete('/:id', async (req, res) => {
  try {
    await slaWindowService.delete(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting SLA window:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
