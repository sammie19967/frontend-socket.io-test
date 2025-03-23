import React from 'react'
import CreatePost from '../components/CreatePost'
import { useAuth } from '../context/AuthContext';


const Sell = () => {
const { user } = useAuth();
  return (
    <div className='sell-container'>
        <CreatePost/>
    </div>
  )
}

export default Sell