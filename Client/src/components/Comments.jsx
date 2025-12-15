import { useEffect, useState, useRef } from "react";
import socketIO from "socket.io-client";
import { useParams } from "react-router-dom";

// Используем переменные окружения Vite
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const socket = socketIO.connect(SOCKET_URL, {
  transports: ['websocket', 'polling'] // Важно для Railway
});

const Comments = () => {
  const { category, id } = useParams();
  const commentRef = useRef(null);
  const [commentList, setCommentList] = useState([]);

  useEffect(() => {
    socket.emit("fetchComments", { category, id });
    
    // Очистка при размонтировании
    return () => {
      socket.off("comments");
    };
  }, [category, id]);

  useEffect(() => {
    socket.on("comments", (data) => setCommentList(data));
    
    return () => {
      socket.off("comments");
    };
  }, []);

  const addComment = (e) => {
    e.preventDefault();
    const commentText = commentRef.current.value;
    socket.emit("addComment", {
      comment: commentText,
      category,
      id,
      userId: localStorage.getItem("userID") || "Anonymous",
    });
    commentRef.current.value = "";
  };

  return (
    <div className="comments__container">
      <form className="comment__form" onSubmit={addComment}>
        <label htmlFor="comment">Add a comment</label>
        <textarea
          placeholder="Type your comment..."
          ref={commentRef}
          rows={5}
          id="comment"
          name="comment"
          required
        ></textarea>
        <button className="commentBtn">ADD COMMENT</button>
      </form>
      <div className="comments__section">
        <h2>Existing Comments</h2>
        {commentList?.map((comment) => (
          <div key={comment.id}>
            <p>
              <span style={{ fontWeight: "bold" }}>{comment.text} </span>by{" "}
              {comment.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Comments;