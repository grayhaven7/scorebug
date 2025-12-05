import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TeamCard } from '../components/TeamCard';
import { TeamForm } from '../components/TeamForm';
import type { Team } from '../types';

export function TeamsPage() {
  const { teams, deleteTeam, currentTheme } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setIsFormOpen(true);
  };

  const handleDelete = (teamId: string) => {
    if (deleteConfirm === teamId) {
      deleteTeam(teamId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(teamId);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTeam(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 text-center sm:text-left">
        <div>
          <h1
            className="text-3xl font-bold tracking-wide"
            style={{ fontFamily: currentTheme.headerFont }}
          >
            TEAM MANAGEMENT
          </h1>
          <p style={{ color: currentTheme.textSecondary }}>
            Create and manage your teams. Add players, set colors, and more.
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="w-full sm:w-auto px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 flex items-center justify-center gap-2"
          style={{
            backgroundColor: currentTheme.accentColor,
            color: '#fff',
            borderRadius: currentTheme.borderRadius,
            fontFamily: currentTheme.headerFont,
          }}
        >
          <span className="text-xl">+</span>
          NEW TEAM
        </button>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleFormClose}
          />
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl p-6"
            style={{
              backgroundColor: currentTheme.secondaryBackground,
              borderRadius: currentTheme.borderRadius,
            }}
          >
            <h2
              className="text-2xl font-bold mb-6"
              style={{ fontFamily: currentTheme.headerFont }}
            >
              {editingTeam ? 'EDIT TEAM' : 'CREATE NEW TEAM'}
            </h2>
            <TeamForm
              team={editingTeam || undefined}
              onSave={handleFormClose}
              onCancel={handleFormClose}
            />
          </div>
        </div>
      )}

      {/* Teams Grid */}
      {teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => (
            <div key={team.id} className="relative">
              <TeamCard
                team={team}
                onEdit={() => handleEdit(team)}
                onDelete={() => handleDelete(team.id)}
              />
              {/* Delete Confirmation Overlay */}
              {deleteConfirm === team.id && (
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/80 backdrop-blur-sm"
                  style={{ borderRadius: currentTheme.borderRadius }}
                >
                  <div className="text-center p-4">
                    <p className="text-white mb-3">Delete {team.name}?</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-4 py-2 rounded-lg bg-white/20 text-white text-sm"
                        style={{ borderRadius: currentTheme.borderRadius }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(team.id)}
                        className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium"
                        style={{ borderRadius: currentTheme.borderRadius }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div
          className="text-center py-20 rounded-xl"
          style={{ backgroundColor: currentTheme.secondaryBackground }}
        >
          <div className="text-6xl mb-4">👥</div>
          <h2
            className="text-xl font-bold mb-2"
            style={{ fontFamily: currentTheme.headerFont }}
          >
            NO TEAMS YET
          </h2>
          <p className="mb-6" style={{ color: currentTheme.textSecondary }}>
            Create your first team to get started
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-6 py-3 rounded-lg font-bold transition-all hover:scale-105"
            style={{
              backgroundColor: currentTheme.accentColor,
              color: '#fff',
              borderRadius: currentTheme.borderRadius,
            }}
          >
            Create Team
          </button>
        </div>
      )}
    </div>
  );
}

