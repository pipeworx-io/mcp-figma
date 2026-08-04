# mcp-figma

Figma MCP Pack

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `get_me` | Get the signed-in Figma user: id, email, handle, and avatar image URL. Use to identify whose Figma account is connected. |
| `get_file` | Get a compact summary of a Figma design file by its file key: name, last modified time, version, editor type, role, thumbnail URL, and the list of top-level pages (id, name, type, child count). Use to understand the structure of a Figma design file without fetching the full node tree. |
| `list_comments` | List comments on a Figma design file. Returns each comment's id, message, author handle, created time, and resolved time. Use to review feedback and discussion on a design. |
| `get_file_nodes` | Get specific nodes from a Figma design file by their node ids. Returns a compact map of node id to { name, type }. Use to inspect particular frames, components, or layers within a design file. |
| `get_file_images` | Render images of specific nodes in a Figma design file. Returns a map of node id to a rendered image URL. Use to get visual previews (PNG, SVG, or JPG) of frames, components, or layers from a design. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "figma": {
      "url": "https://gateway.pipeworx.io/figma/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Figma data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
