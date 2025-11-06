<div align="center">

# 🚀 Azure Functions Node.js Monorepo

### *Enterprise-Grade Tools & Extensions for Azure Functions V4*

[Features](#-features) • [Projects](#-projects) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 🌟 Features

This monorepo brings together cutting-edge tools and libraries that supercharge your Azure Functions development experience:

- ✨ **Type-Safe APIs** - Full TypeScript support with automatic type inference
- 📚 **Auto-Generated Documentation** - OpenAPI/Swagger specs generated from your code
- 🔒 **Built-in Security** - Multiple authentication strategies out of the box
- 🎯 **Developer Experience** - Intuitive APIs that feel natural and productive
- ⚡ **Production Ready** - Battle-tested code designed for enterprise use
- 🔧 **Extensible** - Plugin architecture for custom integrations

---

## 📦 Projects

### [@apvee/azure-functions-openapi](./packages/azure-functions-openapi)

> **Version 2.0** - A complete rewrite with improved TypeScript support, automatic type inference, and enhanced Azure integration.

![Apvee Azure Functions OpenAPI v2](https://raw.githubusercontent.com/apvee/azure-functions-nodejs-monorepo/main/packages/azure-functions-openapi/assets/apvee-azure-functions-openapi-v2.png)

#### 📖 Overview

A powerful extension for **Azure Functions V4** that automatically generates and serves OpenAPI documentation for your serverless APIs. Built on top of `@asteasolutions/zod-to-openapi` and leveraging **Zod schemas** for validation, it ensures your API is always type-safe, well-documented, and easy to explore.

#### ✨ Key Features

- 🎯 **Zero Configuration** - Works out of the box with sensible defaults
- 📝 **Automatic OpenAPI Generation** - Generate specs from your function definitions
- 🔍 **Interactive Swagger UI** - Explore and test APIs directly in the browser
- 🛡️ **Multiple Auth Strategies** - Support for API keys, Bearer tokens, OAuth2, and more
- 🎨 **Customizable** - Full control over your OpenAPI specification
- 📊 **Zod Integration** - Leverage Zod for runtime validation and type safety

[📚 Full Documentation](./packages/azure-functions-openapi/README.md)

---

### [test-functions](./packages/test-functions)

#### 📖 Overview

A comprehensive **sample application** demonstrating the usage of the OpenAPI library with a complete Todo API implementation. This project serves as both a working example and a testbed for the OpenAPI library.

#### 🎯 What's Inside

- ✅ **Complete CRUD Operations** - Full Todo API with Create, Read, Update, Delete
- 🔐 **Security Examples** - Multiple authentication strategies implemented
- 📝 **Best Practices** - Production-ready code structure and patterns
- 🧪 **Real-World Scenarios** - Webhook handlers, batch operations, and more
- 📚 **Learning Resource** - Well-commented code to help you get started

[📚 View Examples](./packages/test-functions/src/functions)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **Azure Functions Core Tools** v4
- **TypeScript** 5.0 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/apvee/azure-functions-nodejs-monorepo.git
cd azure-functions-nodejs-monorepo

# Install dependencies
npm install

# Build all packages
npm run build
```

### Running the Example

```bash
# Navigate to the test functions
cd packages/test-functions

# Start the Azure Functions runtime
npm start

# Access the Swagger UI at
# http://localhost:7071/api/docs
```

---

## 📚 Documentation

Each project contains detailed documentation in its respective directory:

- [**@apvee/azure-functions-openapi**](./packages/azure-functions-openapi/README.md) - Complete API reference and guides
- [**test-functions**](./packages/test-functions/README.md) - Sample code and usage examples

---

## 🛠️ Development

This monorepo uses a modern development setup:

- **Package Manager**: npm workspaces
- **Language**: TypeScript 5.0+
- **Build Tool**: Native TypeScript compiler
- **Runtime**: Azure Functions V4 (Node.js 18+)

### Project Structure

```
azure-functions-nodejs-monorepo/
├── packages/
│   ├── azure-functions-openapi/    # Main OpenAPI library
│   └── test-functions/              # Example implementation
├── package.json                      # Workspace configuration
└── README.md                         # This file
```

---

## 🤝 Contributing

We welcome contributions! Whether it's:

- 🐛 Bug reports
- 💡 Feature requests
- 📝 Documentation improvements
- 🔧 Code contributions

Please feel free to open an issue or submit a pull request.

### Development Workflow

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📋 Roadmap

We're constantly working to improve this monorepo. Here's what's coming:

- 🔄 **More Packages** - Additional tools and utilities for Azure Functions
- 🧪 **Testing Utilities** - Helpers for testing Azure Functions
- 📊 **Monitoring Integration** - Application Insights helpers
- 🔌 **Additional Integrations** - Support for more Azure services
- 📖 **Enhanced Documentation** - Video tutorials and interactive guides

**Stay tuned - more projects will be added soon!**

---

## 📄 License

This project is licensed under the MIT License - see the individual package LICENSE files for details.

---

## 💬 Support

- 📧 **Issues**: [GitHub Issues](https://github.com/apvee/azure-functions-nodejs-monorepo/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/apvee/azure-functions-nodejs-monorepo/discussions)
- 📖 **Documentation**: [Full Docs](./packages/azure-functions-openapi/README.md)

---

<div align="center">

**Built with ❤️ by the Apvee Team**

</div>
