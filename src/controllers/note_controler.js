import Note from '../models/note';

export async function createNote(noteContent) {
  const newNote = new Note();
  newNote.title = noteContent.title;
  newNote.text = noteContent.text;
  newNote.x = noteContent.x;
  newNote.y = noteContent.y;
  newNote.zIndex = noteContent.zIndex;
  return newNote.save();
}

export async function getNote(id) {
  const note = await Note.findById(id);
  if (!note) throw new Error('there is no such note');
  return note;
}

export async function getNotes() {
  const notes = Note.find();
  return notes;
}

export async function updateNote(id, updateContent) {
  const note = await Note.findById(id);
  if (!note) throw new Error('there is no such note');
  Object.keys(updateContent).forEach((key) => {
    note[key] = updateContent[key];
  });
  return note.save();
}
