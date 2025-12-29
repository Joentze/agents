"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList as CommandListUI,
} from "@/components/ui/command";

interface CommandType {
  icon: React.ReactNode;
  title: string;
  command: (props: any) => void;
  group: string;
}

interface CommandsListProps {
  items: CommandType[];
  command: (item: CommandType) => void;
}

export interface CommandsListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const CommandsList = forwardRef<CommandsListRef, CommandsListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useEffect(() => {
      const selectedElement = itemRefs.current[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }, [selectedIndex]);

    // Group items by their group property
    const groupedItems = items.reduce((acc, item) => {
      const group = item.group || "Other";
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(item);
      return acc;
    }, {} as Record<string, CommandType[]>);

    const selectItem = (index: number) => {
      const item = items[index];
      if (item) {
        command(item);
      }
    };

    const upHandler = () => {
      setSelectedIndex((selectedIndex + items.length - 1) % items.length);
    };

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % items.length);
    };

    const enterHandler = () => {
      selectItem(selectedIndex);
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          upHandler();
          return true;
        }

        if (event.key === "ArrowDown") {
          downHandler();
          return true;
        }

        if (event.key === "Enter") {
          enterHandler();
          return true;
        }

        return false;
      },
    }));

    return (
      <Command
        className="w-64 border shadow-md rounded-md"
        value={items[selectedIndex]?.title}
      >
        <CommandListUI>
          {Object.keys(groupedItems).length > 0 ? (
            (() => {
              let absoluteIndex = 0;
              return Object.entries(groupedItems).map(([group, groupItems]) => (
                <CommandGroup key={group} heading={group}>
                  {groupItems.map((item) => {
                    const currentIndex = absoluteIndex++;
                    return (
                      <CommandItem
                        key={currentIndex}
                        ref={(el) => {
                          if (el) {
                            itemRefs.current[currentIndex] = el;
                          }
                        }}
                        value={item.title}
                        onSelect={() => selectItem(currentIndex)}
                      >
                        {item.icon}
                        {item.title}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ));
            })()
          ) : (
            <CommandEmpty>No results</CommandEmpty>
          )}
        </CommandListUI>
      </Command>
    );
  }
);

CommandsList.displayName = "CommandsList";
