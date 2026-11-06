"use client";

import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  GraduationCap,
  Link2,
  Play,
  SearchCheck,
  ShieldCheck,
  TrendingUp,
  UserRound,
} from "lucide-react";
import styles from "./HomeHero.module.css";

const LEARNING_STEPS = ["Learn", "Practice", "Get certified"];

export default function HomeHero({ stats }) {
  const heroStats = stats.slice(0, 3);

  return (
    <section className={styles.hero} aria-labelledby="home-hero-title">
      <div className={styles.container}>
        <div className={styles.copy}>
          <h1 id="home-hero-title" className={styles.title}>
            <span>Hire for</span>{" "}
            <br className={styles.mobileBreak} />
            <span>
              <span className={styles.mobileAccent}>proven skills,</span>
              <br className={styles.desktopBreak} />
              <span className={styles.desktopAccent}>not</span>{" "}
            </span>
            <br className={styles.mobileBreak} />
            <span className={styles.desktopAccent}>just resumes.</span>
          </h1>

          <p className={styles.description}>
            JobMatch AI validates real abilities through structured assessments,
            then matches candidates by <strong>demonstrated performance</strong> —
            not keywords.
          </p>

          <div className={styles.actions}>
            <Link className={styles.primaryAction} href="/signup">
              Start Hiring Now
              <ArrowRight size={19} aria-hidden="true" />
            </Link>
            <a className={styles.secondaryAction} href="#how-it-works">
              <span className={styles.playIcon} aria-hidden="true"><Play size={13} fill="currentColor" /></span>
              Watch Demo
            </a>
          </div>

          <p className={styles.jobsLink}>
            Looking for your next role? <Link href="/jobs">Explore open jobs <ArrowRight size={14} aria-hidden="true" /></Link>
          </p>

          <div className={styles.stats} aria-label="Platform highlights">
            {heroStats.map((stat, index) => (
              <div className={styles.stat} key={stat.label}>
                <span className={styles.statIcon} aria-hidden="true">
                  {index === 0 ? <UserRound /> : index === 1 ? <BriefcaseBusiness /> : <ShieldCheck />}
                </span>
                <span className={styles.statCopy}>
                  <strong>{stat.display}</strong>
                  <span>{stat.label}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.visual} role="group" aria-label="JobMatch hiring and learning platform overview">
          <div className={styles.visualArtwork}>
          <div className={`${styles.orbit} ${styles.orbitOuter}`} />
          <div className={`${styles.orbit} ${styles.orbitInner}`} />
          <div className={styles.platformGlow} />

          <div className={styles.platform} aria-hidden="true">
            <div className={`${styles.platformLayer} ${styles.platformBottom}`} />
            <div className={`${styles.platformLayer} ${styles.platformMiddle}`} />
            <div className={`${styles.platformLayer} ${styles.platformUpper}`} />
            <div className={styles.platformTop}>
              <Link2 size={66} strokeWidth={2.8} />
            </div>
          </div>

          <article className={`${styles.floatCard} ${styles.candidateCard}`}>
            <div className={styles.candidateHead}>
              <div className={styles.personBadge}><UserRound size={27} aria-hidden="true" /></div>
              <span className={styles.verified}><Check size={13} aria-hidden="true" /></span>
            </div>
            <strong>Top Candidate</strong>
            <span className={styles.cardLine} />
            <span className={`${styles.cardLine} ${styles.shortLine}`} />
          </article>

          <article className={`${styles.floatCard} ${styles.scoreCard}`}>
            <span className={styles.cardKicker}>Hiring fit score</span>
            <div className={styles.scoreRow}>
              <strong>{stats[2]?.display || "85%"}</strong>
              <TrendingUp size={43} aria-hidden="true" />
            </div>
            <div className={styles.scoreTrack}><span /></div>
            <span className={styles.scoreCaption}>Skills matched with confidence</span>
          </article>

          <article className={`${styles.floatCard} ${styles.learningCard}`}>
            <div className={styles.learningTitle}>
              <GraduationCap size={26} aria-hidden="true" />
              <strong>Personalized<br />Learning Plan</strong>
            </div>
            <ul>
              {LEARNING_STEPS.map((step) => (
                <li key={step}><span><Check size={11} aria-hidden="true" /></span>{step}</li>
              ))}
            </ul>
          </article>

          <article className={`${styles.floatCard} ${styles.skillsCard}`}>
            <div className={styles.miniCardTitle}>
              <SearchCheck size={29} aria-hidden="true" />
              <strong>Skill Assessment</strong>
            </div>
            <div className={styles.skillBars} aria-hidden="true"><i /><i /><i /></div>
            <span className={styles.skillComplete}><Check size={14} aria-hidden="true" /></span>
          </article>

          <article className={`${styles.floatCard} ${styles.jobsCard}`}>
            <div className={styles.jobIcon}><BriefcaseBusiness size={27} aria-hidden="true" /></div>
            <div className={styles.jobCopy}>
              <strong>Job Opportunities</strong>
              <span className={styles.cardLine} />
              <span className={`${styles.cardLine} ${styles.shortLine}`} />
            </div>
            <span className={styles.jobArrow}><ArrowRight size={16} aria-hidden="true" /></span>
          </article>
          </div>
        </div>
      </div>
    </section>
  );
}
