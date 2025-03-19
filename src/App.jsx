import { useState } from 'react'

import './App.css'
import ChatTest from './components/ChatTest'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        Welcome to DMS
        <ChatTest/>
       </div>
    </>
  )
}

export default App
