import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static('public'));

server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
});
