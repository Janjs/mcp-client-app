# MCP Client Application

An Electron application with React and TypeScript for interacting with LLMs (like Claude) via AI SDK and Model Context Protocol (MCP).

## Architecture

The application is structured with several key components:

### LLM Provider System

The LLM interaction is modularized with these components:

- `BaseLlmProvider`: Abstract base class implementing common LLM functionality
- `ClaudeLlmProvider`: Concrete implementation for Claude using AI SDK
- `LlmProviderFactory`: Factory for creating LLM providers

### Tool Provider System

Tool interactions are modularized with:

- `BaseToolProvider`: Abstract base class for tool providers
- `McpToolProvider`: MCP-specific tool provider implementation
- `ToolRegistry`: Central registry that manages all tool providers

### Communication

- Electron IPC for main/renderer process communication
- Event-based system for UI updates

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

### Build

```bash
# For windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```
