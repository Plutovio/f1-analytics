import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Trophy, TrendingUp, Shield, 
  LogIn, LogOut, Sun, Moon, Sparkles, RefreshCw, 
  ChevronRight, Award, BarChart3
} from 'lucide-react';
import { SimpleChart } from './components/SimpleChart';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const api = axios.create({ baseURL: API_URL });

// Mappings for teams styling (2026 grid)
export interface TeamStyle {
  bg: string;
  border: string;
  text: string;
  shadow: string;
  badge: string;
  color_hex: string;
  graph_color: string;
}

export const TEAM_STYLES: Record<string, TeamStyle> = {
  'mercedes': { 
    bg: "bg-gradient-to-br from-[#0f172a] via-[#334155] to-[#00d2be]", 
    border: "border-[#00d2be]", 
    text: "text-[#00d2be]", 
    shadow: "shadow-[0_0_15px_rgba(0,210,190,0.5)]", 
    badge: "bg-[#00d2be] text-black",
    color_hex: "#6CD3BF",
    graph_color: "#00d2be"
  },
  'ferrari': { 
    bg: "bg-gradient-to-br from-[#7d0000] via-[#c40000] to-[#ef4444]", 
    border: "border-[#ff2800]", 
    text: "text-white", 
    shadow: "shadow-[0_0_15px_rgba(255,40,0,0.6)]", 
    badge: "bg-[#ff2800] text-white",
    color_hex: "#F91536",
    graph_color: "#ffffff"
  },
  'red_bull': { 
    bg: "bg-gradient-to-br from-[#06192e] via-[#102d55] to-[#1e40af]", 
    border: "border-[#fcd700]", 
    text: "text-[#fcd700]", 
    shadow: "shadow-[0_0_15px_rgba(252,215,0,0.5)]", 
    badge: "bg-[#fcd700] text-[#06192e]",
    color_hex: "#3671C6",
    graph_color: "#fcd700"
  },
  'mclaren': { 
    bg: "bg-gradient-to-br from-[#1c1917] via-[#ea580c] to-[#ff8000]", 
    border: "border-[#ff8000]", 
    text: "text-[#ff8000]", 
    shadow: "shadow-[0_0_15px_rgba(255,128,0,0.5)]", 
    badge: "bg-[#ff8000] text-black",
    color_hex: "#F58020",
    graph_color: "#ff8000"
  },
  'haas': { 
    bg: "bg-gradient-to-br from-[#7f1d1d] via-[#b91c1c] to-[#f87171]", 
    border: "border-[#ffffff]", 
    text: "text-white", 
    shadow: "shadow-[0_0_15px_rgba(255,255,255,0.4)]", 
    badge: "bg-white text-black",
    color_hex: "#B6BABD",
    graph_color: "#ffffff"
  },
  'williams': { 
    bg: "bg-gradient-to-br from-[#172554] via-[#1e40af] to-[#60a5fa]", 
    border: "border-[#60a5fa]", 
    text: "text-[#60a5fa]", 
    shadow: "shadow-[0_0_15px_rgba(96,165,250,0.5)]", 
    badge: "bg-[#005aff] text-white",
    color_hex: "#64C4FF",
    graph_color: "#60a5fa"
  },
  'aston_martin': { 
    bg: "bg-gradient-to-br from-[#002424] via-[#004d4d] to-[#00665e]", 
    border: "border-[#00ff87]", 
    text: "text-[#00ff87]", 
    shadow: "shadow-[0_0_15px_rgba(0,255,135,0.5)]", 
    badge: "bg-[#00ff87] text-black",
    color_hex: "#229971",
    graph_color: "#00ff87"
  },
  'alpine': { 
    bg: "bg-gradient-to-br from-[#091522] via-[#0078c1] to-[#ff4c94]", 
    border: "border-[#0078c1]", 
    text: "text-[#0078c1]", 
    shadow: "shadow-[0_0_15px_rgba(0,120,193,0.5)]", 
    badge: "bg-[#0078c1] text-white",
    color_hex: "#0093CC",
    graph_color: "#ff4c94"
  },
  'rb': { 
    bg: "bg-gradient-to-br from-[#001a4d] via-[#003399] to-[#0055ff]", 
    border: "border-[#ff007f]", 
    text: "text-[#ff007f]", 
    shadow: "shadow-[0_0_15px_rgba(0,85,255,0.5)]", 
    badge: "bg-[#ff007f] text-white",
    color_hex: "#6692FF",
    graph_color: "#ff007f"
  },
  'audi': { 
    bg: "bg-gradient-to-br from-[#000000] via-[#1a1a1a] to-[#e61a0f]", 
    border: "border-[#e61a0f]", 
    text: "text-[#e61a0f]", 
    shadow: "shadow-[0_0_15px_rgba(230,26,15,0.5)]", 
    badge: "bg-[#e61a0f] text-white",
    color_hex: "#000000",
    graph_color: "#e61a0f"
  },
  'cadillac': { 
    bg: "bg-gradient-to-br from-[#1a1a1a] via-[#333333] to-[#ffd700]", 
    border: "border-[#ffd700]", 
    text: "text-[#ffd700]", 
    shadow: "shadow-[0_0_15px_rgba(255,215,0,0.5)]", 
    badge: "bg-[#ffd700] text-black",
    color_hex: "#FCD700",
    graph_color: "#ffd700"
  }
};

const getTeamStyle = (id?: string, name?: string): TeamStyle => {
  const normalizedId = (id || name || 'default').toLowerCase().replace(/\s+racing|\s+f1|\s+team/g, '').trim();
  let styleKey = 'default';
  if (normalizedId.includes('mercedes')) styleKey = 'mercedes';
  else if (normalizedId.includes('ferrari')) styleKey = 'ferrari';
  else if (normalizedId.includes('red bull') || normalizedId.includes('red_bull')) styleKey = 'red_bull';
  else if (normalizedId.includes('mclaren')) styleKey = 'mclaren';
  else if (normalizedId.includes('haas')) styleKey = 'haas';
  else if (normalizedId.includes('williams')) styleKey = 'williams';
  else if (normalizedId.includes('aston')) styleKey = 'aston_martin';
  else if (normalizedId.includes('alpine')) styleKey = 'alpine';
  else if (normalizedId.includes('rb') || normalizedId.includes('racing bulls')) styleKey = 'rb';
  else if (normalizedId.includes('audi')) styleKey = 'audi';
  else if (normalizedId.includes('cadillac')) styleKey = 'cadillac';

  return TEAM_STYLES[styleKey] || {
    bg: "bg-gradient-to-br from-slate-800 to-slate-950",
    border: "border-slate-700",
    text: "text-slate-400",
    shadow: "shadow-none",
    badge: "bg-slate-700 text-slate-200",
    color_hex: "#64748b",
    graph_color: "#64748b"
  };
};

