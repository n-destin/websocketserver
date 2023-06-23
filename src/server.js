import express from 'express';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import mongoose from 'mongoose';
import socketio from 'socket.io'
import http from 'http'
import * as Notes from './contollers/note_controller'
import throttle from 'lodash.throttle';
import debounce from 'lodash.debounce';



// initialize
const app = express();
const server = http.createServer(app); // setting up a http server using http module from Node.js

const io = socketio(server, { 
  cors :{
    origin : "*", // allow requests from anywhere
    METHODS: ['GET', 'POST', 'PUT', 'DELETE']
  }
})

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

//broadcasting notes to everyone


//craete a new socket on connection, and emit the notes

//



io.on('connection', (socket)=>{

  let emitToSelf  = (notes)=>{
    socket.emit('notes', notes);
  }

  emitToSelf = debounce(emitToSelf, 200);

  let emitToOthers = (notes)=>{
    socket.broadcast.emit('notes', notes);
  }

  emitToOthers = throttle(emitToOthers, 25);

  Notes.getNotes().then(notes=>{
    socket.emit('notes', notes);
  })

  const pushNotesSmoothly = () => {
    Notes.getNotes().then((result) => {
      emitToSelf(result);
      emitToOthers(result);
    });
  };

  function pushNotes(){
    Notes.getNotes().then(notes=>{
      io.sockets.emit('notes', notes);
    })
  }
  socket.on('createNote', (note)=>{
    console.log('called to create' + note);
    Notes.createNote(note).then((result)=>{
      pushNotes();
    }).catch(error=>{
      console.log('Failed to create a note' + error.message);
    })
  })

  socket.on('updateNote', (id, fields)=>{
    console.log('listened to update');
    Notes.updateNote(id, fields).then(()=>{
      if(!fields.content){
        pushNotesSmoothly();
      } else{
        pushNotes();
      }
    })
  })

  socket.on('deleteNote', (id)=>{
    Notes.deleteNote(id).then(()=>{
      pushNotes();
    })
  })


})




// START THE SERVER
// =============================================================================
async function startServer() {
  try {
    const port = process.env.PORT || 9090;
    server.listen(port);
    // connect mongoose
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost/notes'
    mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    mongoose.Promise = global.Promise;
    console.log('mogoose connected successfuly');
    console.log(`Listening on port ${port}`);
  } catch (error) {
    console.error(error);
  }
}

startServer();
