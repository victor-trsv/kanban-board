import AddTask from "./AddTask.jsx";
import TasksContainer from "./TaskContainer.jsx";
import Nav from "./Nav.jsx";
import socketIO from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const socket = socketIO.connect(SOCKET_URL, {
  transports: ['websocket', 'polling']
});

const Task = () => {
  return (
    <div>
      <Nav />
      <AddTask socket={socket} />
      <TasksContainer socket={socket} />
    </div>
  );
};

export default Task;