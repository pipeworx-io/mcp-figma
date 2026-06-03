interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Figma MCP Pack
 *
 * Requires OAuth connection — gateway injects credentials via _context.figma.
 * Read-only access to Figma design files and comments via the Figma REST API v1.
 * Tools: get current user, get a design file summary, list comments, get file nodes, render node images.
 */


interface FigmaContext {
  figma?: { accessToken: string };
}

const API = 'https://api.figma.com/v1';

/**
 * Fetch helper for the Figma REST API.
 * - Returns { error: 'connection_required' } when no OAuth token is present.
 * - Returns { error: <status>, message: <body text> } on non-2xx responses.
 * - Otherwise returns the parsed JSON body.
 */
async function fFetch(
  ctx: FigmaContext,
  url: string,
  options: RequestInit = {},
): Promise<unknown> {
  if (!ctx.figma) {
    return {
      error: 'connection_required',
      message: 'Connect your Figma account at https://pipeworx.io/account',
    };
  }
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${ctx.figma.accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    return { error: res.status, message: text };
  }
  return res.json();
}

const tools: McpToolExport['tools'] = [
  {
    name: 'get_me',
    description:
      'Get the signed-in Figma user: id, email, handle, and avatar image URL. Use to identify whose Figma account is connected.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_file',
    description:
      'Get a compact summary of a Figma design file by its file key: name, last modified time, version, editor type, role, thumbnail URL, and the list of top-level pages (id, name, type, child count). Use to understand the structure of a Figma design file without fetching the full node tree.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        file_key: {
          type: 'string',
          description: 'The Figma file key (the segment after /file/ or /design/ in a Figma URL).',
        },
        depth: {
          type: 'number',
          description: 'How many levels of the document tree to traverse (default 2). Lower values return less data.',
        },
      },
      required: ['file_key'],
    },
  },
  {
    name: 'list_comments',
    description:
      'List comments on a Figma design file. Returns each comment\'s id, message, author handle, created time, and resolved time. Use to review feedback and discussion on a design.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        file_key: {
          type: 'string',
          description: 'The Figma file key (the segment after /file/ or /design/ in a Figma URL).',
        },
      },
      required: ['file_key'],
    },
  },
  {
    name: 'get_file_nodes',
    description:
      'Get specific nodes from a Figma design file by their node ids. Returns a compact map of node id to { name, type }. Use to inspect particular frames, components, or layers within a design file.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        file_key: {
          type: 'string',
          description: 'The Figma file key (the segment after /file/ or /design/ in a Figma URL).',
        },
        node_ids: {
          type: 'string',
          description: 'Comma-separated list of node ids to retrieve (e.g. "1:2,1:3").',
        },
      },
      required: ['file_key', 'node_ids'],
    },
  },
  {
    name: 'get_file_images',
    description:
      'Render images of specific nodes in a Figma design file. Returns a map of node id to a rendered image URL. Use to get visual previews (PNG, SVG, or JPG) of frames, components, or layers from a design.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        file_key: {
          type: 'string',
          description: 'The Figma file key (the segment after /file/ or /design/ in a Figma URL).',
        },
        node_ids: {
          type: 'string',
          description: 'Comma-separated list of node ids to render (e.g. "1:2,1:3").',
        },
        format: {
          type: 'string',
          enum: ['png', 'svg', 'jpg'],
          description: 'Image output format (default "png").',
        },
        scale: {
          type: 'number',
          description: 'Image scale factor, 0.01–4 (default 1).',
        },
      },
      required: ['file_key', 'node_ids'],
    },
  },
];

interface FigmaPage {
  id?: string;
  name?: string;
  type?: string;
  children?: unknown[];
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const context = (args._context ?? {}) as FigmaContext;
  delete args._context;

  switch (name) {
    case 'get_me': {
      const result = await fFetch(context, `${API}/me`);
      const u = result as { id?: string; email?: string; handle?: string; img_url?: string };
      if (u && typeof u === 'object' && !('error' in u)) {
        return { id: u.id, email: u.email, handle: u.handle, img_url: u.img_url };
      }
      return result;
    }
    case 'get_file': {
      const fileKey = args.file_key as string;
      const depth = (args.depth as number) ?? 2;
      const result = await fFetch(
        context,
        `${API}/files/${encodeURIComponent(fileKey)}?depth=${depth}`,
      );
      const f = result as {
        name?: string;
        lastModified?: string;
        version?: string;
        editorType?: string;
        role?: string;
        thumbnailUrl?: string;
        document?: { children?: FigmaPage[] };
      };
      if (f && typeof f === 'object' && !('error' in f)) {
        return {
          name: f.name,
          lastModified: f.lastModified,
          version: f.version,
          editorType: f.editorType,
          role: f.role,
          thumbnailUrl: f.thumbnailUrl,
          pages: (f.document?.children || []).map((p) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            childCount: (p.children || []).length,
          })),
        };
      }
      return result;
    }
    case 'list_comments': {
      const fileKey = args.file_key as string;
      const result = await fFetch(
        context,
        `${API}/files/${encodeURIComponent(fileKey)}/comments`,
      );
      const r = result as {
        comments?: Array<{
          id?: string;
          message?: string;
          user?: { handle?: string };
          created_at?: string;
          resolved_at?: string;
        }>;
      };
      if (r && typeof r === 'object' && !('error' in r) && Array.isArray(r.comments)) {
        return {
          comments: r.comments.map((c) => ({
            id: c.id,
            message: c.message,
            user: c.user?.handle,
            created_at: c.created_at,
            resolved_at: c.resolved_at,
          })),
        };
      }
      return result;
    }
    case 'get_file_nodes': {
      const fileKey = args.file_key as string;
      const nodeIds = args.node_ids as string;
      const result = await fFetch(
        context,
        `${API}/files/${encodeURIComponent(fileKey)}/nodes?ids=${encodeURIComponent(nodeIds)}`,
      );
      const r = result as {
        nodes?: Record<string, { document?: { name?: string; type?: string } }>;
      };
      if (r && typeof r === 'object' && !('error' in r) && r.nodes) {
        const compact: Record<string, { name?: string; type?: string }> = {};
        for (const [id, n] of Object.entries(r.nodes)) {
          compact[id] = { name: n.document?.name, type: n.document?.type };
        }
        return compact;
      }
      return result;
    }
    case 'get_file_images': {
      const fileKey = args.file_key as string;
      const nodeIds = args.node_ids as string;
      const format = (args.format as string) ?? 'png';
      const scale = (args.scale as number) ?? 1;
      const result = await fFetch(
        context,
        `${API}/images/${encodeURIComponent(fileKey)}?ids=${encodeURIComponent(nodeIds)}&format=${encodeURIComponent(format)}&scale=${scale}`,
      );
      const r = result as { images?: Record<string, string>; err?: unknown };
      if (r && typeof r === 'object' && !('error' in r)) {
        return { images: r.images, err: r.err };
      }
      return result;
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export default { tools, callTool, meter: { credits: 1 }, provider: 'figma' } satisfies McpToolExport;
