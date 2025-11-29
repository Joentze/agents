import { Avatar, AvatarImage } from "../avatar";
import { Card, CardHeader, CardDescription, CardTitle } from "../card";
import { ScrollArea } from "../scroll-area";

const mcps = [
  {
    name: "Stripe",
    description: "Manage payments with Stripe",
    url: "https://mcp.stripe.com",
  },
  {
    name: "Notion",
    description: "Manage Notion pages and databases",
    url: "https://mcp.notion.com/mcp",
  },
];

export default function ListMcps() {
  return (
    <ScrollArea className="h-96 ">
      <div className="flex flex-col gap-2">
        {mcps.map(({ name, description, url }, index) => {
          return (
            <Card
              key={index}
              className="py-2 rounded-md hover:bg-muted/50 cursor-pointer"
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
                  <CardDescription>{description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
