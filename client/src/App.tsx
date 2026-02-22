import './App.css'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from "./components/ui/sonner"

function App({ children }: { children: React.ReactNode }) {

  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        {children}
        <Toaster />
      </ThemeProvider>
    </>
  )
}

export default App