export const RACE_THEMES: Record<string, string> = {
  'Australia': 'from-green-600 to-yellow-500',
  'Bahrain': 'from-red-700 to-red-500',
  'Saudi Arabia': 'from-green-600 to-green-400',
  'China': 'from-red-600 to-yellow-400',
  'Miami': 'from-cyan-400 to-pink-500',
  'Monaco': 'from-red-600 to-white',
  'Spain': 'from-red-600 to-yellow-500',
  'Canada': 'from-red-600 to-white',
  'Austria': 'from-red-600 to-white',
  'UK': 'from-blue-700 via-red-600 to-white',
  'Hungary': 'from-green-600 via-white to-red-600',
  'Belgium': 'from-yellow-500 via-red-500 to-black',
  'Netherlands': 'from-orange-600 to-orange-400',
  'Italy': 'from-green-600 via-white to-red-600',
  'Azerbaijan': 'from-blue-500 via-red-500 to-green-500',
  'Singapore': 'from-purple-900 to-slate-900',
  'USA': 'from-blue-700 via-red-600 to-white',
  'Mexico': 'from-green-600 via-white to-red-600',
  'Brazil': 'from-green-500 to-yellow-400',
  'Las Vegas': 'from-purple-600 to-indigo-800',
  'Qatar': 'from-maroon-700 to-white',
  'UAE': 'from-red-600 via-green-600 to-white',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<number>(-1); // -1: Overview, -2: Profiles, -3: Season Review, -4: All Seasons, -5: Predictions, -6: Comparison, -7: Admin
  const [selectedEntity, setSelectedEntity] = useState<{ type: 'driver' | 'constructor'; id: string } | null>(null);
  const [selectedRaceRound, setSelectedRaceRound] = useState<number | null>(null);
  const [userDriver, setUserDriver] = useState<string>('');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [authToken, setToken] = useState<string>(localStorage.getItem('f1_auth_token') || '');

  // Live Data cache
  const [seasonMetadata, setSeasonMetadata] = useState<any>(null);
  const [driverStandings, setDriverStandings] = useState<any[]>([]);
  const [constructorStandings, setConstructorStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Load basic standings & current season meta
  const fetchGlobalData = async () => {
    setLoading(true);
    try {
      const [metaResp, dsResp, csResp] = await Promise.all([
        api.get('/seasons/current/'),
        api.get('/standings/drivers/'),
        api.get('/standings/constructors/')
      ]);
      setSeasonMetadata(metaResp.data);
      setDriverStandings(dsResp.data);
      setConstructorStandings(csResp.data);
      
      // Auto-select first race round if any are completed
      const firstCompleted = metaResp.data.races.find((r: any) => r.completed);
      if (firstCompleted) {
        setSelectedRaceRound(firstCompleted.round);
      } else if (metaResp.data.races.length > 0) {
        setSelectedRaceRound(metaResp.data.races[0].round);
      }
    } catch (e) {
      console.error("Error loading F1 standings:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGlobalData();
  }, []);

  const triggerSync = async () => {
    setSyncing(true);
    try {
      await api.post('/sync/', { year: 2026 });
      alert("Sync task initiated in background! Check terminal logs or click refresh in a few minutes.");
    } catch (e) {
      alert("Failed to trigger sync: " + e);
    }
    setSyncing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('f1_auth_token');
    setToken('');
  };

  const selectedDriverStyle = useMemo(() => {
    if (!userDriver) return null;
    const standing = driverStandings.find(ds => ds.driver.driver_id === userDriver);
    if (!standing) return null;
    const c_id = standing.driver.current_constructor?.constructor_id;
    return getTeamStyle(c_id);
  }, [userDriver, driverStandings]);

  // View Renderers
  const lastCompletedRace = useMemo(() => {
    if (!seasonMetadata) return null;
    const completed = [...seasonMetadata.races].filter(r => r.completed);
    return completed.length > 0 ? completed[completed.length - 1] : null;
  }, [seasonMetadata]);

  return (
    <div className={`min-h-screen font-sans antialiased text-slate-100 transition-colors duration-300 ${
      darkMode ? 'bg-[#0f172a]' : 'bg-slate-100 text-slate-900 light-mode-vars'
    }`}>
      {/* Dynamic Race-themed background glow */}
      {selectedRaceRound && seasonMetadata && (
        <div className={`absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b opacity-5 pointer-events-none ${
          RACE_THEMES[seasonMetadata.races.find((r: any) => r.round === selectedRaceRound)?.country] || 'from-indigo-500 to-transparent'
        }`} />
      )}

      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-white/5 backdrop-blur-md px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <Shield className="text-red-500 w-8 h-8 filter drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
          <span className="font-mono text-xl font-black tracking-tighter bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300 bg-clip-text text-transparent">
            F1 ANALYTICS PRO
          </span>
          <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-slate-400 font-mono">2026 Season</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Driver Theme Tint Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">TINT THEME:</span>
            <select
              value={userDriver}
              onChange={(e) => setUserDriver(e.target.value)}
              style={selectedDriverStyle ? { borderColor: selectedDriverStyle.color_hex } : {}}
              className={`text-xs rounded-lg px-2.5 py-1.5 border backdrop-blur-md transition-all ${
                selectedDriverStyle ? `${selectedDriverStyle.bg} ${selectedDriverStyle.shadow}` : 'bg-slate-800/80 border-slate-700 text-slate-200'
              }`}
            >
              <option value="" className="bg-slate-900 text-white">Default</option>
              {driverStandings.map((ds) => (
                <option key={ds.driver.driver_id} value={ds.driver.driver_id} className="bg-slate-900 text-white">
                  {ds.driver.code} - {ds.driver.family_name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-white/5 transition-all text-slate-300"
          >
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button
            onClick={fetchGlobalData}
            className={`p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-white/5 transition-all text-slate-300 ${loading ? 'animate-spin' : ''}`}
            title="Refresh Data"
          >
            <RefreshCw size={15} />
          </button>

          <button
            onClick={triggerSync}
            disabled={syncing}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 font-bold border border-red-500/30 text-white flex items-center gap-1.5 shadow-md shadow-red-950/20"
          >
            <Sparkles size={13} />
            {syncing ? "Syncing..." : "Sync Live Data"}
          </button>

          {authToken ? (
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-slate-300 font-bold flex items-center gap-1.5"
            >
              <LogOut size={13} /> Logout
            </button>
          ) : (
            <button
              onClick={() => setActiveTab(-7)}
              className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 font-bold text-white flex items-center gap-1.5 shadow-md shadow-indigo-950/20"
            >
              <LogIn size={13} /> Edit Data
            </button>
          )}
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar / Tab Bar */}
        <div className="lg:col-span-4 flex flex-wrap gap-2 overflow-x-auto scrollbar-hide pb-2 border-b border-white/5">
          <button
            onClick={() => { setActiveTab(-1); setSelectedEntity(null); }}
            className={`px-4 py-2 rounded-full text-xs font-bold font-mono tracking-wider uppercase transition-all border ${
              activeTab === -1 ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800/40 border-white/5 hover:bg-slate-800 text-slate-400'
            }`}
          >
            Season Overview
          </button>
          <button
            onClick={() => { setActiveTab(-2); setSelectedEntity(null); }}
            className={`px-4 py-2 rounded-full text-xs font-bold font-mono tracking-wider uppercase transition-all border ${
              activeTab === -2 ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800/40 border-white/5 hover:bg-slate-800 text-slate-400'
            }`}
          >
            Profiles
          </button>
          <button
            onClick={() => { setActiveTab(-3); setSelectedEntity(null); }}
            className={`px-4 py-2 rounded-full text-xs font-bold font-mono tracking-wider uppercase transition-all border ${
              activeTab === -3 ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800/40 border-white/5 hover:bg-slate-800 text-slate-400'
            }`}
          >
            Season Review
          </button>
          <button
            onClick={() => { setActiveTab(-4); setSelectedEntity(null); }}
            className={`px-4 py-2 rounded-full text-xs font-bold font-mono tracking-wider uppercase transition-all border ${
              activeTab === -4 ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800/40 border-white/5 hover:bg-slate-800 text-slate-400'
            }`}
          >
            All Seasons
          </button>
          <button
            onClick={() => { setActiveTab(-5); setSelectedEntity(null); }}
            className={`px-4 py-2 rounded-full text-xs font-bold font-mono tracking-wider uppercase transition-all border ${
              activeTab === -5 ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800/40 border-white/5 hover:bg-slate-800 text-slate-400'
            }`}
          >
            Predictions
          </button>
          <button
            onClick={() => { setActiveTab(-6); setSelectedEntity(null); }}
            className={`px-4 py-2 rounded-full text-xs font-bold font-mono tracking-wider uppercase transition-all border ${
              activeTab === -6 ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800/40 border-white/5 hover:bg-slate-800 text-slate-400'
            }`}
          >
            Driver H2H
          </button>

          <div className="h-6 w-px bg-white/10 self-center mx-2" />

          {/* Per-Race Tabs list */}
          {seasonMetadata?.races?.map((r: any) => {
            const isSelected = activeTab === r.round;
            const theme = RACE_THEMES[r.country] || 'from-slate-700 to-slate-800';
            return (
              <button
                key={r.round}
                onClick={() => { setActiveTab(r.round); setSelectedRaceRound(r.round); setSelectedEntity(null); }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  isSelected 
                    ? `bg-gradient-to-r ${theme} text-white shadow-md border-transparent` 
                    : 'bg-slate-800/40 border-white/5 hover:bg-slate-800 text-slate-400'
                }`}
              >
                <span>{r.flag}</span>
                <span>{r.locality}</span>
              </button>
            );
          })}
        </div>

        {/* Left main grid area: Views */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="glass-panel rounded-2xl p-12 flex flex-col items-center justify-center gap-4">
              <RefreshCw className="animate-spin text-indigo-400 w-8 h-8" />
              <p className="text-slate-400 font-mono text-sm">Synchronizing current Formula 1 dashboard standings...</p>
            </div>
          ) : selectedEntity ? (
            /* Entity Detail Page */
            selectedEntity.type === 'driver' ? (
              <DriverDetailView driverId={selectedEntity.id} onBack={() => setSelectedEntity(null)} />
            ) : (
              <ConstructorDetailView constructorId={selectedEntity.id} onBack={() => setSelectedEntity(null)} />
            )
          ) : activeTab === -1 ? (
            /* Tab - Season Overview */
            <SeasonOverview standings={driverStandings} constructors={constructorStandings} onSelectDriver={(id) => setSelectedEntity({ type: 'driver', id })} />
          ) : activeTab === -2 ? (
            /* Tab - Profiles */
            <ProfilesView standings={driverStandings} constructors={constructorStandings} onSelectEntity={(type, id) => setSelectedEntity({ type, id })} />
          ) : activeTab === -3 ? (
            /* Tab - Season Review */
            <SeasonReview races={seasonMetadata?.races || []} standings={driverStandings} />
          ) : activeTab === -4 ? (
            /* Tab - All Seasons */
            <AllSeasonsOverview />
          ) : activeTab === -5 ? (
            /* Tab - Predictions */
            <PredictionsView drivers={driverStandings} />
          ) : activeTab === -6 ? (
            /* Tab - Comparison */
            <DriverComparisonView drivers={driverStandings} />
          ) : activeTab === -7 ? (
            /* Tab - Data Editor / Admin */
            <DataEditorView token={authToken} setToken={setToken} races={seasonMetadata?.races || []} />
          ) : (
            /* Per-Race Details View */
            <RaceDetailView round={activeTab} onSelectDriver={(id) => setSelectedEntity({ type: 'driver', id })} />
          )}
        </div>

        {/* Right sticky sidebar */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Spotlight Race Winner Card */}
          {lastCompletedRace && (
            <RaceWinnerSpotlight round={lastCompletedRace.round} onSelectDriver={(id) => setSelectedEntity({ type: 'driver', id })} />
          )}

          {/* Quick Standing Sidebar */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="font-mono font-bold text-xs tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <Trophy size={14} className="text-yellow-400" /> Standings
              </h3>
              <button 
                onClick={() => setActiveTab(-1)}
                className="text-[10px] text-indigo-400 hover:underline uppercase font-bold tracking-widest"
              >
                View Full
              </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {driverStandings.slice(0, 10).map((st, i) => {
                const teamStyle = getTeamStyle(st.driver.current_constructor?.constructor_id);
                return (
                  <div 
                    key={st.driver.driver_id}
                    onClick={() => setSelectedEntity({ type: 'driver', id: st.driver.driver_id })}
                    className="flex justify-between items-center p-2 rounded-lg bg-slate-900/30 hover:bg-slate-800/40 border border-white/5 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-slate-500 w-4">{i + 1}</span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${teamStyle.border} ${teamStyle.bg} ${teamStyle.shadow}`}>
                        {st.driver.code || st.driver.family_name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-200">{st.driver.full_name}</div>
                        <div className="text-[10px] text-slate-500">{st.driver.current_constructor?.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs font-black text-slate-300">{st.points}</div>
                      <div className="text-[9px] text-slate-500 font-mono">{st.wins} wins</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ================= COMPONENT VIEWS =================

// 1. Season Overview
function SeasonOverview({ standings, constructors, onSelectDriver }: { standings: any[]; constructors: any[]; onSelectDriver: (id: string) => void }) {
  const chartLines = useMemo(() => {
    return standings.slice(0, 5).map((st) => {
      const style = getTeamStyle(st.driver.current_constructor?.constructor_id);
      return {
        key: st.driver.driver_id,
        label: st.driver.family_name,
        color: style.color_hex
      };
    });
  }, [standings]);

  // We need to fetch race results over time for the top 5 drivers to map their points progression
  const [progressionData, setProgressionData] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchProgression = async () => {
      try {
        const dataMap: Record<number, Record<string, number>> = {};
        
        // Loop races and add cumulative points
        const promises = standings.slice(0, 5).map(async (st) => {
          const resp = await api.get(`/drivers/${st.driver.driver_id}/`);
          return { id: st.driver.driver_id, history: resp.data.history };
        });

        const results = await Promise.all(promises);
        
        // Accumulate points
        results.forEach(({ id, history }) => {
          let runningTotal = 0;
          history.forEach((h: any) => {
            runningTotal += h.points;
            if (!dataMap[h.round]) dataMap[h.round] = { round: h.round };
            dataMap[h.round][id] = runningTotal;
          });
        });

        const sortedProgression = Object.values(dataMap).sort((a: any, b: any) => a.round - b.round);
        setProgressionData(sortedProgression);
      } catch (e) {
        console.error("Error generating progression data:", e);
      }
    };

    if (standings.length > 0) {
      fetchProgression();
    }
  }, [standings]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-xl">
        <h2 className="text-lg font-mono font-bold uppercase tracking-wider mb-4 text-slate-300 flex items-center gap-2">
          <TrendingUp size={16} className="text-indigo-400" /> Title Battle Points Progression
        </h2>
        <SimpleChart data={progressionData} lines={chartLines} type="line" height={320} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Driver Standings Table */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-xl space-y-4">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-400">Driver Standings</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 font-mono">
                  <th className="py-2">Pos</th>
                  <th className="py-2">Driver</th>
                  <th className="py-2">Constructor</th>
                  <th className="py-2 text-right">Wins</th>
                  <th className="py-2 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {standings.map((st, idx) => (
                  <tr key={st.driver.driver_id} className="hover:bg-white/5 cursor-pointer" onClick={() => onSelectDriver(st.driver.driver_id)}>
                    <td className="py-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 font-bold text-slate-200">{st.driver.full_name}</td>
                    <td className="py-3 text-slate-400">{st.driver.current_constructor?.name}</td>
                    <td className="py-3 text-right font-mono text-slate-400">{st.wins}</td>
                    <td className="py-3 text-right font-mono font-bold text-slate-100">{st.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Constructor Standings Table */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-xl space-y-4">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-400">Constructor Standings</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 font-mono">
                  <th className="py-2">Pos</th>
                  <th className="py-2">Team</th>
                  <th className="py-2 text-right">Wins</th>
                  <th className="py-2 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {constructors.map((st, idx) => {
                  const style = getTeamStyle(st.constructor.constructor_id);
                  return (
                    <tr key={st.constructor.constructor_id} className="hover:bg-white/5">
                      <td className="py-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 font-bold text-slate-200 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: style.color_hex }}></span>
                        {st.constructor.name}
                      </td>
                      <td className="py-3 text-right font-mono text-slate-400">{st.wins}</td>
                      <td className="py-3 text-right font-mono font-bold text-slate-100">{st.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. Profiles (Drivers & Constructors list)
function ProfilesView({ standings, constructors, onSelectEntity }: { standings: any[]; constructors: any[]; onSelectEntity: (type: 'driver' | 'constructor', id: string) => void }) {
  const [filterType, setFilterType] = useState<'drivers' | 'constructors'>('drivers');

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => setFilterType('drivers')}
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest font-mono border transition-all ${
            filterType === 'drivers' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800/40 border-white/5 text-slate-400'
          }`}
        >
          Drivers ({standings.length})
        </button>
        <button
          onClick={() => setFilterType('constructors')}
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest font-mono border transition-all ${
            filterType === 'constructors' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800/40 border-white/5 text-slate-400'
          }`}
        >
          Constructors ({constructors.length})
        </button>
      </div>

      {filterType === 'drivers' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {standings.map((st) => {
            const teamStyle = getTeamStyle(st.driver.current_constructor?.constructor_id);
            return (
              <div
                key={st.driver.driver_id}
                onClick={() => onSelectEntity('driver', st.driver.driver_id)}
                className={`glass-panel rounded-2xl p-5 border border-white/5 transition-all duration-300 card-glow cursor-pointer flex items-center justify-between hover:border-slate-500/20`}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-xs border-2 ${teamStyle.border} ${teamStyle.bg} ${teamStyle.shadow}`}>
                      {st.driver.code}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-200">{st.driver.full_name}</h3>
                      <p className="text-[10px] text-slate-500">{st.driver.current_constructor?.name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div>
                      <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Points</div>
                      <div className="text-sm font-mono font-bold text-slate-300">{st.points}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Wins</div>
                      <div className="text-sm font-mono font-bold text-slate-300">{st.wins}</div>
                    </div>
                  </div>
                </div>
                <ChevronRight className="text-slate-600 w-5 h-5 hover:text-white" />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {constructors.map((st) => {
            const teamStyle = getTeamStyle(st.constructor.constructor_id);
            return (
              <div
                key={st.constructor.constructor_id}
                onClick={() => onSelectEntity('constructor', st.constructor.constructor_id)}
                className={`glass-panel rounded-2xl p-5 border border-white/5 transition-all duration-300 card-glow cursor-pointer hover:border-slate-500/20 flex flex-col justify-between`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: teamStyle.color_hex }}></span>
                    <div>
                      <h3 className="font-bold text-md text-slate-200">{st.constructor.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">{st.constructor.nationality}</p>
                    </div>
                  </div>
                  {st.constructor.logo_url && (
                    <img src={st.constructor.logo_url} alt="" className="w-10 h-10 object-contain team-logo-img opacity-85" />
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-6 border-t border-white/5 pt-4">
                  <div className="text-center">
                    <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Pos</div>
                    <div className="text-sm font-bold font-mono text-slate-300">P{st.position}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Points</div>
                    <div className="text-sm font-bold font-mono text-slate-300">{st.points}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Wins</div>
                    <div className="text-sm font-bold font-mono text-slate-300">{st.wins}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 3. Driver Detail View
function DriverDetailView({ driverId, onBack }: { driverId: string; onBack: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const resp = await api.get(`/drivers/${driverId}/`);
        setProfile(resp.data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [driverId]);

  const chartLines = useMemo(() => {
    if (!profile) return [];
    return [
      { key: 'grid', label: 'Qualifying Grid', color: '#ff6b6b' },
      { key: 'position_val', label: 'Race Finish', color: '#4dabf7' }
    ];
  }, [profile]);

  if (loading || !profile) {
    return (
      <div className="glass-panel rounded-2xl p-12 flex justify-center items-center">
        <RefreshCw className="animate-spin text-indigo-400 w-6 h-6" />
      </div>
    );
  }

  const teamStyle = getTeamStyle(profile.driver.current_constructor?.constructor_id);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-xs text-indigo-400 font-mono uppercase font-bold hover:underline mb-2 flex items-center gap-1">
        ← Back to list
      </button>

      {/* Driver Header Card */}
      <div className={`glass-panel rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden`}>
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-l opacity-10 pointer-events-none ${teamStyle.bg}`} />
        <div className="flex items-center gap-5">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center font-mono font-bold text-xl border-3 ${teamStyle.border} ${teamStyle.bg} ${teamStyle.shadow}`}>
            {profile.driver.code}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-100">{profile.driver.full_name}</h1>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span className="font-mono">{profile.driver.nationality}</span>
              <span>•</span>
              <span className="font-bold" style={{ color: teamStyle.color_hex }}>{profile.driver.current_constructor?.name}</span>
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
          <div className="text-center">
            <div className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Points</div>
            <div className="text-md font-mono font-bold text-slate-200">{profile.stats.points}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Wins</div>
            <div className="text-md font-mono font-bold text-slate-200">{profile.stats.wins}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Podiums</div>
            <div className="text-md font-mono font-bold text-slate-200">{profile.stats.podiums}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Poles</div>
            <div className="text-md font-mono font-bold text-slate-200">{profile.stats.poles}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">DNFs</div>
            <div className="text-md font-mono font-bold text-slate-200">{profile.stats.dnfs}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Avg Start</div>
            <div className="text-md font-mono font-bold text-slate-200">{profile.stats.avg_quali}</div>
          </div>
        </div>
      </div>

      {/* Qualifying vs Finish Chart */}
      <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-xl">
        <h2 className="text-sm font-mono font-bold uppercase tracking-wider mb-4 text-slate-400 flex items-center gap-1.5">
          <BarChart3 size={15} /> Position Progression (Qualifying vs Race Finish)
        </h2>
        <SimpleChart data={profile.history} lines={chartLines} type="line-inverse" height={260} />
      </div>

      {/* History table */}
      <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-xl space-y-4">
        <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-400">Race-by-Race results</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 font-mono">
                <th className="py-2">Round</th>
                <th className="py-2">Grand Prix</th>
                <th className="py-2 text-center">Start</th>
                <th className="py-2 text-center">Finish</th>
                <th className="py-2 text-center">Tyres</th>
                <th className="py-2 text-center">Pits</th>
                <th className="py-2 text-right">Points</th>
                <th className="py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {profile.history.map((h: any) => (
                <tr key={h.round} className="hover:bg-white/5">
                  <td className="py-3 font-mono font-bold text-slate-400">R{h.round}</td>
                  <td className="py-3 font-bold text-slate-200">{h.flag} {h.race_name}</td>
                  <td className="py-3 text-center font-mono text-slate-400">P{h.grid}</td>
                  <td className="py-3 text-center font-mono text-slate-100 font-bold">P{h.position}</td>
                  <td className="py-3 text-center font-mono text-slate-400">{h.tyres || 'N/A'}</td>
                  <td className="py-3 text-center font-mono text-slate-400">{h.pit_stops !== null ? h.pit_stops : 'N/A'}</td>
                  <td className="py-3 text-right font-mono text-slate-200">{h.points}</td>
                  <td className="py-3 text-right text-slate-500 font-mono text-[10px]">{h.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 4. Constructor Detail View
function ConstructorDetailView({ constructorId, onBack }: { constructorId: string; onBack: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const resp = await api.get(`/constructors/${constructorId}/`);
        setProfile(resp.data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [constructorId]);

  if (loading || !profile) {
    return (
      <div className="glass-panel rounded-2xl p-12 flex justify-center items-center">
        <RefreshCw className="animate-spin text-indigo-400 w-6 h-6" />
      </div>
    );
  }

  const teamStyle = getTeamStyle(constructorId);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-xs text-indigo-400 font-mono uppercase font-bold hover:underline mb-2 flex items-center gap-1">
        ← Back to list
      </button>

      <div className={`glass-panel rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden`}>
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-l opacity-15 pointer-events-none ${teamStyle.bg}`} />
        <div className="flex items-center gap-4">
          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: teamStyle.color_hex }}></span>
          <div>
            <h1 className="text-2xl font-black text-slate-100">{profile.constructor.name}</h1>
            <p className="text-xs text-slate-400 font-mono">{profile.constructor.nationality}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 text-center">
          <div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Points</div>
            <div className="text-md font-mono font-bold text-slate-200">{profile.stats.points}</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Wins</div>
            <div className="text-md font-mono font-bold text-slate-200">{profile.stats.wins}</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Podiums</div>
            <div className="text-md font-mono font-bold text-slate-200">{profile.stats.podiums}</div>
          </div>
        </div>
      </div>

      {/* Progression Chart */}
      <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-xl">
        <h2 className="text-sm font-mono font-bold uppercase tracking-wider mb-4 text-slate-400 flex items-center gap-1.5">
          <TrendingUp size={15} /> Team Points Cumulative Progression
        </h2>
        <SimpleChart 
          data={profile.progression} 
          lines={[{ key: 'cumulative_points', label: profile.constructor.name, color: teamStyle.color_hex }]} 
          type="line" 
          height={260} 
        />
      </div>

      {/* Driver Lineup */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {profile.drivers.map((driver: any) => (
          <div 
            key={driver.driver_id}
            className="glass-panel rounded-xl p-5 border border-white/5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs border-2 ${teamStyle.border} ${teamStyle.bg} ${teamStyle.shadow}`}>
                {driver.code}
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-200">{driver.full_name}</h3>
                <p className="text-[10px] text-slate-500">{driver.nationality}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 5. Race Detail View
function RaceDetailView({ round, onSelectDriver }: { round: number; onSelectDriver: (id: string) => void }) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const resp = await api.get(`/races/${round}/`);
        setDetails(resp.data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchDetails();
  }, [round]);

  if (loading || !details) {
    return (
      <div className="glass-panel rounded-2xl p-12 flex justify-center items-center">
        <RefreshCw className="animate-spin text-indigo-400 w-6 h-6" />
      </div>
    );
  }

  const raceTheme = RACE_THEMES[details.race.country] || 'from-slate-700 to-slate-800';

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-2xl bg-gradient-to-r ${raceTheme} border border-transparent shadow-xl relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full filter blur-xl transform translate-x-12 -translate-y-12" />
        <h1 className="text-2xl font-black text-white">{details.race.race_name}</h1>
        <p className="text-xs text-white/80 font-mono mt-1">
          🏁 {details.race.circuit_name} • {details.race.locality}, {details.race.country} • {details.race.date}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Race Results Table */}
        <div className="lg:col-span-3 glass-panel rounded-2xl p-6 border border-white/5 shadow-xl space-y-4">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-400">Race Standings & Performance Summaries</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 font-mono">
                  <th className="py-2">Pos</th>
                  <th className="py-2">Driver</th>
                  <th className="py-2 text-center">Start Grid</th>
                  <th className="py-2 text-center">Tyres Used</th>
                  <th className="py-2 text-center">Pits</th>
                  <th className="py-2">Performance Summary</th>
                  <th className="py-2 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {details.results.map((res: any) => {
                  const style = getTeamStyle(res.driver.current_constructor?.constructor_id);
                  return (
                    <tr key={res.id} className="hover:bg-white/5 cursor-pointer" onClick={() => onSelectDriver(res.driver.driver_id)}>
                      <td className="py-3 font-mono font-bold text-slate-400">P{res.position_text}</td>
                      <td className="py-3 font-bold text-slate-200 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.color_hex }}></span>
                        {res.driver.full_name}
                      </td>
                      <td className="py-3 text-center font-mono text-slate-400">P{res.grid}</td>
                      <td className="py-3 text-center font-mono text-slate-400">{res.tyres_used || 'N/A'}</td>
                      <td className="py-3 text-center font-mono text-slate-400">{res.pit_stops_count !== null ? res.pit_stops_count : 'N/A'}</td>
                      <td className="py-3 text-xs text-slate-400 italic pr-4">{res.summary}</td>
                      <td className="py-3 text-right font-mono font-bold text-slate-100">{res.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Qualifying Results Table */}
        <div className="lg:col-span-3 glass-panel rounded-2xl p-6 border border-white/5 shadow-xl space-y-4">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-400">Qualifying Classification</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 font-mono">
                  <th className="py-2">Pos</th>
                  <th className="py-2">Driver</th>
                  <th className="py-2">Team</th>
                  <th className="py-2 text-center">Q1</th>
                  <th className="py-2 text-center">Q2</th>
                  <th className="py-2 text-center">Q3</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {details.qualifying.map((q: any) => (
                  <tr key={q.id}>
                    <td className="py-3 font-mono font-bold text-slate-400">P{q.position}</td>
                    <td className="py-3 font-bold text-slate-200">{q.driver.full_name}</td>
                    <td className="py-3 text-slate-400">{q.constructor.name}</td>
                    <td className="py-3 text-center font-mono text-slate-500">{q.q1 || '-'}</td>
                    <td className="py-3 text-center font-mono text-slate-500">{q.q2 || '-'}</td>
                    <td className="py-3 text-center font-mono text-slate-100 font-bold">{q.q3 || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// 6. Season Review
function SeasonReview({ races, standings }: { races: any[]; standings: any[] }) {
  const chartLines = useMemo(() => {
    return standings.slice(0, 5).map((st) => {
      const style = getTeamStyle(st.driver.current_constructor?.constructor_id);
      return {
        key: st.driver.driver_id,
        label: st.driver.family_name,
        color: style.color_hex
      };
    });
  }, [standings]);

  const [progressionData, setProgressionData] = useState<any[]>([]);

  useEffect(() => {
    const fetchProgression = async () => {
      try {
        const dataMap: Record<number, Record<string, number>> = {};
        
        const promises = standings.slice(0, 5).map(async (st) => {
          const resp = await api.get(`/drivers/${st.driver.driver_id}/`);
          return { id: st.driver.driver_id, history: resp.data.history };
        });

        const results = await Promise.all(promises);
        
        results.forEach(({ id, history }) => {
          let runningTotal = 0;
          history.forEach((h: any) => {
            runningTotal += h.points;
            if (!dataMap[h.round]) dataMap[h.round] = { round: h.round, race_name: h.race_name, flag: h.flag };
            dataMap[h.round][id] = runningTotal;
          });
        });

        const sortedProgression = Object.values(dataMap).sort((a: any, b: any) => a.round - b.round);
        setProgressionData(sortedProgression);
      } catch (e) {
        console.error(e);
      }
    };

    if (standings.length > 0) {
      fetchProgression();
    }
  }, [standings]);

  // Extract completed races table
  const completedRacesTable = [...races].filter(r => r.completed);

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-xl">
        <h2 className="text-sm font-mono font-bold uppercase tracking-wider mb-4 text-slate-400">Driver Title Progression</h2>
        <SimpleChart data={progressionData} lines={chartLines} type="line" height={320} />
      </div>

      <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-xl space-y-4">
        <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-400">Grand Prix Winners</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 font-mono">
                <th className="py-2">Round</th>
                <th className="py-2">Race</th>
                <th className="py-2">Circuit</th>
                <th className="py-2">Locality</th>
                <th className="py-2 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {completedRacesTable.map((r) => (
                <tr key={r.round}>
                  <td className="py-3 font-mono font-bold text-slate-400">R{r.round}</td>
                  <td className="py-3 font-bold text-slate-200">{r.flag} {r.race_name}</td>
                  <td className="py-3 text-slate-400">{r.circuit_name}</td>
                  <td className="py-3 text-slate-400">{r.locality}</td>
                  <td className="py-3 text-right font-mono text-slate-500">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 7. All Seasons Overview (Comparison)
function AllSeasonsOverview() {
  return (
    <div className="glass-panel rounded-2xl p-8 border border-white/5 shadow-xl text-center space-y-4">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 mb-2">
        <Award size={24} />
      </div>
      <h2 className="text-lg font-bold text-slate-200">Historical Season Comparison</h2>
      <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
        Compare previous F1 seasons' driver and constructor standings. Seed/sync multiple years (e.g. 2024, 2025) using the management command to load history.
      </p>
    </div>
  );
}

// 8. Predictions View
function PredictionsView({ drivers }: { drivers: any[] }) {
  const [activePredictTab, setActivePredictTab] = useState<'scenarios' | 'projection' | 'decider' | 'probability'>('scenarios');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  // Endpoints calculations states
  const [scenarios, setScenarios] = useState<any>(null);
  const [projection, setProjection] = useState<any[]>([]);
  const [decider, setDecider] = useState<any>(null);
  const [probability, setProbability] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (activePredictTab === 'projection') {
      setLoading(true);
      api.get('/predictions/projection/').then(r => {
        setProjection(r.data);
        setLoading(false);
      }).catch(console.error);
    } else if (activePredictTab === 'decider') {
      setLoading(true);
      api.get('/predictions/title-decider/').then(r => {
        setDecider(r.data);
        setLoading(false);
      }).catch(console.error);
    }
  }, [activePredictTab]);

  useEffect(() => {
    if (selectedDriverId) {
      setLoading(true);
      if (activePredictTab === 'scenarios') {
        api.get(`/predictions/scenarios/?driver_id=${selectedDriverId}`).then(r => {
          setScenarios(r.data);
          setLoading(false);
        }).catch(console.error);
      } else if (activePredictTab === 'probability') {
        api.get(`/predictions/win-probability/?driver_id=${selectedDriverId}`).then(r => {
          setProbability(r.data);
          setLoading(false);
        }).catch(console.error);
      }
    }
  }, [selectedDriverId, activePredictTab]);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-white/5 pb-2">
        {(['scenarios', 'projection', 'decider', 'probability'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActivePredictTab(tab); setScenarios(null); setProbability(null); }}
            className={`px-4 py-2 text-xs font-bold font-mono tracking-wider uppercase border-b-2 transition-all ${
              activePredictTab === tab 
                ? 'border-indigo-500 text-indigo-400 font-black' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab === 'scenarios' ? 'Championship Scenarios' : tab === 'projection' ? 'Points Projection' : tab === 'decider' ? 'Title Decider' : 'Win Probability'}
          </button>
        ))}
      </div>

      {(activePredictTab === 'scenarios' || activePredictTab === 'probability') && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">SELECT DRIVER:</span>
          <select
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            className="text-xs rounded-lg px-2.5 py-1.5 bg-slate-800/80 border border-slate-700 text-slate-200"
          >
            <option value="">Choose Driver...</option>
            {drivers.map((d) => (
              <option key={d.driver.driver_id} value={d.driver.driver_id}>{d.driver.full_name}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="glass-panel rounded-2xl p-12 flex justify-center items-center">
          <RefreshCw className="animate-spin text-indigo-400 w-6 h-6" />
        </div>
      ) : activePredictTab === 'scenarios' && scenarios ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel rounded-2xl p-5 border border-green-500/20 bg-green-950/10 space-y-2">
            <h3 className="font-bold text-sm text-green-400">Win All Remaining</h3>
            <p className="text-2xl font-black font-mono text-slate-100">{scenarios.scenarios['1'].totalPoints} pts</p>
            <div className={`text-[10px] font-bold ${scenarios.scenarios['1'].beatsMax ? 'text-green-400' : 'text-red-400'}`}>
              {scenarios.scenarios['1'].beatsMax ? '✓ Guarantees/Puts in Title contention' : '✗ Unlikely to win title'}
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-5 border border-indigo-500/20 bg-indigo-950/10 space-y-2">
            <h3 className="font-bold text-sm text-indigo-400">2nd Place All Remaining</h3>
            <p className="text-2xl font-black font-mono text-slate-100">{scenarios.scenarios['2'].totalPoints} pts</p>
            <div className={`text-[10px] font-bold ${scenarios.scenarios['2'].beatsMax ? 'text-green-400' : 'text-red-400'}`}>
              {scenarios.scenarios['2'].beatsMax ? '✓ Possible' : '✗ Unlikely'}
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-5 border border-yellow-500/20 bg-yellow-950/10 space-y-2">
            <h3 className="font-bold text-sm text-yellow-400">3rd Place All Remaining</h3>
            <p className="text-2xl font-black font-mono text-slate-100">{scenarios.scenarios['3'].totalPoints} pts</p>
            <div className={`text-[10px] font-bold ${scenarios.scenarios['3'].beatsMax ? 'text-green-400' : 'text-red-400'}`}>
              {scenarios.scenarios['3'].beatsMax ? '✓ Possible' : '✗ Very unlikely'}
            </div>
          </div>
        </div>
      ) : activePredictTab === 'projection' && projection.length > 0 ? (
        <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-xl space-y-4">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1"><TrendingUp size={14} /> Final Season Points Projections</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 font-mono">
                  <th className="py-2">Pos</th>
                  <th className="py-2">Driver</th>
                  <th className="py-2 text-center">Current</th>
                  <th className="py-2 text-center">Pace Proj</th>
                  <th className="py-2 text-center">+5% Proj</th>
                  <th className="py-2 text-center">-5% Proj</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {projection.map((p, idx) => (
                  <tr key={p.driver}>
                    <td className="py-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                    <td className="py-3 font-bold text-slate-200">{p.driver}</td>
                    <td className="py-3 text-center font-mono text-slate-400">{p.current}</td>
                    <td className="py-3 text-center font-mono text-indigo-400 font-bold">{p.projections['Current Pace']}</td>
                    <td className="py-3 text-center font-mono text-green-400">{p.projections['+5% Improvement']}</td>
                    <td className="py-3 text-center font-mono text-red-400">{p.projections['-5% Decline']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activePredictTab === 'decider' && decider ? (
        <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-xl max-w-xl mx-auto space-y-5">
          <h2 className="text-md font-mono font-bold text-slate-300 uppercase tracking-widest text-center">Title Decider Calculator</h2>
          
          <div className="grid grid-cols-2 gap-4 border border-white/5 p-4 rounded-xl text-center">
            <div className="border-r border-white/5">
              <div className="text-[10px] text-yellow-400 font-mono">CHAMPIONSHIP LEADER</div>
              <div className="font-bold text-slate-200 mt-1">{decider.leader}</div>
              <div className="text-xl font-mono font-black text-slate-100 mt-1">{decider.leaderPoints} pts</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono">CHALLENGER (P2)</div>
              <div className="font-bold text-slate-200 mt-1">{decider.challenger}</div>
              <div className="text-xl font-mono font-black text-slate-100 mt-1">{decider.challengerPoints} pts</div>
            </div>
          </div>

          {decider.isDecided ? (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-center text-green-400 font-bold">
              🏆 The title has been mathematically clinched by {decider.leader}!
            </div>
          ) : decider.deciderRace ? (
            <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 text-center space-y-2">
              <div className="text-[10px] font-mono text-slate-500">MATHEMATICAL DECIDER GP</div>
              <div className="text-lg font-black text-indigo-400">{decider.deciderRace}</div>
              <div className="text-xs text-slate-400 font-mono">Round {decider.deciderNumber} • In {decider.racesUntilDecided} race(s)</div>
            </div>
          ) : (
            <div className="text-center text-slate-500 text-xs">Championship outcome still highly volatile.</div>
          )}
        </div>
      ) : activePredictTab === 'probability' && probability ? (
        <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-xl max-w-md mx-auto space-y-6">
          <div className="text-center border-b border-white/5 pb-4">
            <h3 className="font-bold text-slate-300">{probability.driver}</h3>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Win Probability Gauges</p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-slate-400">
                <span>Conservative Estimate</span>
                <span className="font-bold text-blue-400">{probability.conservative}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${probability.conservative}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-slate-400">
                <span>Realistic Estimate (Current Pace)</span>
                <span className="font-bold text-green-400">{probability.winRate}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${probability.winRate}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-slate-400">
                <span>Optimistic Estimate</span>
                <span className="font-bold text-orange-400">{probability.optimistic}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${probability.optimistic}%` }} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-slate-500 text-xs py-8">Select a driver above to initialize predictive scenario calculators.</div>
      )}
    </div>
  );
}

// 9. Driver Comparison View
function DriverComparisonView({ drivers }: { drivers: any[] }) {
  const [driverA, setDriverA] = useState<string>('');
  const [driverB, setDriverB] = useState<string>('');
  const [dataA, setDataA] = useState<any>(null);
  const [dataB, setDataB] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchComparison = async () => {
      if (!driverA || !driverB) return;
      setLoading(true);
      try {
        const [rA, rB] = await Promise.all([
          api.get(`/drivers/${driverA}/`),
          api.get(`/drivers/${driverB}/`)
        ]);
        setDataA(rA.data);
        setDataB(rB.data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchComparison();
  }, [driverA, driverB]);

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-xl space-y-6">
      <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-400">Driver Head-to-Head Comparison</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <select value={driverA} onChange={e => setDriverA(e.target.value)} className="w-full text-xs rounded-lg px-2.5 py-2 bg-slate-800/80 border border-slate-700 text-slate-200">
            <option value="">Select Driver A</option>
            {drivers.map(d => <option key={d.driver.driver_id} value={d.driver.driver_id}>{d.driver.full_name}</option>)}
          </select>
        </div>
        <div>
          <select value={driverB} onChange={e => setDriverB(e.target.value)} className="w-full text-xs rounded-lg px-2.5 py-2 bg-slate-800/80 border border-slate-700 text-slate-200">
            <option value="">Select Driver B</option>
            {drivers.map(d => <option key={d.driver.driver_id} value={d.driver.driver_id}>{d.driver.full_name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <RefreshCw className="animate-spin text-indigo-400 w-6 h-6" />
        </div>
      ) : dataA && dataB ? (
        <div className="space-y-4 text-xs divide-y divide-white/5 pt-4">
          <div className="grid grid-cols-3 text-center font-bold pb-2 text-slate-300">
            <div>{dataA.driver.full_name}</div>
            <div className="text-[10px] text-slate-500 font-mono uppercase">Metric</div>
            <div>{dataB.driver.full_name}</div>
          </div>
          
          <div className="grid grid-cols-3 text-center py-3">
            <div className="font-mono font-bold text-slate-200">{dataA.stats.points}</div>
            <div className="text-slate-500 font-mono">Points</div>
            <div className="font-mono font-bold text-slate-200">{dataB.stats.points}</div>
          </div>

          <div className="grid grid-cols-3 text-center py-3">
            <div className="font-mono font-bold text-slate-200">{dataA.stats.wins}</div>
            <div className="text-slate-500 font-mono">Wins</div>
            <div className="font-mono font-bold text-slate-200">{dataB.stats.wins}</div>
          </div>

          <div className="grid grid-cols-3 text-center py-3">
            <div className="font-mono font-bold text-slate-200">{dataA.stats.podiums}</div>
            <div className="text-slate-500 font-mono">Podiums</div>
            <div className="font-mono font-bold text-slate-200">{dataB.stats.podiums}</div>
          </div>

          <div className="grid grid-cols-3 text-center py-3">
            <div className="font-mono font-bold text-slate-200">{dataA.stats.poles}</div>
            <div className="text-slate-500 font-mono">Poles</div>
            <div className="font-mono font-bold text-slate-200">{dataB.stats.poles}</div>
          </div>

          <div className="grid grid-cols-3 text-center py-3">
            <div className="font-mono font-bold text-slate-200">{dataA.stats.avg_finish}</div>
            <div className="text-slate-500 font-mono">Avg Finish</div>
            <div className="font-mono font-bold text-slate-200">{dataB.stats.avg_finish}</div>
          </div>
        </div>
      ) : (
        <div className="text-center text-slate-500 text-xs py-8">Select both drivers to load head-to-head comparison metrics.</div>
      )}
    </div>
  );
}

// 10. Data Editor View
function DataEditorView({ token, setToken, races }: { token: string; setToken: (t: string) => void; races: any[] }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [selectedRound, setSelectedRound] = useState<number | null>(races.length > 0 ? races[0].round : null);
  const [resultsList, setResultsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resp = await api.post('/login/', { username, password });
      const t = resp.data.token;
      setToken(t);
      localStorage.setItem('f1_auth_token', t);
    } catch (err) {
      alert("Invalid admin credentials! Ensure user admin/admin exists in Django backend.");
    }
  };

  const fetchResults = async () => {
    if (!selectedRound) return;
    setLoading(true);
    try {
      const resp = await api.get(`/races/${selectedRound}/`);
      setResultsList(resp.data.results);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token && selectedRound) {
      fetchResults();
    }
  }, [token, selectedRound]);

  const updateResultValue = async (resId: number, field: string, value: any) => {
    const row = resultsList.find(r => r.id === resId);
    if (!row) return;
    const updated = { ...row, [field]: value };
    
    // Optimistic UI updates
    setResultsList(prev => prev.map(r => r.id === resId ? updated : r));

    try {
      await api.put(`/results/${resId}/`, updated, {
        headers: { Authorization: `Token ${token}` }
      });
    } catch (e) {
      alert("Error updating result value: " + e);
      fetchResults(); // Rollback
    }
  };

  if (!token) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-white/5 max-w-sm mx-auto space-y-4">
        <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-400 text-center">Admin credentials</h2>
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-500 font-mono uppercase mb-1">Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200" 
            />
          </div>
          <div>
            <label className="block text-slate-500 font-mono uppercase mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200" 
            />
          </div>
          <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-lg text-white font-mono uppercase tracking-widest transition-all">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-xl space-y-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-400">Data Editor (Inline overrides)</h2>
        
        <select
          value={selectedRound || ''}
          onChange={e => setSelectedRound(Number(e.target.value))}
          className="text-xs rounded-lg px-2.5 py-1 bg-slate-800/80 border border-slate-700 text-slate-200"
        >
          {races.map(r => (
            <option key={r.round} value={r.round}>R{r.round} - {r.locality}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <RefreshCw className="animate-spin text-indigo-400 w-6 h-6" />
        </div>
      ) : (
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 font-mono">
                <th className="py-2">Driver</th>
                <th className="py-2 text-center w-20">Start</th>
                <th className="py-2 text-center w-24">Finish Pos</th>
                <th className="py-2 text-center w-20">Points</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {resultsList.map((res) => (
                <tr key={res.id}>
                  <td className="py-2 font-bold text-slate-200">{res.driver.full_name}</td>
                  <td className="py-2 text-center">
                    <input 
                      type="number"
                      value={res.grid}
                      onChange={e => updateResultValue(res.id, 'grid', Number(e.target.value))}
                      className="w-12 text-center bg-slate-800 border border-slate-700 rounded py-1 font-mono text-slate-200"
                    />
                  </td>
                  <td className="py-2 text-center">
                    <input 
                      type="text"
                      value={res.position_text}
                      onChange={e => updateResultValue(res.id, 'position_text', e.target.value)}
                      className="w-14 text-center bg-slate-800 border border-slate-700 rounded py-1 font-mono text-slate-200"
                    />
                  </td>
                  <td className="py-2 text-center">
                    <input 
                      type="number"
                      step="0.5"
                      value={res.points}
                      onChange={e => updateResultValue(res.id, 'points', parseFloat(e.target.value))}
                      className="w-16 text-center bg-slate-800 border border-slate-700 rounded py-1 font-mono text-slate-200"
                    />
                  </td>
                  <td className="py-2">
                    <input 
                      type="text"
                      value={res.status}
                      onChange={e => updateResultValue(res.id, 'status', e.target.value)}
                      className="w-32 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// 11. Race Winner Spotlight Card
function RaceWinnerSpotlight({ round, onSelectDriver }: { round: number; onSelectDriver: (id: string) => void }) {
  const [winner, setWinner] = useState<any>(null);

  useEffect(() => {
    api.get(`/races/${round}/`).then(r => {
      const p1 = r.data.results.find((res: any) => res.position === 1);
      if (p1) setWinner(p1);
    }).catch(console.error);
  }, [round]);

  if (!winner) return null;

  const style = getTeamStyle(winner.driver.current_constructor?.constructor_id);

  return (
    <div 
      onClick={() => onSelectDriver(winner.driver.driver_id)}
      className="glass-panel rounded-2xl p-5 border border-indigo-500/20 bg-indigo-950/10 shadow-xl space-y-4 cursor-pointer hover:border-indigo-500/40 transition-all flex flex-col justify-between"
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono uppercase tracking-widest">
            Last Race Winner
          </span>
          <h3 className="font-black text-md text-slate-100 mt-2">{winner.driver.full_name}</h3>
          <p className="text-[10px] text-slate-500">{winner.driver.current_constructor?.name}</p>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-xs border-2 ${style.border} ${style.bg} ${style.shadow}`}>
          {winner.driver.code}
        </div>
      </div>
      
      <div className="flex justify-between items-center border-t border-white/5 pt-3 text-xs">
        <span className="text-slate-500">Fastest Lap Rank:</span>
        <span className="font-mono font-bold text-slate-300">#{winner.fastest_lap_rank || 'N/A'}</span>
      </div>
    </div>
  );
}
