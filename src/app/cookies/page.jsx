"use client";

import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import Link from "next/link";
import { Cookie, Info, Settings, MousePointer2, ShieldCheck, PieChart } from "lucide-react";

export default function CookiesPage() {
    const sections = [
        {
            title: "What are cookies?",
            icon: <Cookie className="w-5 h-5 text-indigo-600" />,
            content: "Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently, as well as to provide information to the owners of the site."
        },
        {
            title: "How we use cookies",
            icon: <MousePointer2 className="w-5 h-5 text-indigo-600" />,
            content: "We use cookies to improve your experience on our platform, remember your preferences, and help us understand how people use our service. This includes essential cookies for login, and analytical cookies to track site performance."
        },
        {
            title: "Essential Cookies",
            icon: <ShieldCheck className="w-5 h-5 text-indigo-600" />,
            content: "These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences or logging in."
        },
        {
            title: "Analytical Cookies",
            icon: <PieChart className="w-5 h-5 text-indigo-600" />,
            content: "These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site."
        },
        {
            title: "Managing Preferences",
            icon: <Settings className="w-5 h-5 text-indigo-600" />,
            content: "Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set, visit www.aboutcookies.org or www.allaboutcookies.org."
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="pt-32 pb-20">
                <div className="mx-auto max-w-4xl px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
                            <Cookie className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Cookie Policy</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Cookie Usage</h1>
                        <p className="text-slate-500 text-lg">Helping you understand how we use tracking technology.</p>
                    </div>

                    <div className="premium-shadow border border-slate-100 rounded-3xl overflow-hidden bg-white">
                        <div className="p-8 md:p-12 space-y-12">
                            {sections.map((section, idx) => (
                                <section key={idx} className="relative">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 p-2 bg-slate-50 rounded-xl border border-slate-100">
                                            {section.icon}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 mb-4">{section.title}</h2>
                                            <p className="text-slate-600 leading-relaxed text-[15px]">
                                                {section.content}
                                            </p>
                                        </div>
                                    </div>
                                    {idx !== sections.length - 1 && (
                                        <div className="absolute -bottom-6 left-0 right-0 h-px bg-slate-50" />
                                    )}
                                </section>
                            ))}
                        </div>
                    </div>

                    <div className="mt-12 p-8 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                        <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center justify-center gap-2">
                            <Info className="w-5 h-5 text-indigo-600" /> Need more info?
                        </h3>
                        <p className="text-slate-500 text-sm max-w-lg mx-auto">
                            If you have any questions about our use of cookies or other technologies, please <Link href="/contact" className="text-indigo-600 font-semibold hover:underline">contact us</Link>.
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
