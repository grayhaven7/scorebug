import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { currentTheme } = useApp();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hide nav during live game
  const isLiveGame = location.pathname === '/game';

  const navItems = [
    { path: '/', label: 'Match Setup', icon: '🏀' },
    { path: '/teams', label: 'Teams', icon: '👥' },
    { path: '/history', label: 'History', icon: '📊' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
    { path: '/themes', label: 'Themes', icon: '🎨' },
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: currentTheme.backgroundColor,
        color: currentTheme.textColor,
        fontFamily: currentTheme.bodyFont,
      }}
    >
      {!isLiveGame && (
        <nav
          className="border-b"
          style={{
            backgroundColor: currentTheme.secondaryBackground,
            borderColor: currentTheme.accentColor + '40',
          }}
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg"
                  style={{
                    backgroundColor: currentTheme.accentColor,
                    fontFamily: currentTheme.headerFont,
                  }}
                >
                  SB
                </div>
                <span
                  className="text-xl font-bold tracking-wide"
                  style={{ fontFamily: currentTheme.headerFont }}
                >
                  SCOREBUG
                </span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-1">
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
                    style={{
                      backgroundColor:
                        location.pathname === item.path
                          ? currentTheme.accentColor + '30'
                          : 'transparent',
                      color:
                        location.pathname === item.path
                          ? currentTheme.accentColor
                          : currentTheme.textSecondary,
                    }}
                  >
                    <span>{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-lg"
                  style={{ color: currentTheme.textColor }}
                >
                  <span className="text-2xl">{isMobileMenuOpen ? '✕' : '☰'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Nav */}
          {isMobileMenuOpen && (
            <div
              className="md:hidden px-4 pb-4 border-t"
              style={{ borderColor: currentTheme.accentColor + '20' }}
            >
              <div className="flex flex-col gap-2 mt-4">
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3"
                    style={{
                      backgroundColor:
                        location.pathname === item.path
                          ? currentTheme.accentColor + '30'
                          : 'transparent',
                      color:
                        location.pathname === item.path
                          ? currentTheme.accentColor
                          : currentTheme.textSecondary,
                    }}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium text-lg">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
      )}

      <main className="flex-1">{children}</main>
    </div>
  );
}

