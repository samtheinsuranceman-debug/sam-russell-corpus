import { useState } from "react";
import { Search, BookOpen, ExternalLink, Loader2, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import NavBar from "@/components/NavBar";

const QUICK_SEARCHES = [
  "Major depressive disorder treatment", "Generalized anxiety disorder CBT",
  "PTSD EMDR therapy", "Bipolar disorder lithium", "ADHD medication adults",
  "Borderline personality DBT", "Schizophrenia antipsychotic", "OCD exposure therapy",
  "Exercise depression treatment", "Mindfulness anxiety reduction",
];

export default function Research() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = trpc.research.search.useQuery(
    { query: searchTerm, maxResults: 15 },
    { enabled: searchTerm.length >= 3 }
  );

  const handleSearch = (q?: string) => {
    const term = q || query;
    if (term.length >= 3) setSearchTerm(term);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container py-8 max-w-5xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">PubMed / NCBI Research Integration</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Medical Research Library</h1>
          <p className="text-muted-foreground text-sm mt-1">Search peer-reviewed literature from PubMed and NCBI.</p>
          <div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-muted-foreground">
            Literature search is educational, not personalized medical guidance. Your search terms are sent by Doctor Buddy's server to NCBI/PubMed to retrieve results, so do not put names, contact details, account numbers, or other identifying information in a research search.
          </div>
        </div>

        {/* Search */}
        <Card className="border-border bg-card mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  placeholder="Search PubMed... (e.g., 'depression treatment CBT')"
                  className="pl-9 bg-secondary/30 border-border"
                />
              </div>
              <Button onClick={() => handleSearch()} disabled={query.length < 3 || isLoading} className="bg-primary text-primary-foreground">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Filter className="w-3 h-3" /> Quick searches:</span>
              {QUICK_SEARCHES.map(q => (
                <button key={q} onClick={() => { setQuery(q); handleSearch(q); }}
                  className="text-xs px-2 py-1 rounded-md bg-secondary/50 text-muted-foreground hover:text-primary hover:bg-secondary transition-colors border border-border">
                  {q}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
            <p className="text-muted-foreground">Searching PubMed database...</p>
          </div>
        )}

        {data && !isLoading && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-foreground">
                {data.articles.length} results for <span className="text-primary">"{searchTerm}"</span>
              </h2>
              <a href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(searchTerm)}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="border-border text-xs">
                  <ExternalLink className="w-3 h-3 mr-1" /> View on PubMed
                </Button>
              </a>
            </div>

            <div className="grid gap-4">
              {data.articles.map((article: any) => (
                <Card key={article.pmid} className="border-border bg-card card-hover">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <a href={article.url} target="_blank" rel="noopener noreferrer"
                          className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {article.title}
                        </a>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {article.authors?.slice(0, 3).map((a: string, i: number) => (
                            <span key={i} className="text-xs text-muted-foreground">{a}{i < Math.min(2, article.authors.length - 1) ? "," : article.authors.length > 3 ? " et al." : ""}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          {article.journal && <Badge variant="outline" className="text-xs border-primary/30 text-primary">{article.journal}</Badge>}
                          {article.year > 0 && <span className="text-xs text-muted-foreground">{article.year}</span>}
                          <span className="text-xs text-muted-foreground">PMID: {article.pmid}</span>
                        </div>
                      </div>
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                        <Button variant="outline" size="sm" className="border-border text-xs">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!searchTerm && !isLoading && (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Search the Medical Literature</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">Enter a condition, treatment, or keyword to search millions of peer-reviewed articles from PubMed and NCBI.</p>
          </div>
        )}

        {/* Source Links */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "PubMed", url: "https://pubmed.ncbi.nlm.nih.gov/", desc: "30M+ articles" },
            { name: "NCBI", url: "https://www.ncbi.nlm.nih.gov/", desc: "NIH database" },
            { name: "DSM-5", url: "https://www.psychiatry.org/psychiatrists/practice/dsm", desc: "APA criteria" },
            { name: "NIMH", url: "https://www.nimh.nih.gov/", desc: "Mental health research" },
          ].map(s => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors group">
              <div>
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
