import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BrandLockup } from '../components/ui/Logo';
import { calculateISV } from '../lib/isv';

const FUEL_OPTIONS = ['Gasolina', 'Diesel'];
const AGE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function euro(value) {
  return `€${Math.round(value).toLocaleString('pt-PT')}`;
}

export default function IsvCalculator() {
  const [cc, setCc] = useState(1998);
  const [co2, setCo2] = useState(120);
  const [fuel, setFuel] = useState('Gasolina');
  const [ageYears, setAgeYears] = useState(3);
  const [isPhev, setIsPhev] = useState(false);
  const [isNonEu, setIsNonEu] = useState(false);

  const result = useMemo(
    () => calculateISV(Number(cc) || 0, Number(co2) || 0, fuel, Number(ageYears), isPhev, isNonEu),
    [cc, co2, fuel, ageYears, isPhev, isNonEu]
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--obsidian)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem 2rem', borderBottom: '1px solid var(--hairline)' }}>
        <Link to="/login" aria-label="Crivo">
          <BrandLockup markSize={28} wordSize={16} />
        </Link>
        <Link to="/login" style={{ color: 'var(--emerald)', fontSize: 13, fontWeight: 500 }}>
          Criar conta para receber alertas →
        </Link>
      </header>

      <div style={{ flex: 1, width: '100%', maxWidth: 880, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
          Calculadora de ISV
        </h1>
        <p style={{ color: 'var(--ash)', fontSize: 13, marginBottom: '2rem', maxWidth: 560 }}>
          Estime o Imposto Sobre Veículos a pagar na importação de um automóvel usado para Portugal.
        </p>

        <div className="isv-grid">
          <div className="card">
            <div className="card__body stack gap-5">
              <div className="form-grid-2">
                <div className="field">
                  <label className="field__label" htmlFor="isv-cc">Cilindrada (cm³)</label>
                  <input id="isv-cc" type="number" className="input" min="0" value={cc} onChange={e => setCc(e.target.value)} />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="isv-co2">Emissões CO₂ (g/km, WLTP)</label>
                  <input id="isv-co2" type="number" className="input" min="0" value={co2} onChange={e => setCo2(e.target.value)} />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="field">
                  <label className="field__label" htmlFor="isv-fuel">Combustível</label>
                  <select id="isv-fuel" className="select" value={fuel} onChange={e => setFuel(e.target.value)}>
                    {FUEL_OPTIONS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="isv-age">Idade do veículo</label>
                  <select id="isv-age" className="select" value={ageYears} onChange={e => setAgeYears(e.target.value)}>
                    {AGE_OPTIONS.map(a => (
                      <option key={a} value={a}>{a === 10 ? '10+ anos' : a === 1 ? '1 ano' : `${a} anos`}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="stack gap-3" style={{ borderTop: '1px solid var(--hairline)', paddingTop: 16 }}>
                <label className="row gap-2" style={{ cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={isPhev} onChange={e => setIsPhev(e.target.checked)} style={{ accentColor: 'var(--emerald)' }} />
                  Híbrido plug-in (PHEV)
                </label>
                <label className="row gap-2" style={{ cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={isNonEu} onChange={e => setIsNonEu(e.target.checked)} style={{ accentColor: 'var(--emerald)' }} />
                  Origem fora da União Europeia
                </label>
              </div>
            </div>
          </div>

          <div className="card" style={{ position: 'sticky', top: 24 }}>
            <div className="card__body stack gap-3">
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>Resultado</h2>
              <div className="row" style={{ justifyContent: 'space-between', fontSize: 13 }}>
                <span className="muted">Componente cilindrada</span>
                <span>{euro(result.ccComponent)}</span>
              </div>
              <div className="row" style={{ justifyContent: 'space-between', fontSize: 13 }}>
                <span className="muted">Componente ambiental (CO₂)</span>
                <span>{euro(result.co2Component)}</span>
              </div>
              <div className="row" style={{ justifyContent: 'space-between', fontSize: 13 }}>
                <span className="muted">Desconto por idade</span>
                <span>−{euro(result.ageDiscountAmount)}</span>
              </div>
              {isPhev && Number(co2) <= 50 && (
                <div className="row" style={{ justifyContent: 'space-between', fontSize: 13 }}>
                  <span className="muted">Redução PHEV</span>
                  <span>75%</span>
                </div>
              )}
              <div className="row" style={{ justifyContent: 'space-between', borderTop: '1px solid var(--hairline)', paddingTop: 12, marginTop: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>ISV a pagar</span>
                <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--emerald)' }}>
                  {euro(result.isvPayable)}
                </span>
              </div>
              <p className="muted" style={{ fontSize: 11, lineHeight: 1.5, marginTop: 8 }}>
                Estimativa indicativa baseada na tabela de 2026 — não substitui a simulação oficial da Autoridade Tributária.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ padding: '1.25rem 2rem', borderTop: '1px solid var(--hairline)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', fontSize: 12, color: 'var(--dust)' }}>
        <span>© 2026 Crivo</span>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link to="/termos">Termos</Link>
          <Link to="/privacidade">Privacidade</Link>
        </div>
      </footer>
    </div>
  );
}
