"use client";

import { Camera, Facebook, Instagram, Loader2, Sparkles, Youtube } from "lucide-react";
import { useState } from "react";

// Define the User Interface
interface UserProfile {
    name: string;
    role: string;
    avatar: string;
    bio: string;
    location: string;
    website: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
}

const INITIAL_USER: UserProfile = {
    name: "Alex Driftwood",
    role: "Senior Contributor",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    bio: "Passionate writer and digital artist.",
    location: "Portland, OR",
    website: "alexwrites.io",
    facebook: "https://facebook.com",
    instagram: "",
    youtube: "",
};

export default function ProfilePage() {
    const [user, setUser] = useState<UserProfile>(INITIAL_USER);
    const [isGeneratingBio, setIsGeneratingBio] = useState(false);

    // SECURE AI CALL
    const handleRewriteBio = async () => {
        if (isGeneratingBio) return;
        setIsGeneratingBio(true);

        try {
            const prompt = `Rewrite this bio to be professional and engaging for a Wall Magazine contributor. Name: ${user.name}, Role: ${user.role}. Current Bio: "${user.bio}". Return only the text.`;

            // Call OUR backend, not Google directly
            const response = await fetch("/api/ai-helper", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });

            const data = await response.json();
            if (data.text) {
                setUser(prev => ({ ...prev, bio: data.text.trim() }));
            }
        } catch (error) {
            alert("Failed to generate bio");
        } finally {
            setIsGeneratingBio(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-800">Edit Profile</h2>
                <p className="text-slate-500 text-sm mt-1">Update your personal details and social links.</p>
            </div>

            <div className="p-6 space-y-6">
                {/* Avatar */}
                <div className="flex items-center space-x-6">
                    <div className="relative group">
                        <img
                            src={user.avatar}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                        <button className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700">
                            <Camera size={16} />
                        </button>
                    </div>
                    <div>
                        <h3 className="font-medium text-slate-900">Profile Photo</h3>
                        <p className="text-sm text-slate-500 mt-1">Recommended: Square JPG, PNG.</p>
                    </div>
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={user.name}
                            onChange={e => setUser({ ...user, name: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                        <input
                            type="text"
                            value={user.role}
                            disabled
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-slate-700">Bio</label>
                            <button
                                onClick={handleRewriteBio}
                                disabled={isGeneratingBio}
                                className="text-xs flex items-center gap-1 text-indigo-600 font-medium"
                            >
                                {isGeneratingBio ? (
                                    <Loader2 size={12} className="animate-spin" />
                                ) : (
                                    <Sparkles size={12} />
                                )}
                                <span>Rewrite with AI</span>
                            </button>
                        </div>
                        <textarea
                            rows={4}
                            value={user.bio}
                            onChange={e => setUser({ ...user, bio: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>

                {/* Socials */}
                <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-900 mb-4">Social Profiles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Facebook size={16} className="absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Facebook URL"
                                value={user.facebook}
                                onChange={e => setUser({ ...user, facebook: e.target.value })}
                                className="w-full pl-10 px-4 py-2 rounded-lg border border-slate-300 outline-none text-sm"
                            />
                        </div>
                        <div className="relative">
                            <Instagram size={16} className="absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Instagram URL"
                                value={user.instagram}
                                onChange={e => setUser({ ...user, instagram: e.target.value })}
                                className="w-full pl-10 px-4 py-2 rounded-lg border border-slate-300 outline-none text-sm"
                            />
                        </div>
                        <div className="relative">
                            <Youtube size={16} className="absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="YouTube URL"
                                value={user.youtube}
                                onChange={e => setUser({ ...user, youtube: e.target.value })}
                                className="w-full pl-10 px-4 py-2 rounded-lg border border-slate-300 outline-none text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
