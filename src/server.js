import express from 'express';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import mongoose from 'mongoose';
// eslint-disable-next-line import/no-extraneous-dependencies
import sockeio from 'socket.io';
import http from 'http';
import * as Notes from './controllers/notes_controler';
// initialize
const app = express();

// enable/disable cross origin resource sharing if necessary
app.use(cors());

// enable/disable http request logging
app.use(morgan('dev'));

// enable only if you want templating
app.set('view engine', 'ejs');

// enable only if you want static assets from folder static
app.use(express.static('static'));

// this just allows us to render ejs from the ../app/views directory
app.set('views', path.join(__dirname, '../src/views'));

// enable json message body for posting data to API
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // To parse the incoming requests with JSON payloads

// additional init stuff should go before hitting the routing

// default index route
app.get('/', (req, res) => {
  res.send('hi');
});

const server = http.createServer(app);
// eslint-disable-next-line import/prefer-default-export
export const io = sockeio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

io.on('connetion', (socket) => {
  Notes.getNotes().then((results) => {
    socket.emit('notes', results);
  });
});

const pushNotes = () => {
  Notes.getNotes().then((result) => {
    io.socket.emit('notes', result);
  });
};

// when craetign a note, broadcast the message into socket
io.on('createNote', (fields) => {
  Notes.createNote(fields).then(
    pushNotes(),
  ).catch((Error) => {
    console.log(Error.message);
  });
});

// START THE SERVER
// =============================================================================
async function startServer() {
  try {
    const MONGO_URL = process.env.MONGO_URI || 'mongodb://localhost/notes';
    await mongoose.connect(MONGO_URL);
    // setting the promises to the ES6 Promises
    mongoose.Promise = global.Promise;
    const port = process.env.PORT || 9090;
    server.listen(port);

    console.log(`Listening on port ${port}`);
  } catch (error) {
    console.error(error);
  }
}

startServer();
