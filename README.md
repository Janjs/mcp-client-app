# MCP Client Application

A desktop application for interacting with AI models via the Model Context Protocol (MCP), providing a powerful interface for chat conversations with tool execution capabilities.

## What is MCP?

The Model Context Protocol (MCP) is a standardized communication protocol that enables AI models to request execution of tools and functions with user confirmation. This creates a secure and transparent environment for AI assistants to interact with your system while maintaining user control.

## Features

- 🤖 **Multi-model support**: Connect to Claude, GPT, and other LLMs through a unified interface
- 🔧 **Tool execution**: Allow AI models to perform actions through a secure permission system
- 🔄 **Real-time streaming**: Experience fluid conversations with streaming responses
- 🔌 **Server management**: Register, configure and connect to MCP servers
- 💾 **Conversation history**: Save and revisit your chat sessions
- 🔐 **Secure vault**: Store sensitive information like API keys safely

## Why Use MCP Client?

MCP Client demonstrates how to create applications that leverage the full potential of modern AI systems while maintaining appropriate security boundaries. It serves as both a practical tool and a learning resource for developers interested in building applications with AI capabilities.

## Getting Started

### Prerequisites

- Node.js 18+
- npm package manager

### Installation

```bash
# Clone the repository
git clone git@github.com:RegiByte/mcp-client-app.git
cd mcp-client-app

# Install dependencies
npm install

# Start the development server
npm dev
```

### Building for Production

```bash
# For Windows
npm build:win

# For macOS
npm build:mac

# For Linux
npm build:linux
```

## Using the Application

### Starting a Conversation

1. Open the application
2. Navigate to the conversations page
3. Click on "New conversation"
4. Start chatting!

### Working with Tools

When an AI assistant needs to perform an action:

1. You'll see a tool execution request in the chat
2. Review the requested action and parameters
3. Approve or deny the request
4. See the results integrated back into the conversation

## Architecture Overview

The MCP Client App is built with:

- **Electron**: For cross-platform desktop capabilities
- **React**: For the user interface
- **TypeScript**: For type-safe code
- **Vercel AI SDK**: For standardized AI model interactions
- **Model Context Protocol**: For secure and standardized tool execution

The application uses a driver pattern to support multiple LLM providers while maintaining a consistent interface.

## Learning Resources

- [MCP Protocol Documentation](https://modelcontextprotocol.github.io/)
- [Vercel AI SDK Guide](https://sdk.vercel.ai/docs)
- [Building MCP-enabled Applications](https://yourwebsite.com/tutorials)
- [Tool Development Guide](https://yourwebsite.com/tool-guide)

## Contributing

We welcome contributions to the MCP Client App! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- The Anthropic team for Claude and MCP
- Vercel for the AI SDK
- The Electron community for the application framework

---

_Project maintained by [@RegiByte](https://github.com/RegiByte). For support, open an issue on the repository._
