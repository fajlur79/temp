import { Button } from "@/components/ui/button";
import { getFeatured } from "@/lib/store";
import { ArrowRight, BookOpen, PenTool, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function HomePage() {
    const featured = await getFeatured();

    return (
        <div className="space-y-12 pb-10">

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
                </div>
               
        </div>
    );
}