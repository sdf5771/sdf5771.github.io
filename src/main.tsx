import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './theme'
import { ErrorBoundary } from './components/shared'
import './initialize.css'
import './styles/tokens.css'
import './styles/fonts.css'
import './global.css'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/*
      🔴 가장 바깥입니다. 렌더 중 예외가 여기까지 올라오면 흰 화면 대신 회복
      경로가 있는 화면을 보여 줍니다. Provider·Router 자신이 던지는 경우까지
      덮으려면 그것들보다 바깥이어야 합니다.
      테마는 index.html 의 부트스트랩이 <html data-theme> 를 이미 칠해 두어,
      ThemeProvider 밖에서도 폴백 화면의 색이 정상입니다.
    */}
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
