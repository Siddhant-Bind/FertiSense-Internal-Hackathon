import { Link } from "react-router-dom";
import Header from "../components/Header";

export default function Landing() {
  return (
    <>
      <Header />
      <main>
        <section className="wrap hero">
          <div>
            <h1>Feed your soil what it needs. Nothing more.</h1>
            <p className="lede">
              FertiSense reads your district, soil and crop, then tells you which fertilizer to buy, how many bags,
              and on which days to apply it. Less waste, healthier soil, better yield.
            </p>
            <div className="ctas">
              <Link to="/signup" className="btn btn-primary btn-lg">Create free account</Link>
              <Link to="/signin" className="btn btn-ghost btn-lg">I already have an account</Link>
            </div>
          </div>

          <div className="soil-card" aria-label="Example soil reading">
            <div className="sky">
              <svg viewBox="0 0 320 70" aria-hidden="true">
                {[40, 110, 180, 250].map((x) => (
                  <g key={x}>
                    <path d={`M${x} 70V34`} stroke="var(--green)" strokeWidth="3" strokeLinecap="round" />
                    <path d={`M${x} 48c-11 0-16-7-16-16 11 0 16 7 16 16z`} fill="var(--green)" opacity=".85" />
                    <path d={`M${x} 40c9 0 14-6 14-14-9 0-14 6-14 14z`} fill="var(--green)" />
                  </g>
                ))}
              </svg>
            </div>
            <div className="layers">
              <div style={{ background: "var(--soil-1)" }}><span>Nitrogen (N)</span><span><b>190</b> kg/ha <span className="tag">Low</span></span></div>
              <div style={{ background: "var(--soil-2)" }}><span>Phosphorus (P)</span><span><b>14</b> kg/ha <span className="tag">Medium</span></span></div>
              <div style={{ background: "var(--soil-3)" }}><span>Potassium (K)</span><span><b>310</b> kg/ha <span className="tag">High</span></span></div>
            </div>
            <div className="verdict">
              <span className="small muted">Wheat · Loamy soil · per acre</span>
              <span className="small"><b>69 kg 14-35-14 + 111 kg urea</b>, split in 3 doses</span>
            </div>
          </div>
        </section>

        <section className="wrap steps" aria-label="How it works">
          <article>
            <div className="num">1</div>
            <h3>Sign up with your district</h3>
            <p className="muted">Your district, then your village, brings in local Soil Health Card averages from nearly 88,000 villages.</p>
          </article>
          <article>
            <div className="num">2</div>
            <h3>Pick soil, crop and stage</h3>
            <p className="muted">Tell us the crop's current growth stage and what you applied last season.</p>
          </article>
          <article>
            <div className="num">3</div>
            <h3>Get your report</h3>
            <p className="muted">What to apply now and at later stages, cost per acre, and how it compares with what you used before.</p>
          </article>
        </section>

        <section className="band" aria-label="Why it matters">
          <div className="wrap">
            <div><b>11 crops</b><p>Paddy, wheat, maize, millets, barley, pulses, oil seeds, ground nuts, cotton, sugarcane and tobacco, with stage-wise split doses.</p></div>
            <div><b>±25% dose</b><p>Doses adjust to your soil rating, so you stop paying for nutrients the soil already has.</p></div>
            <div><b>7 fertilizers</b><p>Urea, DAP, 28-28, 14-35-14, 20-20, 17-17-17 and 10-26-26, converted into kg and bags you can buy.</p></div>
          </div>
        </section>

        <section className="wrap cta-end">
          <h2>Plan your next sowing before you visit the fertilizer shop.</h2>
          <Link to="/signup" className="btn btn-primary btn-lg">Create free account</Link>
        </section>
      </main>
      <footer className="foot"><div className="wrap">FertiSense · PSAI01 · Internal Hackathon 2026–27. Recommendations are advisory; confirm with your local Krishi Vigyan Kendra.</div></footer>
    </>
  );
}
