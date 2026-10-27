"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  MapPin, Mail, Phone, Globe, Award, BookOpen, Briefcase,
  Edit, Linkedin, Github, Twitter, ExternalLink, Code2, BadgeCheck,
} from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import Avatar from "../../components/common/Avatar";
import api, { API_BASE } from "../../lib/apiClient";

export default function ProfilePage() {
  const { user, userProfile: profile, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/signin");
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f4f6fb] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile && !authLoading) {
    return (
        <div className="min-h-screen bg-[#f4f6fb] flex flex-col items-center justify-center p-4">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">Profile not found.</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-indigo-600 font-bold hover:underline">Retry</button>
        </div>
    );
  }

  const displayName = profile?.displayName || user?.displayName || "User";
  const title = profile?.title || "Professional";
  const location = profile?.location || "";
  const email = profile?.email || user?.email || "";
  const phone = profile?.phone || "";
  const bio = profile?.bio || "";
  const skills = Array.isArray(profile?.skills) ? profile.skills : [];
  const isSkillVerified = profile?.isSkillVerified || false;
  const experience = profile?.experience || [];
  const education = profile?.education || [];
  const projects = profile?.projects || [];
  const certificates = profile?.certificates || [];

  const socialLinks = [
    { label: "LinkedIn", url: profile?.linkedin, icon: Linkedin },
    { label: "GitHub", url: profile?.github, icon: Github },
    { label: "Twitter", url: profile?.twitter, icon: Twitter },
    { label: "Website", url: profile?.website || profile?.portfolioUrl, icon: Globe },
  ].filter((s) => s.url);

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      {/* Hero Header */}
      <div className="px-4 sm:px-6 pt-6">
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 overflow-hidden rounded-3xl shadow-xl shadow-indigo-200/40">
          {/* decorative blobs */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-400/20 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-indigo-300/20 rounded-full translate-y-1/2 blur-2xl pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-6 py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="p-[3px] bg-white/30 rounded-full shadow-lg">
                  <Avatar
                    src={profile?.photoURL || user?.photoURL}
                    alt={displayName}
                    size="w-20 h-20"
                    className="border-[3px] border-white/90 rounded-full"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-black text-white tracking-tight">{displayName}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <p className="text-white/70 font-semibold text-sm">{title}</p>
                  {isSkillVerified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/15 border border-white/25 text-white text-[11px] font-bold rounded-full backdrop-blur-sm">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-300" />
                      Skill Verified
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-2.5 text-sm text-white/70">
                  {location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> {location}
                    </span>
                  )}
                  {email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> {email}
                    </span>
                  )}
                  {phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> {phone}
                    </span>
                  )}
                </div>

                {/* Social links */}
                {socialLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {socialLinks.map(({ label, url, icon: Icon }) => (
                      <a
                        key={label}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl transition-colors backdrop-blur-sm border border-white/15"
                      >
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Edit button */}
            <Link
              href="/profile/edit"
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 font-bold text-sm rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
            >
              <Edit className="w-4 h-4" /> Edit Profile
            </Link>
          </div>
        </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">

          {/* Left Sidebar */}
          <div className="space-y-5">
            {/* Core Expertise */}
            {skills.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <SectionTitle icon={<Award className="w-4 h-4 text-indigo-600" />} title="Core Expertise" />
                {isSkillVerified && (
                  <div className="flex items-center gap-1.5 mt-3 mb-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-emerald-700">Skills Verified by JobMatch AI</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:border-indigo-300 hover:text-indigo-700 transition-colors cursor-default"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Professional Summary */}
            {bio && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <SectionTitle icon={<Award className="w-4 h-4 text-indigo-600" />} title="Professional Summary" />
                <p className="mt-3 text-slate-600 text-sm leading-relaxed">{bio}</p>
              </div>
            )}
          </div>

          {/* Right Content */}
          <div className="space-y-5">

            {/* Work Experience */}
            {experience.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <SectionTitle icon={<Briefcase className="w-4 h-4 text-indigo-600" />} title="Work Experience" />
                <div className="mt-4 border-l-2 border-slate-100 ml-2 pl-6 space-y-6">
                  {experience.map((exp, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white shadow-sm" />
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900">{exp.position}</h3>
                        <span className="text-xs font-bold text-indigo-500 shrink-0">
                          {exp.startDate}{exp.endDate ? ` — ${exp.endDate}` : " — Present"}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mt-0.5 flex items-center gap-1.5">
                        <Briefcase className="w-3 h-3" /> {exp.company}
                      </p>
                      {exp.description && (
                        <p className="mt-2 text-sm text-slate-500 leading-relaxed">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Featured Projects */}
            {projects.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <SectionTitle icon={<Code2 className="w-4 h-4 text-indigo-600" />} title="Featured Projects" />
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.map((proj, i) => (
                    <div key={i} className="border border-slate-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      {proj.image && (
                        <div className="relative h-36 overflow-hidden bg-slate-100">
                          <Image
                            src={proj.image}
                            alt={proj.name || "Project image"}
                            fill
                            sizes="(max-width: 640px) 100vw, 50vw"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-bold text-slate-900 text-sm">{proj.name}</h3>
                        {proj.description && (
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{proj.description}</p>
                        )}
                        {proj.technologies && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {proj.technologies.split(",").map((t) => (
                              <span key={t} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded">
                                {t.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                        {proj.link && (
                          <a
                            href={proj.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-indigo-600 hover:underline"
                          >
                            View Project <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {education.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <SectionTitle icon={<BookOpen className="w-4 h-4 text-indigo-600" />} title="Education" />
                <div className="mt-4 space-y-4">
                  {education.map((edu, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                      <div className="flex-1 flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">
                            {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                          </h3>
                          <p className="text-xs text-indigo-600 font-semibold mt-0.5">{edu.school}</p>
                        </div>
                        {edu.startDate && (
                          <span className="text-xs font-bold text-slate-400 shrink-0">{edu.startDate}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certificates */}
            {certificates.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <SectionTitle icon={<Award className="w-4 h-4 text-indigo-600" />} title="Certificates" />
                <div className="mt-4 space-y-4">
                  {certificates.map((cert, i) => (
                    <div key={i} className="flex items-center gap-4">
                      {cert.image ? (
                        <Image
                          src={cert.image}
                          alt={cert.name || "Certificate"}
                          width={56}
                          height={40}
                          className="w-14 h-10 object-cover rounded-lg border border-slate-100 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                          <Award className="w-5 h-5 text-indigo-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{cert.name}</p>
                        <p className="text-xs text-indigo-600 font-semibold">{cert.issuer}</p>
                        {cert.date && <p className="text-xs text-slate-400 mt-0.5">{cert.date}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state if nothing filled */}
            {experience.length === 0 && projects.length === 0 && education.length === 0 && certificates.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="font-bold text-slate-500">Your profile is empty.</p>
                <Link href="/profile/edit" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                  <Edit className="w-4 h-4" /> Complete Your Profile
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
      <div className="p-1.5 bg-indigo-50 rounded-lg">{icon}</div>
      <h2 className="font-bold text-slate-900 text-sm">{title}</h2>
    </div>
  );
}
