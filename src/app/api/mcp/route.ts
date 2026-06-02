import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { listPages, readPage, searchPages, getFunction } from "@/lib/mcp-tools";

const TOOL_DEFS = [
  {
    name: "list_pages",
    description:
      "List every page in the Serotonin Lua API docs. Returns an array of {slug, title, section} records.",
    inputSchema: {
      type: "object" as const,
      properties: {
        locale: {
          type: "string",
          enum: ["en", "ru"],
          default: "en",
          description: "Documentation locale.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "read_page",
    description:
      "Return the full markdown body of one Serotonin Lua API doc page. The slug is the same string returned by list_pages.",
    inputSchema: {
      type: "object" as const,
      properties: {
        slug: { type: "string" },
        locale: { type: "string", enum: ["en", "ru"], default: "en" },
      },
      required: ["slug"],
      additionalProperties: false,
    },
  },
  {
    name: "search_pages",
    description:
      "Substring search across every page. Returns matching pages with a short snippet. Use it to locate the right page before read_page.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string" },
        locale: { type: "string", enum: ["en", "ru"], default: "en" },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "get_function",
    description:
      "Pull just one function's section from a library page (e.g. memory.Read, utility.GetTickCount). library is either a bare name ('memory') or a full slug ('libraries/memory').",
    inputSchema: {
      type: "object" as const,
      properties: {
        library: { type: "string" },
        name: { type: "string" },
        locale: { type: "string", enum: ["en", "ru"], default: "en" },
      },
      required: ["library", "name"],
      additionalProperties: false,
    },
  },
];

function makeServer() {
  const server = new Server(
    { name: "serotonin-ref", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOL_DEFS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    try {
      let result: unknown;
      if (name === "list_pages") result = listPages(args ?? {});
      else if (name === "read_page") result = readPage(args ?? {});
      else if (name === "search_pages") result = searchPages(args ?? {});
      else if (name === "get_function") result = getFunction(args ?? {});
      else throw new Error(`Unknown tool: ${name}`);

      return {
        content: [
          {
            type: "text",
            text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        content: [{ type: "text", text: `Error: ${msg}` }],
        isError: true,
      };
    }
  });

  return server;
}

async function handle(req: Request): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,
  });
  const server = makeServer();
  await server.connect(transport);
  return transport.handleRequest(req);
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}

export async function DELETE(req: Request) {
  return handle(req);
}
