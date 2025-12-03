"use client";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { McpOAuthProvider } from "@/utils/mcp/mcp-oauth-provider";
import { Avatar, AvatarImage } from "../avatar";
import { Card, CardHeader, CardDescription, CardTitle } from "../card";
import { ScrollArea } from "../scroll-area";

const mcps = [
  {
    name: "Aiera",
    description: "Live events, filings, company publications, and more",
    url: "https://mcp-pub.aiera.com/",
  },
  {
    name: "Aura",
    description: "Company intelligence & workforce analytics",
    url: "https://mcp.auraintelligence.com/mcp",
  },
  {
    name: "BioRender",
    description: "Search for and use scientific templates and icons",
    url: "https://mcp.services.biorender.com/mcp",
  },
  {
    name: "Box",
    description: "Search, access and get insights on your Box content",
    url: "https://mcp.box.com",
  },
  {
    name: "Canva",
    description:
      "Search, create, autofill, and export Canva designs from a prompt",
    url: "https://mcp.canva.com/mcp",
  },
  {
    name: "CData Connect AI",
    description: "Connect 270+ enterprise sources to Claude",
    url: "https://mcp.cloud.cdata.com/mcp",
  },
  {
    name: "Chronograph",
    description: "Interact with your Chronograph data directly in Claude",
    url: "https://ai.chronograph.pe/mcp",
  },
  {
    name: "Clockwise",
    description: "Advanced scheduling and time management for work",
    url: "https://mcp.getclockwise.com/mcp",
  },
  {
    name: "Close",
    description: "Securely connect Claude to your Close data",
    url: "https://mcp.close.com/mcp",
  },
  {
    name: "Cloudflare Browser Server",
    description: "Access the Cloudflare Browser Server",
    url: "https://browser.mcp.cloudflare.com/mcp",
  },
  {
    name: "Cloudflare",
    description: "Build applications with compute, storage, and AI",
    url: "https://bindings.mcp.cloudflare.com/mcp",
  },
  {
    name: "Coupler.io",
    description: "Access business data from hundreds of sources",
    url: "https://mcp.coupler.io/mcp",
  },
  {
    name: "Crossbeam",
    description: "Explore partner data and ecosystem insights in Claude",
    url: "https://mcp.crossbeam.com",
  },
  {
    name: "Daloopa",
    description: "Financial fundamental data and KPIs with hyperlinks",
    url: "https://mcp.daloopa.com/server/mcp",
  },
  {
    name: "Day AI",
    description: "Analyze & update CRM records",
    url: "https://day.ai/api/mcp",
  },
  {
    name: "Egnyte",
    description: "Securely access and analyze Egnyte content",
    url: "https://mcp-server.egnyte.com/mcp",
  },
  {
    name: "Fellow.ai",
    description: "Chat with your meetings to uncover actionable insights",
    url: "https://fellow.app/mcp",
  },
  {
    name: "Figma",
    description: "Create better code with Figma context",
    url: "https://mcp.figma.com/mcp",
  },
  {
    name: "Fireflies",
    description: "Analyze and generate insights from meeting transcripts",
    url: "https://api.fireflies.ai/mcp",
  },
  {
    name: "Github",
    description: "Manage code repositories with Github",
    url: "https://api.githubcopilot.com/mcp/",
  },
  {
    name: "Honeycomb",
    description: "Query and explore observability data and SLOs",
    url: "https://mcp.honeycomb.io/mcp",
  },
  {
    name: "Hubspot",
    description: "Chat with your CRM data to get personalized insights",
    url: "https://mcp.hubspot.com/anthropic",
  },
  {
    name: "Hugging Face",
    description: "Access the HF Hub and thousands of Gradio Apps",
    url: "https://huggingface.co/mcp?login",
  },
  {
    name: "Indeed",
    description: "Search for jobs on Indeed",
    url: "https://mcp.indeed.com/claude/mcp",
  },
  {
    name: "Intercom",
    description: "AI access to Intercom data for better customer insights",
    url: "https://mcp.intercom.com/mcp",
  },
  {
    name: "Jam",
    description: "Record screen and collect automatic context for issues",
    url: "https://mcp.jam.dev/mcp",
  },
  {
    name: "Jotform",
    description: "Create forms & analyze submissions inside Claude",
    url: "https://mcp.jotform.com/",
  },
  {
    name: "Kiwi.com Flights",
    description: "Search Kiwi.com flights in AI chats",
    url: "https://mcp.kiwi.com",
  },
  {
    name: "Learning Commons Knowledge Graph",
    description: "K-12 standards, skills, and learning progressions",
    url: "https://kg.mcp.learningcommons.org/mcp",
  },
  {
    name: "London Stock Exchange Group",
    description:
      "Access best in class data & analytics across a broad spectrum of asset classes",
    url: "https://api.analytics.lseg.com/lfa/mcp",
  },
  {
    name: "Melon",
    description: "Browse music charts & your personalized music picks",
    url: "https://mcp.melon.com/mcp/",
  },
  {
    name: "Monday",
    description: "Manage projects, boards, and workflows in monday.com",
    url: "https://mcp.monday.com/mcp",
  },
  {
    name: "Moody's Analytics",
    description: "Risk insights, analytics, and decision intelligence",
    url: "https://api.moodys.com/genai-ready-data/m1/mcp",
  },
  {
    name: "Morningstar",
    description: "Up-to-date investment and market insights",
    url: "https://mcp.morningstar.com/mcp",
  },
  {
    name: "MT Newswires",
    description: "Trusted real-time global financial news provider",
    url: "https://vast-mcp.blueskyapi.com/mcp",
  },
  {
    name: "Netlify",
    description: "Create, deploy, manage, and secure websites on Netlify",
    url: "https://netlify-mcp.netlify.app/mcp",
  },
  {
    name: "Notion",
    description:
      "Connect your Notion workspace to search, update, and power workflows across tools",
    url: "https://mcp.notion.com/mcp",
  },
  {
    name: "PayPal",
    description: "Access PayPal payments platform",
    url: "https://mcp.paypal.com/mcp",
  },
  {
    name: "Pitchbook",
    description: "PitchBook data, embedded in the way you work",
    url: "https://premium.mcp.pitchbook.com/mcp",
  },
  {
    name: "PubMed",
    description: "Search biomedical literature from PubMed",
    url: "https://pubmed.mcp.claude.com/mcp",
  },
  {
    name: "Ramp",
    description: "Search, access, and analyze your Ramp financial data",
    url: "https://ramp-mcp-remote.ramp.com/mcp",
  },
  {
    name: "S&P Global",
    description: "Query a range of S&P Global datasets, like Financials",
    url: "https://kfinance.kensho.com/integrations/mcp",
  },
  {
    name: "Scholar Gateway",
    description: "Enhance responses with scholarly research and citations",
    url: "https://connector.scholargateway.ai/mcp",
  },
  {
    name: "Sentry",
    description: "Search, query, and debug errors intelligently",
    url: "https://mcp.sentry.dev/mcp",
  },
  {
    name: "Smithery (Exa)",
    description: "Use Exa Search with Smithery",
    url: "https://server.smithery.ai/exa/mcp",
  },
  {
    name: "Smithery (Stripe)",
    description: "Manage Stripe with Smithery",
    url: "https://server.smithery.ai/stripe/mcp",
  },
  {
    name: "Stripe",
    description: "Payment processing and financial infrastructure tools",
    url: "https://mcp.stripe.com",
  },
  {
    name: "Stytch",
    description: "Manage your Stytch Project",
    url: "https://mcp.stytch.dev/mcp",
  },
  {
    name: "Synapse.org",
    description: "Search and metadata tools for Synapse scientific data",
    url: "https://mcp.synapse.org/mcp",
  },
  {
    name: "Ticket Tailor",
    description: "Event platform for managing tickets, orders & more",
    url: "https://mcp.tickettailor.ai/mcp",
  },
  {
    name: "Vercel",
    description: "Analyze, debug, and manage projects and deployments",
    url: "https://mcp.vercel.com",
  },
  {
    name: "ZoomInfo",
    description: "Enrich contacts & accounts with GTM intelligence",
    url: "https://mcp.zoominfo.com/mcp",
  },
];

