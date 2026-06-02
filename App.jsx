import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from "recharts";

// Simulated MSCI World annual returns (2000-2024)
const MSCI_ANNUAL = {
  2000: -13.2, 2001: -16.8, 2002: -19.9, 2003: 33.1, 2004: 14.7,
  2005: 9.5, 2006: 20.1, 2007: 9.0, 2008: -40.7, 2009: 30.0,
  2010: 11.8, 2011: -5.5, 2012: 15.8, 2013: 26.7, 2014: 4.9,
  2015: -0.9, 2016: 7.5, 2017: 22.4, 2018: -8.7, 2019: 27.7,
  2020: 15.9, 2021: 21.8, 2022: -18.1, 2023: 23.8, 2024: 18.2,
};

// Preset car models with historical appreciation data
const CAR_PRESETS = {
  "Ferrari 308 GTS": { buyYear: 2000, buyPrice: 28000, currentPrice: 95000, color: "#c0392b", description: "Rendue célèbre par Magnum P.I., la 308 GTS a triplé de valeur en 25 ans." },
  "Porsche 911 (993)": { buyYear: 2000, buyPrice: 35000, currentPrice: 180000, color: "#2c3e50", description: "La dernière 911 refroidie par air. Devenue le Graal des collectionneurs." },
  "Alpine A110 (1973)": { buyYear: 2000, buyPrice: 22000, currentPrice: 85000, color: "#2980b9", description: "Icône française du rallye, sa cote ne cesse de grimper depuis 15 ans." },
  "Mercedes 300SL Gullwing": { buyYear: 2000, buyPrice: 450000, currentPrice: 1800000, color: "#7f8c8d", description: "Le summum du classique allemand. Performances d'investissement exceptionnelles." },
  "Lancia Delta Integrale": { buyYear: 2005, buyPrice: 12000, currentPrice: 65000, color: "#e74c3c", description: "Championne du monde des rallyes, sa cote a explosé ces 10 dernières années." },
};

function computeCarGrowth(buyPrice, currentPrice, buyYear, endYear = 2024) {
  const years = endYear - buyYear;
  const cagr = (Math.pow(currentPrice / buyPrice, 1 / years) - 1) * 100;
  // Simulate year by year with some volatility
  const data = [];
  let val = buyPrice;
  for (let y = buyYear; y <= endYear; y++) {
    data.push({ year: y, value: Math.round(val) });
    // Add slight randomness around CAGR
    const noise = (Math.random() - 0.5) * cagr * 0.4;
    val = val * (1 + (cagr + noise) / 100);
  }
  // Force last point to be currentPrice
  data[data.length - 1].value = currentPrice;
  return { data, cagr: cagr.toFixed(1) };
}

function computeMSCI(initialInvestment, buyYear, endYear = 2024) {
  const data = [];
  let val = initialInvestment;
  for (let y = buyYear; y <= endYear; y++) {
    data.push({ year: y, value: Math.round(val) });
    const ret = MSCI_ANNUAL[y] ?? 8;
    val = val * (1 + ret / 100);
  }
  return data;
}

function mergeData(carData, msciData) {
  const map = {};
  carData.forEach(d => { map[d.year] = { year: d.year, voiture: d.value }; });
  msciData.forEach(d => { if (map[d.year]) map[d.year].msci = d.value; });
  return Object.values(map).sort((a, b) => a.year - b.year);
}

function formatEur(v) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M€`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k€`;
  return `${Math.round(v)}€`;
}

