import { generateObject, tool, UIMessageStreamWriter } from "ai";
import { z } from "zod";
import { GoogleGenAI, type GroundingChunk } from "@google/genai";
import geo from "mapbox-geocoding";
import {
  ChainOfThoughtRun,
  StepUpdateType,
} from "@/app/types/chain-of-thought";
import { randomUUID } from "crypto";

type GoogleMapSearchProps = {
  writer: UIMessageStreamWriter;

  userLocation: {
    latitude: number;
    longitude: number;
  } | null;
};

// Set Mapbox access token
geo.setAccessToken(process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "");

function googleMapSearch({ writer, userLocation }: GoogleMapSearchProps) {
  return tool({
    name: "google-map-search",
    description: "Search google maps for a list of locations",
    inputSchema: z.object({
      query: z.string().describe("Query for what to search for"),
      country: z
        .string()
        .describe(
          "Country to search for, for example: US, if not provided leave it blank"
        )
        .optional()
        .default(""),
      city: z
        .string()
        .describe(
          "City to search for, for example: San Francisco, if not provided leave it blank"
        )
        .optional()
        .default(""),
      requiresUserLocation: z
        .boolean()
        .describe(
          "Whether to use the user's location to search for locations, required especially if user asks for locations near them"
        ),
    }),
    execute: async (
      { query, city, country, requiresUserLocation },
      { toolCallId: runId }
    ) => {
      const startDatetime = Date.now();
      writer.write({
        type: "data-chain-of-thought-run-start",
        data: {
          status: "pending",
          type: "agentic-map-search",
          id: runId,
          startDatetime,
          steps: {},
        } as ChainOfThoughtRun,
      });
      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        });
        const { text, candidates } = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `
          Search up locations for the following query:
          ${query},
          in the city of ${city}, ${country}
          If the user's location does not correspond to the city, ignore the user's location and use the city and country to search for locations.
          If the user's location corresponds to the city, use the user's location to search for locations.
          For each location, return the name of the location and the full address of the location. 

          For example:
          ID: 1234567890
          Name: Hawaiian Bros
          Address: 123 Main St, Anytown, USA
          Map URL: https://www.google.com/maps/place/?cid=1234567890
          `,
          config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
              retrievalConfig: {
                latLng:
                  userLocation && requiresUserLocation ? userLocation : {},
              },
            },
          },
        });
        let sources: {
          id: string;
          name: string;
          address: string;
          url: string;
        }[] = [];
        if (candidates) {
          candidates.forEach(({ groundingMetadata }) => {
            if (groundingMetadata && groundingMetadata.groundingChunks) {
              groundingMetadata.groundingChunks.map(({ maps }) => {
                if (maps) {
                  const { placeId, text, title, uri } = maps;
                  sources.push({
                    id: placeId ?? "",
                    name: title ?? "",
                    address: text ?? "",
                    url: uri ?? "",
                  });
                }
              });
            }
          });
        }
        sources.forEach(({ id, name, url }) => {
          writer.write({
            type: "source-url",
            sourceId: id,
            url,
            title: name,
          });
        });
        const sourceStepId = randomUUID();
        writer.write({
          type: "data-chain-of-thought-step-update",
          data: {
            status: "pending",
            type: "map-search",
            runId,
            stepId: sourceStepId,
            data: {
              query,
              results: sources.map(({ url, name }) => {
                return {
                  url,
                  sourceUrl: url,
                  title: name ?? "",
                  text: "",
                };
              }),
            },
          } as StepUpdateType,
        });
        const summaryId = randomUUID();

        writer.write({
          type: "data-chain-of-thought-run-end",
          data: {
            status: "completed",
            id: runId,
            endDatetime: Date.now(),
          },
        });

        return `Call the display-map-tool next with the following text and format with text: ${text}`;
      } catch (error) {
        console.error(error);
        return [];
      }
    },
  });
}

export { googleMapSearch };
