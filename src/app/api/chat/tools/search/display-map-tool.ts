import { tool, UIMessageStreamWriter } from "ai";
import { z } from "zod";

function displayMapTool({ writer }: { writer: UIMessageStreamWriter }) {
  return tool({
    name: "display-map-tool",
    description: "Display a map of the locations",
    inputSchema: z.object({
      locations: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          address: z.string(),
          url: z.string(),
        })
      ),
    }),
    execute: async ({ locations }) => {
      const geocodedResults = await Promise.all(
        locations.map(async ({ id, url, name, address }) => {
          // Sanitize address: remove semicolons and limit to 256 characters
          const sanitizedAddress = address
            .replace(/;/g, ",")
            .slice(0, 256)
            .trim();

          const urlObj = new URL(
            `https://api.mapbox.com/search/geocode/v6/forward`
          );
          urlObj.searchParams.set("q", sanitizedAddress);
          urlObj.searchParams.set(
            "access_token",
            process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""
          );
          const geoResponse = await fetch(urlObj.toString());
          const data = await geoResponse.json();

          if (!data?.features || data.features.length === 0) {
            return null;
          }
          const [longitude, latitude] = data.features[0].geometry.coordinates;

          return {
            id,
            url,
            name,
            address,
            latitude,
            longitude,
          };
        })
      );
      return geocodedResults.filter(Boolean);
    },
  });
}

export { displayMapTool };