function Badge({ children, color = "#1a1a1a" }) {
  return (
    <span style={{
      fontSize: 11, fontFamily: "'DM Mono', monospace",
      background: `${color}15`, color,
      border: `1px solid ${color}30`,
      borderRadius: 20, padding: "3px 10px",
      display: "inline-block",
    }}>{children}</span>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "#fffef9", border: "1px solid #e5e0d5",
        borderRadius: 10, padding: "12px 16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        fontFamily: "'DM Mono', monospace", fontSize: 12,
      }}>
        <div style={{ color: "#999", marginBottom: 8, fontFamily: "'Cormorant Garamond', serif", fontSize: 15 }}>
          {label}
        </div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, marginBottom: 3 }}>
            {p.name} : <strong>{formatEur(p.value)}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function App() {
  const [mode, setMode] = useState("preset"); // "preset" | "custom"
  const [selectedPreset, setSelectedPreset] = useState("Porsche 911 (993)");
  const [customName, setCustomName] = useState("");
  const [customBuyYear, setCustomBuyYear] = useState(2010);
  const [customBuyPrice, setCustomBuyPrice] = useState(20000);
  const [customCurrentPrice, setCustomCurrentPrice] = useState(45000);
  const [analyzed, setAnalyzed] = useState(false);
  const [result, setResult] = useState(null);

  const analyze = () => {
    let name, buyYear, buyPrice, currentPrice, description, color;
    if (mode === "preset") {
      const p = CAR_PRESETS[selectedPreset];
      name = selectedPreset;
      buyYear = p.buyYear; buyPrice = p.buyPrice;
      currentPrice = p.currentPrice;
      description = p.description; color = p.color;
    } else {
      name = customName || "Ma voiture";
      buyYear = customBuyYear;
      buyPrice = customBuyPrice;
      currentPrice = customCurrentPrice;
      description = null;
      color = "#8b6f47";
    }

    const endYear = 2024;
    const { data: carData, cagr } = computeCarGrowth(buyPrice, currentPrice, buyYear, endYear);
    const msciData = computeMSCI(buyPrice, buyYear, endYear);
    const msciCagr = ((Math.pow(msciData[msciData.length - 1].value / buyPrice, 1 / (endYear - buyYear)) - 1) * 100).toFixed(1);
    const merged = mergeData(carData, msciData);
    const carFinal = currentPrice;
    const msciFinal = msciData[msciData.length - 1].value;
    const winner = carFinal > msciFinal ? "voiture" : "msci";
    const diff = Math.abs(carFinal - msciFinal);

    setResult({ name, buyYear, buyPrice, currentPrice, description, color, cagr, msciCagr, merged, carFinal, msciFinal, winner, diff, endYear });
    setAnalyzed(true);
  };

  const reset = () => { setAnalyzed(false); setResult(null); };

  return (
    <div style={{ minHeight: "100vh", background: "#faf9f5", fontFamily: "'DM Sans', sans-serif", color: "#1a1a1a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, select { font-family: 'DM Sans', sans-serif; outline: none; }
        input[type=range] { -webkit-appearance: none; width: 100%; height: 2px; background: #ddd; border-radius: 2px; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #1a1a1a; cursor: pointer; }
        .tab { background: none; border: 1px solid #e0dbd0; border-radius: 8px; padding: 8px 18px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; color: #888; transition: all 0.2s; }
        .tab.active { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
        .car-card { border: 1px solid #e8e3d8; border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: all 0.2s; background: #fff; }
        .car-card:hover { border-color: #aaa; }
        .car-card.active { border-color: #1a1a1a; background: #faf9f5; }
        .stat { background: #fff; border: 1px solid #e8e3d8; border-radius: 12px; padding: 18px 20px; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #e8e3d8", padding: "24px 48px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.2em", fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>
              Analyse Patrimoine · Automobile de Collection
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 600, letterSpacing: "-0.01em" }}>
              Voiture de collection vs MSCI World
            </h1>
          </div>
          <div style={{ fontSize: 12, color: "#bbb", textAlign: "right", fontFamily: "'DM Mono', monospace" }}>
            Données simulées<br />à titre indicatif
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 48px" }}>
        {!analyzed ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
            {/* LEFT */}
            <div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 400, marginBottom: 6 }}>
                Choisissez un modèle<br />
                <em style={{ color: "#888" }}>à analyser</em>
              </h2>
              <p style={{ fontSize: 13, color: "#aaa", marginBottom: 24, lineHeight: 1.6 }}>
                Sélectionnez un modèle iconique ou entrez vos propres données pour comparer la performance d'une voiture de collection face aux marchés financiers.
              </p>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                <button className={`tab ${mode === "preset" ? "active" : ""}`} onClick={() => setMode("preset")}>
                  Modèles iconiques
                </button>
                <button className={`tab ${mode === "custom" ? "active" : ""}`} onClick={() => setMode("custom")}>
                  Saisie manuelle
                </button>
              </div>

              {mode === "preset" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Object.entries(CAR_PRESETS).map(([name, p]) => (
                    <div
                      key={name}
                      className={`car-card ${selectedPreset === name ? "active" : ""}`}
                      onClick={() => setSelectedPreset(name)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 3 }}>{name}</div>
                          <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.5 }}>{p.description}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#1a6b3c" }}>
                            {formatEur(p.currentPrice)}
                          </div>
                          <div style={{ fontSize: 11, color: "#ccc" }}>depuis {p.buyYear}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>Nom du modèle</label>
                    <input
                      type="text"
                      placeholder="Ex: Alfa Romeo Spider 1970"
                      value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      style={{ width: "100%", border: "1px solid #e0dbd0", borderRadius: 8, padding: "10px 14px", fontSize: 14, background: "#fff" }}
                    />
                  </div>
                  {[
                    { label: "Année d'achat", value: customBuyYear, set: setCustomBuyYear, min: 2000, max: 2020, step: 1, fmt: v => v },
                    { label: "Prix d'achat", value: customBuyPrice, set: setCustomBuyPrice, min: 5000, max: 500000, step: 1000, fmt: formatEur },
                    { label: "Valeur actuelle (2024)", value: customCurrentPrice, set: setCustomCurrentPrice, min: 5000, max: 2000000, step: 1000, fmt: formatEur },
                  ].map(({ label, value, set, min, max, step, fmt }) => (
                    <div key={label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <label style={{ fontSize: 12, color: "#888" }}>{label}</label>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500 }}>{fmt(value)}</span>
                      </div>
                      <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(+e.target.value)} />
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={analyze}
                style={{
                  marginTop: 28, width: "100%",
                  background: "#1a1a1a", color: "#fff",
                  border: "none", borderRadius: 12,
                  padding: "16px", fontSize: 15, fontWeight: 500,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: "0.01em",
                }}
              >
                Analyser l'investissement →
              </button>
            </div>

            {/* RIGHT — intro visual */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px 20px" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 80, color: "#f0ebe0", textAlign: "center", lineHeight: 1, marginBottom: 32 }}>
                🏎
              </div>
              <div style={{ textAlign: "center", maxWidth: 320 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 400, marginBottom: 12, color: "#888" }}>
                  <em>« La passion peut-elle être un investissement ? »</em>
                </div>
                <p style={{ fontSize: 13, color: "#bbb", lineHeight: 1.7 }}>
                  Certaines voitures de collection ont surperformé les indices boursiers sur 20 ans. D'autres ont perdu la moitié de leur valeur. Analysez, comparez, décidez.
                </p>
              </div>
            </div>
          </div>
        ) : result && (
          <div>
            {/* Result header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
              <div>
                <div style={{ fontSize: 10, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.2em", fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>
                  Analyse · {result.buyYear} → {result.endYear}
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 8 }}>
                  {result.name}
                </h2>
                {result.description && (
                  <p style={{ fontSize: 14, color: "#888", maxWidth: 500, lineHeight: 1.6 }}>{result.description}</p>
                )}
              </div>
              <button onClick={reset} style={{
                fontSize: 13, color: "#888", background: "#fff",
                border: "1px solid #e8e3d8", borderRadius: 8,
                padding: "8px 16px", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                ← Nouvelle analyse
              </button>
            </div>

            {/* Verdict banner */}
            <div style={{
              background: result.winner === "voiture" ? "#f0faf4" : "#faf0f0",
              border: `1px solid ${result.winner === "voiture" ? "#bbf7d0" : "#fecaca"}`,
              borderRadius: 14, padding: "20px 28px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 28,
            }}>
              <div>
                <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>Verdict</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 600 }}>
                  {result.winner === "voiture"
                    ? `La ${result.name} a battu le MSCI World 🏆`
                    : `Le MSCI World a surpassé la ${result.name} 📈`}
                </div>
                <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
                  Écart de <strong style={{ color: "#1a1a1a" }}>{formatEur(result.diff)}</strong> sur {result.endYear - result.buyYear} ans pour un investissement initial de {formatEur(result.buyPrice)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#aaa", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Avantage</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 38, fontWeight: 600, color: result.winner === "voiture" ? "#1a6b3c" : "#b91c1c" }}>
                  +{formatEur(result.diff)}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
              {[
                { label: "Achat", value: formatEur(result.buyPrice), sub: `en ${result.buyYear}` },
                { label: "Valeur voiture", value: formatEur(result.carFinal), sub: `CAGR ${result.cagr}%/an`, color: result.color },
                { label: "MSCI World", value: formatEur(result.msciFinal), sub: `CAGR ${result.msciCagr}%/an`, color: "#2563eb" },
                { label: "Plus-value voiture", value: formatEur(result.carFinal - result.buyPrice), sub: `×${(result.carFinal / result.buyPrice).toFixed(1)} la mise`, color: "#1a6b3c" },
              ].map((s, i) => (
                <div key={i} className="stat">
                  <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: s.color || "#1a1a1a" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#bbb", fontFamily: "'DM Mono', monospace", marginTop: 3 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div style={{ background: "#fff", border: "1px solid #e8e3d8", borderRadius: 14, padding: "24px 16px 16px" }}>
              <div style={{ padding: "0 12px 16px", display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontSize: 13, color: "#888" }}>Évolution comparée · {result.buyYear}–{result.endYear}</div>
                <div style={{ display: "flex", gap: 16 }}>
                  <span style={{ fontSize: 12, color: result.color }}>● {result.name}</span>
                  <span style={{ fontSize: 12, color: "#2563eb" }}>● MSCI World</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={result.merged} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe0" />
                  <XAxis dataKey="year" stroke="#ddd" tick={{ fill: "#bbb", fontSize: 11, fontFamily: "'DM Mono', monospace" }} />
                  <YAxis stroke="#ddd" tick={{ fill: "#bbb", fontSize: 11, fontFamily: "'DM Mono', monospace" }} tickFormatter={formatEur} width={70} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={result.buyPrice} stroke="#eee" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="voiture" name={result.name} stroke={result.color} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="msci" name="MSCI World" stroke="#2563eb" strokeWidth={2} strokeDasharray="6 3" dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Disclaimer */}
            <div style={{ marginTop: 20, padding: "14px 20px", background: "#f5f3ee", borderRadius: 10, fontSize: 12, color: "#aaa", lineHeight: 1.6 }}>
              ⚠️ Les données de cote automobile sont simulées à partir de tendances de marché générales et ne constituent pas des données réelles. 
              Les performances passées ne présagent pas des performances futures. Cette analyse est fournie à titre éducatif uniquement.
              Les voitures de collection impliquent des coûts cachés (entretien, assurance, stockage) non pris en compte ici.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
