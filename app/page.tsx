import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // You might need to check if you have this, otherwise standard span works
import { Card, CardContent } from "@/components/ui/card";
import { getFeatured } from "@/lib/store";
import { ArrowRight, BookOpen, PenTool, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function HomePage() {
    const featured = await getFeatured();

    return (
        <div className="space-y-12 pb-10">
            {/* Hero Section */}
            <section className="grid gap-6 lg:grid-cols-5 items-stretch animate-fade-in">
                {/* Introduction / CTA - Spans 2 columns on large screens */}
                <div className="lg:col-span-2 flex flex-col justify-center space-y-8 py-4">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-medium text-sm uppercase tracking-wider">
                            <Sparkles className="w-4 h-4" />
                            <span>Wall Magazine</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance leading-tight">
                            Apodartho
                        </h1>
                        <p className="text-lg text-muted-foreground text-pretty max-w-md leading-relaxed">
                            The yearly wall magazine from the Department of Physics. A digital canvas where curiosity meets creativity in articles, poems, and artwork.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <Button asChild size="lg" className="rounded-full px-8 shadow-lg hover:shadow-xl transition-all">
                            <Link href="/contribute">
                                <PenTool className="mr-2 w-4 h-4" />
                                Contribute
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="rounded-full px-6 bg-background/50 backdrop-blur-sm">
                            <Link href="/articles">
                                <BookOpen className="mr-2 w-4 h-4" />
                                Browse Posts
                            </Link>
                        </Button>
                    </div>

                    {/* Quick Stats or Sub-info */}
                    <div className="pt-4 border-t flex gap-8 text-sm text-muted-foreground">
                        <div>
                            <span className="block font-bold text-foreground text-lg">2024</span>
                            <span>Edition</span>
                        </div>
                        <div>
                            <span className="block font-bold text-foreground text-lg">Dept.</span>
                            <span>Physics</span>
                        </div>
                    </div>
                </div>

                {/* Featured Post Hero - Spans 3 columns for visual dominance */}
                <div className="lg:col-span-3 min-h-[400px] lg:min-h-[500px]">
                    {featured ? (
                        <Link 
                            href={`/post/${featured.id}`} 
                            className="group relative block h-full w-full overflow-hidden rounded-2xl border shadow-sm transition-all hover:shadow-md"
                        >
                            <img
                                src={
                                    featured.image ||
                                    "/placeholder.svg?height=800&width=1200&query=physics%20abstract"
                                }
                                alt={featured.title}
                                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            />
                            
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 transition-opacity group-hover:opacity-90" />
                            
                            {/* Content Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white transform transition-transform duration-500 ease-out translate-y-2 group-hover:translate-y-0">
                                <span className="inline-block px-3 py-1 mb-3 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                                    Featured Story
                                </span>
                                <h2 className="text-2xl md:text-4xl font-bold leading-tight mb-2 text-balance">
                                    {featured.title}
                                </h2>
                                <div className="flex items-center gap-2 text-white/80 text-sm md:text-base mt-4">
                                    <span className="font-medium">By {featured.author}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 group-hover:text-white transition-colors">
                                        Read Article <ArrowRight className="w-4 h-4" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ) : (
                        <Card className="h-full flex items-center justify-center bg-muted/30 border-dashed">
                            <CardContent className="text-center text-muted-foreground">
                                <p>No featured posts yet.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </section>
        </div>
    );
}