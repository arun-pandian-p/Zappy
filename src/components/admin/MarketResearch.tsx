import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Globe, Search, ExternalLink } from "lucide-react";
import { firecrawlApi } from "@/lib/api/firecrawl";
import { useToast } from "@/hooks/use-toast";

export function MarketResearch() {
  const { toast } = useToast();
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [scrapeResult, setScrapeResult] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Array<{ url: string; title: string; description: string }>>([]);
  const [isScraping, setIsScraping] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrapeUrl.trim()) return;
    setIsScraping(true);
    setScrapeResult(null);
    try {
      const response = await firecrawlApi.scrape(scrapeUrl);
      if (response.success) {
        const markdown = (response as any).data?.markdown || (response as any).markdown || JSON.stringify(response.data, null, 2);
        setScrapeResult(markdown);
        toast({ title: "Scraped successfully" });
      } else {
        toast({ title: "Scrape failed", description: response.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to scrape URL", variant: "destructive" });
    } finally {
      setIsScraping(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const response = await firecrawlApi.search(searchQuery);
      if (response.success) {
        const results = (response as any).data || [];
        setSearchResults(results);
        toast({ title: `Found ${results.length} results` });
      } else {
        toast({ title: "Search failed", description: response.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to search", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Market Research</h2>
        <p className="text-sm text-muted-foreground">Scrape competitor menus and search for market trends</p>
      </div>

      <Tabs defaultValue="scrape">
        <TabsList>
          <TabsTrigger value="scrape"><Globe className="w-4 h-4 mr-2" />Scrape URL</TabsTrigger>
          <TabsTrigger value="search"><Search className="w-4 h-4 mr-2" />Web Search</TabsTrigger>
        </TabsList>

        <TabsContent value="scrape" className="space-y-4">
          <form onSubmit={handleScrape} className="flex gap-2">
            <Input
              type="url"
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              placeholder="https://competitor-restaurant.com/menu"
              className="flex-1"
              required
            />
            <Button type="submit" disabled={isScraping}>
              {isScraping ? <Loader2 className="w-4 h-4 animate-spin" /> : "Scrape"}
            </Button>
          </form>

          {scrapeResult && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Scraped Content</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs whitespace-pre-wrap">
                  {scrapeResult}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="restaurant menu trends 2025"
              className="flex-1"
              required
            />
            <Button type="submit" disabled={isSearching}>
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </form>

          {searchResults.length > 0 && (
            <div className="grid gap-3">
              {searchResults.map((result, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-medium text-sm truncate">{result.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{result.description}</p>
                      </div>
                      <a href={result.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
