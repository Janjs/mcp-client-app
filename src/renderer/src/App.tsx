import { McpProvider } from './contexts/McpContext'
import Chat from './components/Chat'

function App(): JSX.Element {
  return (
    <McpProvider>
      <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
        <header className="bg-blue-600 text-white p-4 shadow-md">
          <h1 className="text-xl font-bold">MCP Chat Client</h1>
        </header>
        <main className="flex-1 overflow-auto">
          <Chat />
        </main>
        <footer className="bg-gray-100 p-2 text-center text-xs text-gray-500 border-t">
          <p>Powered by Model Context Protocol</p>
        </footer>
      </div>
    </McpProvider>
  )
}

export default App
