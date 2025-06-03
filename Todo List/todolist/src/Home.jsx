import React, { useEffect, useState } from "react";
import Create from "./Create";
import axios from "axios";
import { BsCircleFill, BsFillCheckCircleFill, BsFillTrashFill } from 'react-icons/bs'
import './OnePieceList.css';

function Home() {
    // const [todos, setTodos] = useState([])
    // useEffect(() => {
    //     axios.get('http://localhost:3000/get')
    //         .then(result => setTodos(result.data))
    //         .catch(err => console.log(err))
    // }, [])

    const [characters, setCharacters] = useState([]);

  useEffect(() => {
    fetch('/api/onepiece') // Or full URL if not using a proxy
      .then((res) => res.json())
      .then((data) => setCharacters(data))
      .catch((err) => console.error('Fetch error:', err));
  }, []);






    // const handleEdit = (id) => {
    //     axios.put('http://localhost:3000/update/' + id)
    //         .then(result => location.reload())
    //         .catch(err => console.log(err))
    // }

    // const handleDelete = (id) => {
    //     axios.delete('http://localhost:3000/delete/' + id)
    //         .then(result => location.reload())
    //         .catch(err => console.log(err))
    // }

    return (
        // <div className="home">
        //     <h2>Todo List</h2>
        //     <Create />
        //     {
        //         todos.length === 0
        //             ?
        //             <div><h2>No record</h2></div>
        //             :
        //             todos.map(todo => (
        //                 <div key={todo._id} className="task">
        //                     <div className="checkbox" onClick={() =>handleEdit(todo._id)}>
        //                         {todo.done ? <BsFillCheckCircleFill className="icon"/> :
        //                          <BsCircleFill className="icon" />
        //                         }

        //                         <p className={todo.done ? "line_through" : ""}>
        //                             {todo.task}
        //                         </p>
        //                     </div>
        //                     <div>
        //                     <span><BsFillTrashFill className="icon" onClick={() =>handleDelete(todo._id)}/></span>
        //                     </div>
        //                 </div>
        //             ))
        //     }
        // </div>
       <div className="onepiece-container">
      <h1 className="title">☠️ One Piece Characters ☠️</h1>
      {characters.length === 0 ? (
        <p className="loading">Loading crew...</p>
      ) : (
        <ul className="character-list">
          {characters.map((char, index) => (
            <li key={index} className="character-card">
              🏴‍☠️ {char.name} - {char.role}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Home