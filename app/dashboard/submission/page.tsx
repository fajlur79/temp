"use client";

import { Edit3, Lightbulb, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

const MOCK_SUBMISSIONS = [
    { id: "1", title: "The Future of Digital Typography", status: "approved", date: "2023-10-24", views: 1240 },
    { id: "2", title: "Minimalism in Modern Architecture", status: "pending", date: "2023-11-02", views: 0 },
    { id: "3", title: "Sustainable Living: A Guide", status: "rejected", date: "2023-09-15", views: 45 },
];

export default function SubmissionsPage() {
    const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
    const [aiIdeas, setAiIdeas] = useState<string[]>([]);
    const [filter, setFilter] = useState("all");

    const handleGenerateIdeas = async () => {
        if (isGeneratingIdeas) return;
        setIsGeneratingIdeas(true);
        try {
            const prompt = `Generate 3 catchy article titles for a senior tech writer. Return only titles separated by newlines.`;
            const response = await fetch("/api/ai-helper", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });
            const data = await response.json();
            const ideas = data.text.split("\n").filter((l: string) => l.trim().length > 0);
            setAiIdeas(ideas);
        } catch (e) {
            alert("Failed to generate ideas");
        } finally {
            setIsGeneratingIdeas(false);
        }
    };

    const filtered = filter === "all" ? MOCK_SUBMISSIONS : MOCK_SUBMISSIONS.filter(s => s.status === filter);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* AI Hero Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl shadow-md p-6 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Sparkles className="text-yellow-300" size={20} /> Need Inspiration?
                        </h3>
                        <p className="text-indigo-100 text-sm">Let AI generate article titles for you.</p>
                    </div>
                    <button
                        onClick={handleGenerateIdeas}
                        disabled={isGeneratingIdeas}
                        className="px-5 py-2 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 flex items-center gap-2"
                    >
                        {isGeneratingIdeas ? <Loader2 className="animate-spin" size={18} /> : <Lightbulb size={18} />}
                        <span>{isGeneratingIdeas ? "Thinking..." : "Inspire Me"}</span>
                    </button>
                </div>
                {aiIdeas.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-indigo-500/30 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {aiIdeas.map((idea, i) => (
                            <div key={i} className="bg-white/10 p-3 rounded-lg text-sm font-medium">
                                "{idea}"
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Submissions List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-semibold text-slate-800">My Articles</h2>
                    <div className="flex gap-2">
                        {["all", "approved", "pending"].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                                    filter === f ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="divide-y divide-slate-100">
                    {filtered.map(sub => (
                        <div key={sub.id} className="p-6 flex justify-between items-center hover:bg-slate-50">
                            <div>
                                <h4 className="font-medium text-slate-900">{sub.title}</h4>
                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                    <span
                                        className={`px-2 py-0.5 rounded-full capitalize ${
                                            sub.status === "approved"
                                                ? "bg-emerald-100 text-emerald-800"
                                                : sub.status === "pending"
                                                ? "bg-amber-100 text-amber-800"
                                                : "bg-rose-100 text-rose-800"
                                        }`}
                                    >
                                        {sub.status}
                                    </span>
                                    <span>{sub.date}</span>
                                    {sub.views > 0 && <span>• {sub.views} Views</span>}
                                </div>
                            </div>
                            <button className="p-2 text-slate-400 hover:text-indigo-600">
                                <Edit3 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
