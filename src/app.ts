import express from 'express';
import teacherRoutes from './routes/teacherRoutes';

const app = express();
app.use(express.json());

// ...existing code...

app.use('/teachers', teacherRoutes);

// ...existing code...

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
