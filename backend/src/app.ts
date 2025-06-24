import express from 'express';
import usersRouter from './users/users.controller';
import concertsRouter from './concerts/concerts.controller';
import faceEmbeddingsRouter from './face_embeddings/face_embeddings.controller';
import seatGradesRouter from './seat_grades/seat_grades.controller';
import seatsRouter from './seats/seats.controller';
import ticketsRouter from './tickets/tickets.controller';

const app = express();
app.use(express.json());

app.use('/users', usersRouter);
app.use('/concerts', concertsRouter);
app.use('/face-embeddings', faceEmbeddingsRouter);
app.use('/seat-grades', seatGradesRouter);
app.use('/seats', seatsRouter);
app.use('/tickets', ticketsRouter);

export default app; 