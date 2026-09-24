# mcp-figma

Figma MCP Pack

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1679+ live data sources.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/figma/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1679+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

This pack runs against a connected figma account, so it needs a Pipeworx key: sign in at https://pipeworx.io/account, connect figma, then call `POST https://gateway.pipeworx.io/v1/tools/figma_get_me` with `Authorization: Bearer <your Pipeworx key>`. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/figma_get_me`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Standalone (no gateway account)

This package also runs as a local stdio MCP server — no Pipeworx account, no
gateway round-trip:

```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-figma"]
    }
  }
}
```

Or run it directly to confirm it starts:

```bash
npx -y @pipeworx/mcp-figma
```

It speaks MCP over stdin/stdout and answers `initialize`/`tools/list`/`tools/call`
for **only** this pack's tools — none of the shared meta-tools the gateway
connection above adds. Same source, same tools, no ask_pipeworx routing.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Figma data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
