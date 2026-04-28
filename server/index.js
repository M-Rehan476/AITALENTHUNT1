import express from 'express';
import cors from 'cors';
import { initDatabase } from './database.js';
import routes from './routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'], credentials: true }));
app.use(express.json());

app.use('/api', routes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

initDatabase().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
