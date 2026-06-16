import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to clean dealership names
const cleanDealershipName = (name) => {
  return name.replace(/\s+ready\s+for\s+labeling/gi, '').trim();
};

// Main App Component
export default function SmartTrustMeterApp() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedDealership, setSelectedDealership] = useState(null);
  const [dealershipSearch, setDealershipSearch] = useState('');
  
  const navigateTo = (page, data = null) => {
    setCurrentPage(page);
    if (data?.search !== undefined) {
      setDealershipSearch(data.search);
    } else if (page === 'dealerships' || page === 'home') {
      setDealershipSearch('');
    }
    if (data?._id) {
      setSelectedDealership(data);
    } else if (page !== 'dealership-detail') {
      setSelectedDealership(null);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col mesh-bg">
      <Header navigateTo={navigateTo} currentPage={currentPage} />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {currentPage === 'home' && <HomePage navigateTo={navigateTo} />}
        {currentPage === 'dealerships' && (
          <DealershipsPage navigateTo={navigateTo} initialSearch={dealershipSearch} />
        )}
        {currentPage === 'dealership-detail' && selectedDealership && (
          <DealershipDetail dealership={selectedDealership} navigateTo={navigateTo} />
        )}
        {currentPage === 'submit-feedback' && <SubmitFeedback navigateTo={navigateTo} />}
        {currentPage === 'compare' && <ComparePage />}
        {currentPage === 'model' && <ModelPage />}
      </main>
      
      <Footer />
    </div>
  );
}

// Header Component
const NAV_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'dealerships', label: 'Dealerships' },
  { id: 'submit-feedback', label: 'Feedback' },
  { id: 'compare', label: 'Compare' },
  { id: 'model', label: 'AI Model' },
];

