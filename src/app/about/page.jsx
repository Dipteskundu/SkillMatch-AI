"use client";

import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import { Target, Shield, Zap, Globe, Heart, Award, ChevronRight } from "lucide-react";
import Link from "next/link";
import PageWrapper from "../components/common/PageWrapper";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#fdfdfe]">
            <Navbar />

            <main className="pt-8 sm:pt-12 pb-24">
                <PageWrapper>
                {/* Hero Section */}
                <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-16 sm:mb-24">
                    <div className="max-w-4xl animate-fade-up">
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-tight mb-6 sm:mb-8">
                            We&apos;re redefining the <br className="hidden sm:block" />
                            <span className="text-indigo-600">future of hiring.</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-slate-500 leading-relaxed max-w-2xl">
                            SkillMatch AI was founded on a simple belief: the right job can change a life, and the right talent can change the world. We use AI to make those connections happen faster and more accurately.
                        </p>
                    </div>
                </section>

                {/* Mission & Vision - Bento Grid Style */}
                <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-20 sm:mb-32 reveal">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 bg-slate-900 rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-12 text-white relative overflow-hidden group">
                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-indigo-600/20">
                                        <Target className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-3xl sm:text-4xl font-bold mb-6">Our Mission</h2>
                                    <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-lg">
                                        To bridge the gap between human potential and professional opportunity. We empower individuals to discover their true path and companies to build teams that define the future.
                                    </p>
                                </div>
                                <div className="mt-8 sm:mt-12 flex items-center gap-4">
                                    <p className="text-[10px] sm:text-sm font-bold text-slate-500 uppercase tracking-widest">Built for candidates and recruiters</p>
                                </div>
                            </div>
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-600/10 to-transparent"></div>
                        </div>

                        <div className="bg-white border border-slate-100 premium-shadow rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-12 flex flex-col justify-between">
                            <div>
                                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8">
                                    <Globe className="w-8 h-8 text-indigo-600" />
                                </div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-6">Global Impact</h2>
                                <p className="text-slate-500 leading-relaxed">
                                    Breaking down geographical barriers to talent. Whether you&apos;re in San Francisco or Singapore, we help you find the best match.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Core Values */}
                <section id="values" className="bg-slate-50 py-20 sm:py-32 border-y border-slate-100 reveal">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-20">
                            <h2 className="text-4xl font-black text-slate-900 mb-6 font-sans tracking-tight">Values that drive us</h2>
                            <p className="text-slate-500 text-lg leading-relaxed">
                                Behind every line of code and every AI match are the core principles that guide our every decision.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                {
                                    title: "Intelligence First",
                                    desc: "We leverage data to provide insights that traditional hiring misses.",
                                    icon: <Zap className="w-6 h-6" />,
                                    color: "bg-amber-50 text-amber-600"
                                },
                                {
                                    title: "Radical Integrity",
                                    desc: "Transparency and fairness are at the heart of our matching engine.",
                                    icon: <Shield className="w-6 h-6" />,
                                    color: "bg-green-50 text-green-600"
                                },
                                {
                                    title: "Human Centric",
                                    desc: "AI is the tool, but people are the priority. Always.",
                                    icon: <Heart className="w-6 h-6" />,
                                    color: "bg-pink-50 text-pink-600"
                                },
                                {
                                    title: "Relentless Support",
                                    desc: "We grow as you grow. Our team is with you at every step.",
                                    icon: <Award className="w-6 h-6" />,
                                    color: "bg-indigo-50 text-indigo-600"
                                }
                            ].map((value, i) => (
                                <div key={i} className="bg-white p-8 sm:p-10 rounded-3xl sm:rounded-[2.5rem] border border-slate-100 hover:border-indigo-200 transition-all premium-shadow group">
                                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 ${value.color} group-hover:scale-110 transition-transform`}>
                                        {value.icon}
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">{value.title}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">
                                        {value.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Team Hook Section */}
                <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-32 reveal">
                    <div className="bg-indigo-600 rounded-3xl sm:rounded-[3rem] p-8 sm:p-16 md:p-24 flex flex-col lg:flex-row items-center gap-12 lg:gap-16 relative overflow-hidden text-center lg:text-left">
                        <div className="relative z-10 flex-1">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 sm:mb-8 leading-tight">
                                Join our mission to <br className="hidden sm:block" />
                                <span className="text-indigo-200">change how hiring works.</span>
                            </h2>
                            <p className="text-indigo-100 text-lg sm:text-xl leading-relaxed mb-8 sm:mb-10 max-w-xl mx-auto lg:mx-0">
                                We&apos;re always looking for brilliant minds to help us build the next generation of HR technology. Ready to make an impact?
                            </p>
                            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                                <Link href="/jobs" className="px-8 sm:px-10 py-4 sm:py-5 bg-white text-indigo-600 rounded-2xl font-black hover:bg-slate-50 transition-all premium-shadow flex items-center gap-2 text-sm sm:text-base">
                                    View Career Openings <ChevronRight className="w-4 h-4" />
                                </Link>
                                <Link href="/about#values" className="px-8 sm:px-10 py-4 sm:py-5 border-2 border-indigo-400 text-white rounded-2xl font-black hover:bg-indigo-500 transition-all text-sm sm:text-base">
                                    Our Culture
                                </Link>
                            </div>
                        </div>

                        <div className="relative z-10 w-full lg:w-1/3">
                            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 sm:p-10 rounded-3xl sm:rounded-[3rem] text-left">
                                <div className="flex items-center gap-4 mb-6 sm:mb-8">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center">
                                        <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm sm:text-base">Our promise</p>
                                        <p className="text-indigo-200 text-xs sm:text-sm">Skill-first, always</p>
                                    </div>
                                </div>
                                <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                                    Every candidate is judged by demonstrated ability, and every match score comes with an explanation you can review.
                                </p>
                            </div>
                        </div>

                        {/* Background pattern */}
                        <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-20">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white rounded-full"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white rounded-full"></div>
                        </div>
                    </div>
                </section>
                </PageWrapper>
            </main>

            <Footer />
        </div>
    );
}
