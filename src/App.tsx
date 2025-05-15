import {Routes, Route} from 'react-router-dom';
import {Home, Post} from './routes';
function App() {

  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/post' element={<Post />} />
    </Routes>
  )
}

export default App
