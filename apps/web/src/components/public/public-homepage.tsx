"use client";

import Link from "next/link";
import { ArrowDown, ArrowUpRight, ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { en } from "@/i18n/en";
import { ne } from "@/i18n/ne";

const copyByLocale = { en, ne } as const;

export function PublicHomePage() {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const copy = copyByLocale[locale];

  useEffect(() => {
    const saved = window.localStorage.getItem("mitra-locale");
    if (isLocale(saved)) setLocale(saved);
  }, []);

  function changeLocale(next: Locale) {
    setLocale(next);
    window.localStorage.setItem("mitra-locale", next);
  }

  return (
    <main className="mitra-site">
      <header className="mitra-header">
        <Link className="mitra-logo" href="/" aria-label="MITRA home"><span>M</span>ITRA</Link>
        <nav className="mitra-nav" aria-label="Public navigation">
          {copy.nav.map((label, index) => <a href={`#${["about", "engineering", "services", "projects", "technology", "team", "careers", "insights", "contact"][index]}`} key={label}>{label}</a>)}
        </nav>
        <div className="mitra-header-actions">
          <label className="mitra-language"><span className="sr-only">Language</span><select value={locale} onChange={(event) => changeLocale(event.target.value as Locale)}><option value="en">EN</option><option value="ne">ने</option></select><ChevronDown size={14} /></label>
          <Link className="beos-link" href="/login">BEOS <ArrowUpRight size={13} /></Link>
        </div>
      </header>

      <section className="mitra-hero" id="about">
        <div className="mitra-hero-copy">
          <p className="mitra-kicker"><span />{copy.heroEyebrow}</p>
          <h1>{copy.heroTitle}</h1>
          <p className="mitra-lede">{copy.heroCopy}</p>
          <div className="mitra-actions"><a className="mitra-button mitra-button-primary" href="#engineering">{copy.explore} <ArrowUpRight size={17} /></a><a className="mitra-button mitra-button-quiet" href="#contact">{copy.conversation}</a></div>
        </div>
        <div className="mitra-hero-visual" aria-label="Engineering image placeholder">
          <div className="coordinate coordinate-top">27°42′N / 85°19′E</div><div className="coordinate coordinate-bottom">FIELD / 01</div>
          <div className="blueprint-ring ring-one" /><div className="blueprint-ring ring-two" /><div className="blueprint-cross" /><div className="blueprint-line" />
          <div className="image-placeholder"><span>REAL FIELD IMAGE<br />TO BE PLACED HERE</span></div>
        </div>
        <a className="scroll-cue" href="#engineering"><ArrowDown size={16} /> SCROLL TO CONNECT</a>
      </section>

      <section className="mitra-section capability-section" id="engineering">
        <div className="section-intro"><p className="mitra-kicker"><span />01 / CAPABILITIES</p><h2>{copy.builds}</h2><p>{copy.buildsCopy}</p></div>
        <div className="capability-grid">{copy.capabilities.map((capability, index) => <a className="capability-item" href="#contact" key={capability}><span className="capability-number">0{index + 1}</span><strong>{capability}</strong><ArrowUpRight size={18} /></a>)}</div>
      </section>

      <section className="mitra-section system-section" id="services">
        <div className="section-intro"><p className="mitra-kicker"><span />02 / CONNECTIONS</p><h2>{copy.system}</h2><p>{copy.systemCopy}</p></div>
        <div className="system-diagram">{["Sensors", "Devices", "Control", "Data", "Software", "Decisions"].map((item, index) => <div className="system-node" key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong>{index < 5 && <i aria-hidden="true" />}</div>)}</div>
      </section>

      <section className="mitra-section featured-section" id="projects">
        <div className="section-intro"><p className="mitra-kicker"><span />03 / FIELD NOTES</p><h2>{copy.featured}</h2></div>
        <article className="featured-placeholder"><div className="placeholder-grid" /><div><p className="mitra-kicker">PUBLISHING READY</p><h3>{copy.publish}</h3><p>{copy.publishCopy}</p><dl><div><dt>Technology</dt><dd>—</dd></div><div><dt>Location</dt><dd>—</dd></div><div><dt>Status</dt><dd>—</dd></div></dl></div></article>
      </section>

      <section className="mitra-section people-section" id="team">
        <div className="section-intro"><p className="mitra-kicker"><span />04 / PEOPLE</p><h2>{copy.team}</h2><p>{copy.teamCopy}</p></div>
        <TeamMember name="MITRA team" role="Coming soon" description={copy.teamCopy} />
      </section>

      <section className="mitra-section technology-section" id="technology">
        <div className="section-intro"><p className="mitra-kicker"><span />05 / PLATFORM</p><h2>{copy.technology}</h2></div>
        <div className="technology-lockup"><span>Engineering</span><b>+</b><span>IoT</span><b>+</b><span>Software</span><b>+</b><span>Data</span></div>
      </section>

      <section className="mitra-contact" id="contact"><p className="mitra-kicker"><span />06 / OPEN CHANNEL</p><h2>{copy.contact}</h2><div className="mitra-actions"><a className="mitra-button mitra-button-primary" href="#contact">{copy.conversation} <ArrowUpRight size={17} /></a><a className="mitra-button mitra-button-quiet" href="#about">{copy.explore}</a></div></section>

      <footer className="mitra-footer"><Link className="mitra-logo" href="/"><span>M</span>ITRA</Link><div className="footer-links">{copy.nav.map((label, index) => <a href={`#${["about", "engineering", "services", "projects", "technology", "team", "careers", "insights", "contact"][index]}`} key={label}>{label}</a>)}</div><div className="footer-meta"><span>EN / ने</span><Link href="/login">{copy.official}</Link></div></footer>

      <button className="mitra-assistant-trigger" onClick={() => setAssistantOpen((open) => !open)} aria-expanded={assistantOpen} aria-controls="mitra-assistant">MITRA</button>
      {assistantOpen && <aside className="mitra-assistant" id="mitra-assistant" aria-label="MITRA assistant"><button className="assistant-close" onClick={() => setAssistantOpen(false)} aria-label="Close assistant"><X size={17} /></button><p className="mitra-kicker"><span />MITRA / ASSISTANT</p><h2>{copy.assistant}</h2><div>{copy.assistantOptions.map((option) => <a href="#contact" key={option} onClick={() => setAssistantOpen(false)}>{option}<ArrowUpRight size={15} /></a>)}</div></aside>}
    </main>
  );
}

export function TeamMember({ name, role, image, description, social }: { name: string; role: string; image?: string; description: string; social?: string }) {
  return <article className="team-member">{image ? <img src={image} alt="" /> : <div className="team-image-placeholder">TEAM<br />PORTRAIT</div>}<div><p className="mitra-kicker"><span />{role}</p><h3>{name}</h3><p>{description}</p>{social && <a href={social}>Connect <ArrowUpRight size={15} /></a>}</div></article>;
}