export default function ListMcps() {
  async function connectToMcp({ name, url }: { name: string; url: string }) {
    const authProvider = new McpOAuthProvider(url, name);

    // Check if already authenticated
    const existingTokens = authProvider.tokens();
    if (existingTokens) {
      try {
        const transport = new StreamableHTTPClientTransport(new URL(url), {
          authProvider,
        });
        const client = new Client({
          version: "1.0.0",
          name,
        });
        await client.connect(transport);
        return;
      } catch {
        // Continue to re-authenticate below
      }
    }

    // Store MCP details for OAuth callback
    sessionStorage.setItem("authenticating_mcp", JSON.stringify({ name, url }));

    try {
      const transport = new StreamableHTTPClientTransport(new URL(url), {
        authProvider,
      });
      const client = new Client({
        version: "1.0.0",
        name,
      });
      await client.connect(transport);
    } catch {
      // OAuth redirect will happen automatically if needed
    }
  }
  return (
    <ScrollArea className="h-96 ">
      <div className="flex flex-col gap-2">
        {mcps.map(({ name, description, url }, index) => {
          return (
            <Card
              key={index}
              className="py-2 rounded-md hover:bg-muted/50 cursor-pointer"
              onClick={async () => await connectToMcp({ name, url })}
            >
              <CardHeader className="flex gap-3 -ml-3">
                <Avatar className="size-10">
                  <AvatarImage
                    src={`https://img.logo.dev/${new URL(url).hostname}?token=${
                      process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN
                    }`}
                  />
                </Avatar>
                <div className="my-auto">
                  <CardTitle>{name}</CardTitle>
                  <CardDescription className="line-clamp-1">
                    {description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
