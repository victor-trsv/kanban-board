const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;

const http = require("http");
const server = http.createServer(app);
const cors = require("cors");

const { Server } = require("socket.io");

// Безопасная конфигурация CORS для Railway
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.FRONTEND_URL, 
      'https://ваш-проект.up.railway.app',
      'http://localhost:5173'
    ].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

const socketIO = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'] // Важно для Railway
});

// Dummy data
const UID = () => Math.random().toString(36).substring(2, 10);

let tasks = {
  pending: {
    title: "pending",
    items: [
      {
        id: UID(),
        title: "Отправить Ване чертежи",
        comments: [],
      },
    ],
  },
  ongoing: {
    title: "ongoing",
    items: [
      {
        id: UID(),
        title: "Заключить договор с ООО Призм",
        comments: [
          {
            name: "David",
            text: "до 29.12.2025",
            id: UID(),
          },
        ],
      },
    ],
  },
  completed: {
    title: "completed",
    items: [
      {
        id: UID(),
        title: "Приготовить детали",
        comments: [
          {
            name: "Дима",
            text: "Убедитесь, что всё правильно",
            id: UID(),
          },
        ],
      },
    ],
  },
};

app.get("/api", (req, res) => {
  res.json(tasks);
});

// Health check endpoint для Railway
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

socketIO.on("connection", (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);

  socket.on("createTask", (data) => {
    console.log(data);
    const newTask = { id: UID(), title: data, comments: [] };
    tasks["pending"].items.push(newTask);
    socketIO.sockets.emit("tasks", tasks);
  });

  socket.on("addComment", (data) => {
    const taskItems = tasks[data.category].items;
    for (let i = 0; i < taskItems.length; i++) {
      if (taskItems[i].id === data.id) {
        taskItems[i].comments.push({
          name: data.userId,
          text: data.comment,
          id: UID(),
        });
        socket.emit("comments", taskItems[i].comments);
      }
    }
  });

  socket.on("fetchComments", (data) => {
    const { category, id } = data;
    const taskItems = tasks[category].items;

    for (let taskItem of taskItems) {
      if (taskItem.id === id) {
        socket.emit("comments", taskItem.comments);
      }
    }
  });

  socket.on("taskDragged", (data) => {
    const { source, destination } = data;
    const itemMoved = {
      ...tasks[source.droppableId].items[source.index],
    };
    tasks[source.droppableId].items.splice(source.index, 1);
    tasks[destination.droppableId].items.splice(
      destination.index,
      0,
      itemMoved
    );
    socketIO.sockets.emit("tasks", tasks);
  });

  socket.on("disconnect", () => {
    console.log("🔥: A user disconnected");
  });
});

// Обслуживаем статические файлы в production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});