function Header({ navigateTo, currentPage }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (page) => {
    navigateTo(page);
    setMobileOpen(false);
  };

  return (
    <header className="glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[4.5rem]">
          <button
            type="button"
            onClick={() => go('home')}
            className="flex items-center gap-3 group"
          >
            <div className="bg-white/95 text-indigo-600 rounded-xl p-2 shadow-md group-hover:scale-105 transition-transform duration-200">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="text-left hidden sm:block">
              <h1 className="text-lg font-bold text-white leading-tight">Smart Trust Meter</h1>
              <p className="text-xs text-indigo-200/90">Dealership Trust Intelligence</p>
            </div>
          </button>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => go(id)}
                className={`nav-link ${currentPage === id ? 'nav-link-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </nav>

          <button
            type="button"
            className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10 transition"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <nav className="lg:hidden pb-4 flex flex-col gap-1 animate-fade-in">
            {NAV_LINKS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => go(id)}
                className={`nav-link text-left ${currentPage === id ? 'nav-link-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

// Home Page
function HomePage({ navigateTo }) {
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    fetch(`${API_URL}/stats`)
      .then(res => res.json())
      .then(data => setStats(data.data))
      .catch(err => console.error(err));
  }, []);
  
  const handleSearch = () => {
    navigateTo('dealerships', { search: searchQuery.trim() });
  };
  
  return (
    <div className="space-y-14 animate-fade-in">
      {/* Hero */}
      <section className="hero-gradient px-6 py-12 sm:py-16 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative max-w-3xl mx-auto">
          <span className="badge-live mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            AI-powered · 90% accuracy
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
            Find dealerships you can{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              trust
            </span>
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto">
            Real customer reviews analyzed by our multilingual transformer — English & Roman Urdu supported.
          </p>

          <div className="max-w-xl mx-auto flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by name or location..."
              className="input-field flex-1 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button type="button" onClick={handleSearch} className="btn-primary sm:px-8">
              Search
            </button>
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      {stats && (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard title="Dealerships" value={stats.totalDealerships} icon="🏢" accent="indigo" />
          <StatCard title="Reviews Analyzed" value={stats.totalReviews.toLocaleString()} icon="📊" accent="emerald" />
          <StatCard title="Avg Trust Score" value={`${(stats.averageTrustScore * 100).toFixed(1)}%`} icon="⭐" accent="violet" />
        </section>
      )}

      {stats && stats.topDealerships && (
        <section>
          <div className="mb-6">
            <h3 className="section-title">Top Rated Dealerships</h3>
            <p className="section-subtitle">Highest trust scores across Lahore</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stats.topDealerships.map((dealer, idx) => (
              <div
                key={dealer._id}
                role="button"
                tabIndex={0}
                onClick={() => dealer._id && navigateTo('dealership-detail', dealer)}
                onKeyDown={(e) => e.key === 'Enter' && dealer._id && navigateTo('dealership-detail', dealer)}
                className="card card-hover p-6 relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-80" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl font-black text-slate-200 group-hover:text-indigo-200 transition-colors">
                    #{idx + 1}
                  </span>
                  <TrustBadge score={dealer.overallTrustScore} />
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-1">{cleanDealershipName(dealer.name)}</h4>
                {dealer.location && <p className="text-sm text-slate-500 mb-4">{dealer.location}</p>}
                <TrustBar score={dealer.overallTrustScore} />
              </div>
            ))}
          </div>
        </section>
      )}
      
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard icon="🤖" title="AI-Powered Analysis" description="DistilBERT multilingual model with 90% accuracy and Roman Urdu support" />
        <FeatureCard icon="📈" title="Aspect-Based Insights" description="Pricing, service quality, parts availability, and more — broken down per dealership" />
        <FeatureCard icon="⚡" title="Real-Time Scoring" description="Trust scores update instantly when new feedback is submitted" />
      </section>
    </div>
  );
}

// Dealerships Listing Page
function DealershipsPage({ navigateTo, initialSearch = '' }) {
  const [dealerships, setDealerships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('trustScore');
  const [localSearch, setLocalSearch] = useState(initialSearch);
  
  useEffect(() => {
    setLocalSearch(initialSearch);
  }, [initialSearch]);
  
  useEffect(() => {
    setLoading(true);
    setError(null);
    const query = localSearch.trim();
    const url = query
      ? `${API_URL}/dealerships/search/${encodeURIComponent(query)}`
      : `${API_URL}/dealerships`;
    
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load dealerships');
        return res.json();
      })
      .then(data => {
        setDealerships(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [localSearch]);
  
  const sortedDealerships = [...dealerships].sort((a, b) => {
    if (sortBy === 'trustScore') return b.overallTrustScore - a.overallTrustScore;
    if (sortBy === 'reviews') return b.totalReviews - a.totalReviews;
    return a.name.localeCompare(b.name);
  });
  
  if (loading) {
    return <LoadingState message="Loading dealerships..." />;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="section-title">
            {localSearch.trim() ? `Results for "${localSearch}"` : 'All Dealerships'}
          </h2>
          <p className="section-subtitle">{dealerships.length} dealerships ranked by trust</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <input
            type="search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Filter by name or location..."
            className="input-field sm:w-64"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field sm:w-48"
          >
            <option value="trustScore">Sort by Trust Score</option>
            <option value="reviews">Sort by Reviews</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && sortedDealerships.length === 0 && (
        <div className="card p-12 text-center text-slate-500">No dealerships found.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-stagger">
        {sortedDealerships.map(dealer => (
          <DealershipCard key={dealer._id} dealer={dealer} navigateTo={navigateTo} />
        ))}
      </div>
    </div>
  );
}

// Dealership Detail Page
function DealershipDetail({ dealership, navigateTo }) {
  const [details, setDetails] = useState(null);
  const [trustTrend, setTrustTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/dealerships/${dealership._id}`).then((r) => r.json()),
      fetch(`${API_URL}/dealerships/${dealership._id}/trust-trend`).then((r) => r.json()),
    ])
      .then(([detailRes, trendRes]) => {
        setDetails(detailRes.data);
        setTrustTrend(trendRes.data?.trend || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [dealership._id]);
  
  if (loading) {
    return <LoadingState message="Loading dealership details..." />;
  }

  const { dealership: dealer, recentReviews } = details;

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        type="button"
        onClick={() => navigateTo('dealerships')}
        className="btn-secondary text-sm"
      >
        ← Back to Dealerships
      </button>

      <div className="card p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
              {cleanDealershipName(dealer.name)}
            </h1>
            {dealer.location && <p className="text-slate-500">📍 {dealer.location}</p>}
          </div>
          <TrustBadge score={dealer.overallTrustScore} size="large" />
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { label: 'Total Reviews', value: dealer.totalReviews, color: 'text-slate-900' },
            { label: 'Positive', value: dealer.positiveCount, color: 'text-emerald-600' },
            { label: 'Negative', value: dealer.negativeCount, color: 'text-red-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className={`text-2xl sm:text-3xl font-extrabold ${color}`}>{value}</div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {trustTrend.length > 0 && (
        <TrustScoreChart trend={trustTrend} currentScore={dealer.overallTrustScore} />
      )}
      
      {/* Aspects */}
      {dealer.aspects && Object.keys(dealer.aspects).length > 0 && (
        <div className="card p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <h2 className="section-title">Aspect Analysis</h2>
            <p className="text-sm text-slate-500">
              {Object.values(dealer.aspects).reduce((sum, aspect) => sum + (aspect.mentions || 0), 0)} customer mentions
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(dealer.aspects)
              .filter(([, value]) => value && value.score)
              .sort(([,a], [,b]) => (b.score || 0) - (a.score || 0))
              .map(([key, value]) => (
                <AspectCard key={key} name={key} data={value} />
              ))}
          </div>
        </div>
      )}
      
      {/* Recent Reviews */}
      {recentReviews && recentReviews.length > 0 && (
        <div className="card p-8">
          <h2 className="section-title mb-6">Recent Reviews</h2>
          <div className="space-y-4">
            {recentReviews.slice(0, 10).map(review => (
              <ReviewCard key={review._id} review={review} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Submit Feedback Page
function SubmitFeedback() {
  const [dealerships, setDealerships] = useState([]);
  const [formData, setFormData] = useState({
    dealershipId: '',
    reviewText: '',
    userName: '',
    userEmail: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastSentiment, setLastSentiment] = useState(null);
  
  useEffect(() => {
    fetch(`${API_URL}/dealerships`)
      .then(res => res.json())
      .then(data => setDealerships(data.data))
      .catch(err => console.error(err));
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const response = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      if (response.ok) {
        setSuccess(true);
        setLastSentiment(result.sentiment || null);
        setFormData({ dealershipId: '', reviewText: '', userName: '', userEmail: '' });
        setTimeout(() => {
          setSuccess(false);
          setLastSentiment(null);
        }, 5000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 text-3xl mb-4">
          ✍️
        </div>
        <h2 className="section-title">Submit Your Feedback</h2>
        <p className="section-subtitle mt-2">Help others make informed decisions — analyzed instantly by AI</p>
      </div>

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-4 mb-6">
          <p className="font-semibold">Feedback submitted successfully!</p>
          {lastSentiment && (
            <p className="text-sm mt-1 opacity-90">
              Detected as <strong>{lastSentiment.label === 1 ? 'Positive' : 'Negative'}</strong>
              {' '}({(lastSentiment.score * 100).toFixed(0)}% via {lastSentiment.source})
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-8 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Select Dealership *
          </label>
          <select
            required
            value={formData.dealershipId}
            onChange={(e) => setFormData({...formData, dealershipId: e.target.value})}
            className="input-field"
          >
            <option value="">Choose a dealership...</option>
            {dealerships.map(d => (
              <option key={d._id} value={d._id}>{cleanDealershipName(d.name)}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Your Review *
          </label>
          <textarea
            required
            rows={6}
            value={formData.reviewText}
            onChange={(e) => setFormData({...formData, reviewText: e.target.value})}
            placeholder="Share your experience with this dealership..."
            className="input-field"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Your Name (Optional)
            </label>
            <input
              type="text"
              value={formData.userName}
              onChange={(e) => setFormData({...formData, userName: e.target.value})}
              placeholder="Your name"
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Email (Optional)
            </label>
            <input
              type="email"
              value={formData.userEmail}
              onChange={(e) => setFormData({...formData, userEmail: e.target.value})}
              placeholder="your@email.com"
              className="input-field"
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
}

// Compare Page
function ComparePage() {
  const [dealerships, setDealerships] = useState([]);
  const [selected, setSelected] = useState([]);
  const [comparison, setComparison] = useState(null);
  
  // Helper function to get all unique aspects from comparison data
  const getAllAspects = (comparisonData) => {
    const allAspects = new Set();
    comparisonData.forEach(dealership => {
      if (dealership.aspects) {
        Object.keys(dealership.aspects).forEach(aspect => allAspects.add(aspect));
      }
    });
    return Array.from(allAspects).sort();
  };
  
  useEffect(() => {
    fetch(`${API_URL}/dealerships`)
      .then(res => res.json())
      .then(data => setDealerships(data.data))
      .catch(err => console.error(err));
  }, []);
  
  const handleCompare = async () => {
    if (selected.length < 2) return;
    
    const response = await fetch(`${API_URL}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealershipIds: selected })
    });
    
    const data = await response.json();
    setComparison(data.data);
  };
  
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="section-title">Compare Dealerships</h2>
        <p className="section-subtitle">Side-by-side trust scores and aspect breakdown</p>
      </div>

      <div className="card p-8">
        <label className="block text-sm font-semibold text-slate-700 mb-4">
          Select dealerships to compare (2–4):
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6 animate-stagger">
          {dealerships.map(d => {
            const isSelected = selected.includes(d._id);
            const disabled = !isSelected && selected.length >= 4;
            return (
              <label
                key={d._id}
                className={`compare-chip ${isSelected ? 'compare-chip-selected' : ''} ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={disabled}
                  onChange={(e) => {
                    if (e.target.checked) {
                      if (selected.length < 4) setSelected([...selected, d._id]);
                    } else {
                      setSelected(selected.filter(id => id !== d._id));
                    }
                  }}
                />
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-slate-800 block truncate">
                    {cleanDealershipName(d.name)}
                  </span>
                  {d.location && <span className="text-xs text-slate-500 truncate block">{d.location}</span>}
                </div>
              </label>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleCompare}
            disabled={selected.length < 2}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Compare {selected.length >= 2 ? `(${selected.length})` : 'Selected'}
          </button>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => { setSelected([]); setComparison(null); }}
              className="btn-secondary text-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {comparison && (
        <div className="card p-8 overflow-hidden">
          <h3 className="section-title mb-6">Comparison Results</h3>

          <div className="overflow-x-auto -mx-2">
            <table className="w-full table-modern">
              <thead>
                <tr>
                  <th>Metric</th>
                  {comparison.map(d => (
                    <th key={d._id}>{cleanDealershipName(d.name)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold text-slate-800">Trust Score</td>
                  {comparison.map(d => (
                    <td key={d._id}>
                      <span className="inline-block font-extrabold text-lg text-indigo-700">
                        {(d.overallTrustScore * 100).toFixed(1)}%
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="font-semibold text-slate-800">Total Reviews</td>
                  {comparison.map(d => (
                    <td key={d._id} className="font-medium">{d.totalReviews.toLocaleString()}</td>
                  ))}
                </tr>
                <tr>
                  <td className="font-semibold text-slate-800">Positive Reviews</td>
                  {comparison.map(d => (
                    <td key={d._id} className="text-emerald-600 font-semibold">{d.positiveCount}</td>
                  ))}
                </tr>
                <tr>
                  <td className="font-semibold text-slate-800">Negative Reviews</td>
                  {comparison.map(d => (
                    <td key={d._id} className="text-red-500 font-semibold">{d.negativeCount}</td>
                  ))}
                </tr>

                {comparison.some(d => d.aspects && Object.keys(d.aspects).length > 0) && (
                  <>
                    <tr className="bg-indigo-50/60 hover:bg-indigo-50/60">
                      <td colSpan={comparison.length + 1} className="py-4 font-bold text-indigo-800 text-center uppercase tracking-wide text-xs">
                        Aspect Analysis
                      </td>
                    </tr>
                    {getAllAspects(comparison).map(aspectName => (
                      <tr key={aspectName}>
                        <td className="font-semibold capitalize text-slate-800">
                          {aspectName.replace(/_/g, ' ')}
                        </td>
                        {comparison.map(d => (
                          <td key={d._id}>
                            {d.aspects && d.aspects[aspectName] ? (
                              <div className="space-y-1.5 max-w-[140px] mx-auto">
                                <div className="font-extrabold text-lg text-slate-900">
                                  {(d.aspects[aspectName].score * 100).toFixed(1)}%
                                </div>
                                <div className="text-xs text-slate-500">
                                  {d.aspects[aspectName].mentions} reviews
                                </div>
                                <div className="progress-track">
                                  <div
                                    className={`progress-fill ${
                                      d.aspects[aspectName].score > 0.7 ? 'bg-gradient-to-r from-emerald-500 to-green-400' :
                                      d.aspects[aspectName].score > 0.5 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                                      'bg-gradient-to-r from-red-500 to-orange-400'
                                    }`}
                                    style={{ width: `${d.aspects[aspectName].score * 100}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// AI Model performance page (demo / report)
function ModelPage() {
  const [metrics, setMetrics] = useState(null);
  const [mlStatus, setMlStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/model-metrics`).then((r) => r.json()),
      fetch(`${API_URL}/health`).then((r) => r.json()),
    ])
      .then(([metricsRes, healthRes]) => {
        setMetrics(metricsRes.data);
        setMlStatus(healthRes.ml);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading model metrics..." />;
  if (!metrics) return <div className="card p-12 text-center text-slate-500">Model metrics unavailable.</div>;

  const active = metrics.models.find((m) => m.id === metrics.activeModel) || metrics.models[1];
  const lstm = metrics.models.find((m) => m.id === 'lstm');
  const cm = active.confusionMatrix;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="section-title">AI Model Performance</h2>
        <p className="section-subtitle">Live sentiment engine powering trust scores</p>
      </div>

      {mlStatus && (
        <div className={`metric-pill ${
          mlStatus.status === 'ok'
            ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-200'
            : 'bg-red-500/10 text-red-800 border border-red-200'
        }`}>
          <span className={`w-2 h-2 rounded-full ${mlStatus.status === 'ok' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          ML service: {mlStatus.status === 'ok' ? `${mlStatus.model} model online` : 'offline — using lexicon fallback'}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="English Accuracy" value={`${(active.englishAccuracy * 100).toFixed(1)}%`} icon="🎯" accent="indigo" />
        <StatCard title="F1 Score" value={active.f1Score.toFixed(3)} icon="📈" accent="emerald" />
        <StatCard title="Roman Urdu Accuracy" value={`${(active.romanUrduAccuracy * 100).toFixed(1)}%`} icon="🌐" accent="violet" />
        <StatCard title="Active Model" value={active.name.split(' ')[0]} icon="🤖" accent="indigo" />
      </div>

      <div className="card p-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Model Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full table-modern">
            <thead>
              <tr>
                <th>Model</th>
                <th>English</th>
                <th>Roman Urdu</th>
                <th>F1</th>
              </tr>
            </thead>
            <tbody>
              {metrics.models.map((m) => (
                <tr key={m.id} className={m.id === metrics.activeModel ? 'bg-indigo-50/50 hover:bg-indigo-50/50' : ''}>
                  <td className="font-semibold text-slate-800">
                    {m.name}
                    {m.id === metrics.activeModel && (
                      <span className="ml-2 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">LIVE</span>
                    )}
                  </td>
                  <td className="font-medium">{(m.englishAccuracy * 100).toFixed(1)}%</td>
                  <td className="font-medium">
                    {m.romanUrduAccuracy != null ? `${(m.romanUrduAccuracy * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td className="font-medium">{m.f1Score.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {cm && (
        <div className="card p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Confusion Matrix (English test set)</h3>
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-center text-sm">
            <div />
            <div className="font-bold text-slate-500 uppercase text-xs tracking-wide py-2">Pred −</div>
            <div className="font-bold text-slate-500 uppercase text-xs tracking-wide py-2">Pred +</div>
            <div className="font-bold text-slate-500 uppercase text-xs tracking-wide flex items-center justify-end pr-2">Actual −</div>
            <div className="bg-red-50 border border-red-100 p-5 rounded-xl font-extrabold text-2xl text-red-700">{cm[0][0]}</div>
            <div className="bg-orange-50 border border-orange-100 p-5 rounded-xl font-extrabold text-2xl text-orange-700">{cm[0][1]}</div>
            <div className="font-bold text-slate-500 uppercase text-xs tracking-wide flex items-center justify-end pr-2">Actual +</div>
            <div className="bg-orange-50 border border-orange-100 p-5 rounded-xl font-extrabold text-2xl text-orange-700">{cm[1][0]}</div>
            <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl font-extrabold text-2xl text-emerald-700">{cm[1][1]}</div>
          </div>
        </div>
      )}

      {metrics.romanUrduImprovement && (
        <div className="card p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Roman Urdu Improvement</h3>
          <p className="text-slate-500 mb-8 text-sm">{metrics.romanUrduImprovement.note}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-4xl font-extrabold text-red-500">
                {(metrics.romanUrduImprovement.before * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-slate-500 mt-1">Before augmentation</div>
              <div className="mt-3 w-32 h-2 rounded-full bg-slate-100 mx-auto overflow-hidden">
                <div className="h-full bg-red-400 rounded-full" style={{ width: `${metrics.romanUrduImprovement.before * 100}%` }} />
              </div>
            </div>
            <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 text-xl font-bold">
              →
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-emerald-600">
                {(metrics.romanUrduImprovement.after * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-slate-500 mt-1">After augmentation</div>
              <div className="mt-3 w-32 h-2 rounded-full bg-slate-100 mx-auto overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${metrics.romanUrduImprovement.after * 100}%` }} />
              </div>
            </div>
            <div className="text-center sm:ml-4 px-6 py-4 rounded-2xl bg-indigo-50 border border-indigo-100">
              <div className="text-3xl font-extrabold text-indigo-700">
                +{((metrics.romanUrduImprovement.after - metrics.romanUrduImprovement.before) * 100).toFixed(0)} pts
              </div>
              <div className="text-sm text-indigo-600/80 mt-1 font-medium">Improvement</div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-8">
        <h4 className="font-bold text-indigo-900 text-lg mb-2">{active.name}</h4>
        <p className="text-indigo-800/90 text-sm leading-relaxed">{active.description}</p>
        {lstm && (
          <p className="text-indigo-700/80 text-sm mt-3 pt-3 border-t border-indigo-200/60">
            Upgraded from LSTM ({(lstm.englishAccuracy * 100).toFixed(1)}%) → Transformer ({(active.englishAccuracy * 100).toFixed(1)}% English, {(active.romanUrduAccuracy * 100).toFixed(1)}% Roman Urdu)
          </p>
        )}
      </div>
    </div>
  );
}

// Reusable Components

function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="spinner" />
      <p className="text-slate-500 text-sm font-medium">{message}</p>
    </div>
  );
}

function TrustScoreChart({ trend, currentScore }) {
  const [mode, setMode] = useState('cumulative');
  const [hovered, setHovered] = useState(null);

  const getScore = (point) => (mode === 'cumulative' ? point.cumulativeScore : point.monthlyScore);

  const W = 640;
  const H = 220;
  const pad = { top: 24, right: 20, bottom: 36, left: 44 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  const yTicks = [0, 25, 50, 75, 100];
  const xStep = trend.length > 1 ? chartW / (trend.length - 1) : 0;

  const points = trend.map((point, i) => {
    const pct = getScore(point) * 100;
    return {
      ...point,
      pct,
      x: pad.left + (trend.length > 1 ? i * xStep : chartW / 2),
      y: pad.top + chartH - (pct / 100) * chartH,
    };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(pad.top + chartH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(pad.top + chartH).toFixed(1)} Z`;

  const labelStep = trend.length > 8 ? Math.ceil(trend.length / 6) : 1;

  return (
    <div className="card p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="section-title">Trust Score Trend</h2>
          <p className="section-subtitle">
            {mode === 'cumulative' ? 'Running average as reviews accumulate' : 'Sentiment per month'}
          </p>
        </div>
        <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50 self-start">
          {[
            { id: 'cumulative', label: 'Cumulative' },
            { id: 'monthly', label: 'Monthly' },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setMode(id); setHovered(null); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                mode === id
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Trust score trend chart">
          <defs>
            <linearGradient id="trustAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="trustLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          {yTicks.map((tick) => {
            const y = pad.top + chartH - (tick / 100) * chartH;
            return (
              <g key={tick}>
                <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                <text x={pad.left - 8} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px]">
                  {tick}%
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#trustAreaGrad)" />
          <path d={linePath} fill="none" stroke="url(#trustLineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {points.map((point, i) => (
            <g key={point.period}>
              <circle
                cx={point.x}
                cy={point.y}
                r={hovered === i ? 6 : 4}
                fill={hovered === i ? '#4f46e5' : '#fff'}
                stroke="#6366f1"
                strokeWidth="2"
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
              {(i % labelStep === 0 || i === trend.length - 1) && (
                <text x={point.x} y={H - 10} textAnchor="middle" className="fill-slate-500 text-[10px]">
                  {point.label.split(' ')[0]} '{point.period.slice(2, 4)}
                </text>
              )}
            </g>
          ))}
        </svg>

        {hovered !== null && points[hovered] && (
          <div
            className="absolute pointer-events-none bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-lg z-10"
            style={{
              left: `${(points[hovered].x / W) * 100}%`,
              top: `${(points[hovered].y / H) * 100 - 12}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="font-bold">{points[hovered].label}</div>
            <div>{points[hovered].pct.toFixed(1)}% trust</div>
            <div className="text-slate-300">{points[hovered].count} review{points[hovered].count !== 1 ? 's' : ''}</div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
        <span>
          Current score:{' '}
          <strong className="text-indigo-700">{(currentScore * 100).toFixed(1)}%</strong>
        </span>
        <span className="text-slate-300">|</span>
        <span>{trend.length} month{trend.length !== 1 ? 's' : ''} of data</span>
        {trend.length > 1 && (
          <>
            <span className="text-slate-300">|</span>
            <span>
              {getScore(trend[trend.length - 1]) >= getScore(trend[0]) ? (
                <span className="text-emerald-600 font-semibold">↑ Trending up</span>
              ) : (
                <span className="text-red-500 font-semibold">↓ Trending down</span>
              )}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function TrustBar({ score, showLabel = true }) {
  const pct = (score || 0) * 100;
  const fillClass =
    score > 0.7 ? 'bg-gradient-to-r from-emerald-500 to-green-400' :
    score > 0.5 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
    'bg-gradient-to-r from-red-500 to-orange-400';

  return (
    <div>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-slate-500">Trust Score</span>
          <span className="font-bold text-slate-800">{pct.toFixed(1)}%</span>
        </div>
      )}
      <div className="progress-track">
        <div className={`progress-fill ${fillClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const ACCENT_STYLES = {
  indigo: 'from-indigo-500/10 to-indigo-600/5 border-indigo-100 text-indigo-600',
  emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-100 text-emerald-600',
  violet: 'from-violet-500/10 to-violet-600/5 border-violet-100 text-violet-600',
};

function StatCard({ title, value, icon, accent = 'indigo' }) {
  return (
    <div className={`card p-6 bg-gradient-to-br ${ACCENT_STYLES[accent]} border`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-extrabold text-slate-900">{value}</p>
        </div>
        <span className="text-3xl opacity-90">{icon}</span>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="card p-6 text-center card-hover group">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function TrustBadge({ score, size = 'normal' }) {
  const getGradient = (s) => {
    if (s > 0.7) return 'trust-excellent';
    if (s > 0.6) return 'trust-good';
    if (s > 0.5) return 'trust-average';
    if (s > 0.4) return 'trust-below';
    return 'trust-poor';
  };

  const getLabel = (s) => {
    if (s > 0.7) return 'Excellent';
    if (s > 0.6) return 'Good';
    if (s > 0.5) return 'Average';
    if (s > 0.4) return 'Below Avg';
    return 'Poor';
  };

  const sizeClasses = size === 'large' ? 'px-5 py-3 min-w-[5.5rem]' : 'px-3 py-2 min-w-[4.5rem]';

  return (
    <div className={`${getGradient(score)} text-white rounded-xl ${sizeClasses} text-center shadow-md`}>
      <div className={size === 'large' ? 'text-2xl font-extrabold' : 'text-lg font-bold'}>
        {(score * 100).toFixed(1)}%
      </div>
      <div className="text-[10px] uppercase tracking-wider opacity-90 font-semibold">{getLabel(score)}</div>
    </div>
  );
}

function DealershipCard({ dealer, navigateTo }) {
  const positivePct = dealer.positiveCount > 0
    ? Math.round(dealer.positiveCount / dealer.totalReviews * 100)
    : 0;

  return (
    <div
      onClick={() => navigateTo('dealership-detail', dealer)}
      className="card card-hover p-6 group"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">
            {cleanDealershipName(dealer.name)}
          </h3>
          {dealer.location && (
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
              <span>📍</span> {dealer.location}
            </p>
          )}
        </div>
        <TrustBadge score={dealer.overallTrustScore} />
      </div>

      <TrustBar score={dealer.overallTrustScore} showLabel={false} />

      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Reviews</p>
          <p className="text-xl font-bold text-slate-800">{dealer.totalReviews?.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Positive</p>
          <p className="text-xl font-bold text-emerald-600">{positivePct}%</p>
        </div>
      </div>
    </div>
  );
}

function AspectCard({ name, data }) {
  const displayName = name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const getScoreLabel = (score) => {
    if (score > 0.7) return 'Excellent';
    if (score > 0.6) return 'Good';
    if (score > 0.5) return 'Average';
    if (score > 0.4) return 'Below Avg';
    return 'Poor';
  };

  const badgeClass =
    data.score > 0.6 ? 'bg-emerald-100 text-emerald-800' :
    data.score > 0.5 ? 'bg-amber-100 text-amber-800' :
    'bg-red-100 text-red-800';

  return (
    <div className="card p-5 card-hover">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-slate-800">{displayName}</h4>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
          {getScoreLabel(data.score)}
        </span>
      </div>
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm text-slate-500">{data.mentions} mentions</span>
        <span className="text-2xl font-extrabold text-slate-900">{((data.score || 0) * 100).toFixed(1)}%</span>
      </div>
      <TrustBar score={data.score} showLabel={false} />
      <div className="flex justify-between text-xs mt-3 text-slate-500">
        <span><span className="text-emerald-600 font-semibold">{data.positivePct?.toFixed(0)}%</span> positive</span>
        <span><span className="text-red-500 font-semibold">{(100 - (data.positivePct || 0)).toFixed(0)}%</span> negative</span>
      </div>
    </div>
  );
}

function ReviewCard({ review }) {
  const isPositive = review.predictedLabel === 1;

  return (
    <div className="card p-5 border-l-4 border-l-indigo-400/60">
      <div className="flex items-start gap-4">
        <p className="flex-1 text-slate-700 leading-relaxed">{review.reviewText}</p>
        <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
          isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
        }`}>
          {isPositive ? 'Positive' : 'Negative'}
        </span>
      </div>
      <div className="flex justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
        <span>{review.userName || 'Anonymous'}</span>
        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 rounded-lg p-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-white text-sm">Smart Trust Meter</p>
              <p className="text-xs text-slate-400">AI-Powered Dealership Trust</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 text-center">
            DistilBERT Multilingual · 90% English · 79% Roman Urdu
          </p>
        </div>
      </div>
    </footer>
  );
}