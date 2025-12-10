"use client";

import { useState, useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { MapPin, Navigation, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import "mapbox-gl/dist/mapbox-gl.css";
import { cn } from "@/lib/utils";
import { MapSearchToolResult } from "@/app/types/maps";

interface MapComponentProps {
  locations: MapSearchToolResult[];
}

export default function MapComponent({ locations = [] }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerElementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const [selectedLocation, setSelectedLocation] =
    useState<MapSearchToolResult | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const hasLocations = locations && locations.length > 0;

  // Update marker styles when selection changes
  useEffect(() => {
    markerElementsRef.current.forEach((el, locationId) => {
      const isSelected = selectedLocation?.id === locationId;
      const iconContainer = el.querySelector(".marker-icon");
      if (iconContainer) {
        if (isSelected) {
          iconContainer.classList.remove(
            "text-white/80",
            "hover:text-white",
            "hover:scale-110"
          );
          iconContainer.classList.add(
            "text-primary",
            "scale-125",
            "drop-shadow-[0_0_8px_hsl(var(--primary))]"
          );
        } else {
          iconContainer.classList.remove(
            "text-primary",
            "scale-125",
            "drop-shadow-[0_0_8px_hsl(var(--primary))]"
          );
          iconContainer.classList.add(
            "text-white/80",
            "hover:text-white",
            "hover:scale-110"
          );
        }
      }
    });
  }, [selectedLocation]);

  // Initialize map with proper lifecycle management
  useEffect(() => {
    if (
      !mapContainer.current ||
      !process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
      !hasLocations
    )
      return;

    // Prevent multiple initializations
    if (map.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    // Initialize map
    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [
        locations[0]?.longitude || -74.006,
        locations[0]?.latitude || 40.7128,
      ],
      zoom: 12,
      attributionControl: false,
    });

    map.current = mapInstance;

    // Add navigation control
    mapInstance.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    mapInstance.on("load", () => {
      setIsMapLoaded(true);
      mapInstance.resize(); // Ensure map fits container

      // Add all location markers
      locations.forEach((location) => {
        const el = document.createElement("div");
        el.className =
          "cursor-pointer transition-all duration-200 hover:scale-110";

        const isSelected = selectedLocation?.id === location.id;
        el.innerHTML = `
          <div class="relative group">
            <div class="marker-icon relative flex items-center justify-center transition-all duration-200 ${
              isSelected
                ? "text-primary scale-125 drop-shadow-[0_0_8px_hsl(var(--primary))]"
                : "text-white/80 hover:text-white hover:scale-110"
            }">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        `;

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          handleLocationClick(location);
        });

        // Store element reference for later updates
        markerElementsRef.current.set(location.id, el);

        new mapboxgl.Marker(el)
          .setLngLat([location.longitude, location.latitude])
          .addTo(mapInstance);
      });

      // Fit bounds to show all locations
      if (locations.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        locations.forEach((location) => {
          bounds.extend([location.longitude, location.latitude]);
        });

        mapInstance.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15,
          duration: 1000,
        });
      }
    });

    // Cleanup on unmount
    return () => {
      mapInstance.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations]); // Re-initialize if locations change

  const handleLocationClick = (location: MapSearchToolResult) => {
    setSelectedLocation(location);
    if (map.current) {
      map.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 15,
        duration: 1000,
      });
    }
  };

  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    return (
      <Card className="flex items-center justify-center w-full h-96">
        <CardContent className="flex flex-col items-center gap-2 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Mapbox access token is not configured
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!hasLocations) {
    return (
      <Card className="flex items-center justify-center w-full h-96">
        <CardContent className="flex flex-col items-center gap-2 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No locations to display
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="my-2"
    >
      <Card className="overflow-hidden shadow-xl p-0">
        <div className="flex flex-col-reverse md:flex-row h-[500px] md:h-[420px]">
          {/* Sidebar */}
          <div className="w-full md:w-2/5 h-1/3 md:h-full min-w-0 border-b md:border-b-0 md:border-r border-border bg-card/50 backdrop-blur-sm flex flex-col overflow-hidden">
            {/* Header */}

            {/* Location List */}
            <ScrollArea className="flex-1 min-h-0 z-20">
              <div className="p-2 space-y-1 overflow-hidden">
                <AnimatePresence>
                  {locations.map((location, index) => (
                    <motion.div
                      key={location.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="w-full"
                    >
                      <button
                        onClick={() => handleLocationClick(location)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-all duration-200 overflow-hidden",
                          "hover:bg-accent/50",
                          selectedLocation?.id === location.id
                            ? "bg-primary/10 border border-primary/20 shadow-sm"
                            : "border border-transparent"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "text-sm font-medium truncate line-clamp-1",
                                selectedLocation?.id === location.id
                                  ? "text-primary"
                                  : "text-foreground"
                              )}
                            >
                              {location.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5 line-clamp-1">
                              {location.address}
                            </p>
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>

          {/* Map Container */}
          <div className="flex-1 relative bg-muted overflow-hidden">
            {/* Loading Skeleton */}
            <AnimatePresence>
              {!isMapLoaded && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 z-10 bg-card"
                >
                  <Skeleton className="w-full h-full rounded-none" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-muted-foreground">
                        Loading map...
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Map */}
            <motion.div
              ref={mapContainer}
              initial={{ opacity: 0 }}
              animate={{ opacity: isMapLoaded ? 1 : 0 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full"
            />

            {/* Info Panel */}
            <AnimatePresence mode="wait">
              {selectedLocation && isMapLoaded && (
                <motion.div
                  key={selectedLocation.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto"
                >
                  <Card className="w-full md:w-72 shadow-2xl border-border/50 backdrop-blur-sm bg-card/95 p-2">
                    <CardHeader className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {selectedLocation.name}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1 line-clamp-2">
                            {selectedLocation.address}
                          </CardDescription>
                        </div>
                        {selectedLocation.url && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                asChild
                              >
                                <a
                                  href={selectedLocation.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View details</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
