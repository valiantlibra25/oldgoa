import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [characters, setCharacters] = useState([])

  useEffect(()=>{
    fetch('/api/onepiece')
    .then((res)=>res.json())
    .then((data)=>setCharacters(data))
    .catch((err)=>console.log(err))
  },[])

  return (
    <>
     <h1>One Piece Crew</h1>
     {characters.length === 0 ?
     (
      <p>Loading...</p>
     )
      :
(

  <ul>
       {characters.map((chars,index)=>(
         <li key={index}> {chars.name}</li>
        ))}
      </ul>
      )
      }
    </>
  )
}

export default App
