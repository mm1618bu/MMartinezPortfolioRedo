import axios from 'axios';

const API_URL = 'mongodb+srv://mmartinez16181:Ma3el683!@packagehandling.vabfw.mongodb.net/api/shifts';

export const getShifts = () => axios.get(API_URL);
export const createShift = (shiftData) => axios.post(API_URL, shiftData);
export const assignShift = (shiftId, assignedTo) => axios.patch(`${API_URL}/${shiftId}`, { assignedTo });
