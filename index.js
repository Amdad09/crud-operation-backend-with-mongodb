import 'dotenv/config';
import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import { config } from './config.js';

const app = express();
app.use(express.json());

const client = new MongoClient(config.mongoUrl);
await client.connect();
const notes = client.db('noteApps').collection('notes');

app.get('/', (req, res) => {
    res.send('Create a new server');
});
const toObjectId = (id) => (ObjectId.isValid(id) ? new ObjectId(id) : null);
// all notes
app.get('/notes', async (req, res) => {
    const list = await notes.find().sort({ createdAt: -1 }).toArray();
    res.json(list);
});

// read one
app.get('/notes/:id', async (req, res) => {
    const _id = toObjectId(req.params.id);
    if (!_id) return res.status(400).json({ message: 'Invalid id' });
    const note = await notes.findOne({ _id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
});

// create note
app.post('/notes', async (req, res) => {
    const { title, description = '' } = req.body;
    if (!title || typeof title !== 'string')
        return res.status(400).json({ message: 'Title is required!' });
    const note = {
        title: title.trim(),
        description: String(description).trim(),
        createdAt: new Date(),
    };
    const result = await notes.insertOne(note);
    res.status(201).json({ _id: result.insertedId, ...note });
});

// single update
app.patch('/notes/:id', async (req, res) => {
    const _id = toObjectId(req.params.id);
    if (!_id) return res.status(400).json({ message: 'Invalid id' });

    const { title, description } = req.body;
    const updates = {};

    if (title !== undefined) {
        if (typeof title !== 'string' || !title.trim())
            return res
                .status(400)
                .json({ message: 'Title must be a non-empty string' });
        updates.title = title.trim();
    }
    if (description !== undefined) {
        if (typeof description !== 'string')
            return res
                .status(400)
                .json({ message: 'Description must be a string' });
        updates.description = description.trim();
    }
    if (Object.keys(updates).length === 0)
        return res.status(400).json({ message: 'Nothing to update' });

    updates.updatedAt = new Date();

    const updated = await notes.findOneAndUpdate(
        { _id },
        { $set: updates },
        { returnDocument: 'after' },
    );
    if (!updated) return res.status(404).json({ message: 'Note not found' });
    res.json(updated);
});

// update note
app.put('/notes/:id', async (req, res) => {
    const _id = toObjectId(req.params.id);
    if (!_id) return res.status(400).json({ message: 'id is not valid' });
    const { title } = req.body;
    const note = await notes.updateOne(
        { _id },
        { $set: { title: title.trim() } },
    );
    if (note.matchedCount === 0)
        return res.status(404).json({ message: 'Note not found!' });
    res.json({ message: 'Updated!' });
});

// delete one
app.delete('/notes/:id', async (req, res) => {
    const _id = toObjectId(req.params.id);
    if (!_id) return res.status(400).json({ message: 'Id not found!' });
    const note = await notes.deleteOne({ _id });
    if (note.deletedCount === 0)
        return res.status(404).json({ message: 'Note not found!' });
    res.status(204).end();
});

app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).json({ message: 'Something went wrong' });
});

app.listen(config.port, () => {
    console.log(`Server running on ${config.port}`);
});
