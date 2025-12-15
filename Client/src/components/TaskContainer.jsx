import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TasksContainer = ({ socket }) => {
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTasks(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError("Failed to load tasks. Please try again later.");
        // Можно показать заглушку или сохранить данные из localStorage
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  useEffect(() => {
    const handleTasksUpdate = (data) => {
      setTasks(data);
    };

    socket.on("tasks", handleTasksUpdate);

    return () => {
      socket.off("tasks", handleTasksUpdate);
    };
  }, [socket]);

  const handleDragEnd = ({ destination, source }) => {
    if (!destination) return;
    if (
      destination.index === source.index &&
      destination.droppableId === source.droppableId
    )
      return;

    socket.emit("taskDragged", {
      source,
      destination,
    });
  };

  if (loading) {
    return <div className="loading">Loading tasks...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="container">
      <DragDropContext onDragEnd={handleDragEnd}>
        {Object.entries(tasks).map((task) => (
          <div
            className={`${task[1].title.toLowerCase()}__wrapper`}
            key={task[1].title}
          >
            <h3>{task[1].title} Tasks</h3>
            <div className={`${task[1].title.toLowerCase()}__container`}>
              <Droppable droppableId={task[1].title}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {task[1].items.map((item, index) => (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`${task[1].title.toLowerCase()}__items`}
                          >
                            <p>{item.title}</p>
                            <p className="comment">
                              <Link
                                to={`/comments/${task[1].title}/${item.id}`}
                              >
                                {item.comments && item.comments.length > 0
                                  ? `View Comments (${item.comments.length})`
                                  : "Add Comment"}
                              </Link>
                            </p>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        ))}
      </DragDropContext>
    </div>
  );
};

export default TasksContainer;