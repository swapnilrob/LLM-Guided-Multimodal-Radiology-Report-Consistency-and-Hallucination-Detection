import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, LogIn, Copy, Check, Loader2, AlertCircle,
  ChevronRight, Crown, UserMinus, LogOut, Clock, Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import SectionHeader from '../components/common/SectionHeader';
import {
  getMyTeams, createTeam, joinTeam, getTeamAnalyses, removeMember, leaveTeam,
} from '../api/teamApi';

export default function TeamsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create team state
  const [showCreate, setShowCreate] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [creating, setCreating] = useState(false);

  // Join team state
  const [showJoin, setShowJoin] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  // Selected team state
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamAnalyses, setTeamAnalyses] = useState([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchTeams = async () => {
    try {
      const data = await getMyTeams();
      setTeams(data.teams || []);
    } catch (err) {
      setError('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setCreating(true);
    setError('');
    try {
      await createTeam(newTeamName.trim());
      setNewTeamName('');
      setShowCreate(false);
      await fetchTeams();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setJoining(true);
    setError('');
    try {
      await joinTeam(inviteCode.trim());
      setInviteCode('');
      setShowJoin(false);
      await fetchTeams();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join team');
    } finally {
      setJoining(false);
    }
  };

  const handleSelectTeam = async (team) => {
    if (selectedTeam?._id === team._id) {
      setSelectedTeam(null);
      setTeamAnalyses([]);
      return;
    }
    setSelectedTeam(team);
    setLoadingAnalyses(true);
    try {
      const data = await getTeamAnalyses(team._id);
      setTeamAnalyses(data.analyses || []);
    } catch {
      setTeamAnalyses([]);
    } finally {
      setLoadingAnalyses(false);
    }
  };

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setCopiedCode(false);
    }
  };

  const handleRemoveMember = async (teamId, userId) => {
    if (!window.confirm('Remove this member from the team?')) return;
    try {
      await removeMember(teamId, userId);
      await fetchTeams();
      if (selectedTeam?._id === teamId) {
        const updated = teams.find((t) => t._id === teamId);
        if (updated) setSelectedTeam(updated);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleLeave = async (teamId) => {
    if (!window.confirm('Leave this team?')) return;
    try {
      await leaveTeam(teamId);
      setSelectedTeam(null);
      setTeamAnalyses([]);
      await fetchTeams();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to leave team');
    }
  };

  const getUserPermission = (team) => {
    const membership = team.members?.find(
      (m) => (m.user?._id || m.user) === user?._id || m.user?._id?.toString() === user?._id
    );
    return membership?.permissionLevel || 'member';
  };

  const getScoreColor = (score) => {
    if (score >= 66) return 'text-status-verified';
    if (score >= 36) return 'text-status-mismatch';
    return 'text-status-hallucinated';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-accent-teal animate-spin mb-3" />
          <p className="text-sm text-text-medium">Loading teams...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-accent-teal" />
            <h1 className="text-lg font-bold text-text-dark">Team Workspaces</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowJoin(!showJoin); setShowCreate(false); }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider border border-border-light rounded text-text-medium hover:text-accent-teal hover:border-accent-teal transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              Join Team
            </button>
            <button
              onClick={() => { setShowCreate(!showCreate); setShowJoin(false); }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider bg-chrome-section text-white rounded hover:bg-chrome-section-alt transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Team
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-status-hallucinated">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Create Team Form */}
        {showCreate && (
          <div className="bg-panel border border-border-light rounded p-4">
            <h3 className="text-sm font-semibold text-text-dark mb-3">Create a New Team</h3>
            <form onSubmit={handleCreate} className="flex gap-2">
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Team name (e.g., Radiology Dept A)"
                className="flex-1 px-3 py-2 text-sm border border-border-light rounded bg-input-bg text-text-dark placeholder-text-light focus:outline-none focus:border-border-focus"
              />
              <button
                type="submit"
                disabled={creating || !newTeamName.trim()}
                className="px-4 py-2 text-xs font-semibold uppercase bg-chrome-section text-white rounded hover:bg-chrome-section-alt transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Create
              </button>
            </form>
          </div>
        )}

        {/* Join Team Form */}
        {showJoin && (
          <div className="bg-panel border border-border-light rounded p-4">
            <h3 className="text-sm font-semibold text-text-dark mb-3">Join a Team</h3>
            <form onSubmit={handleJoin} className="flex gap-2">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Paste invite code"
                className="flex-1 px-3 py-2 text-sm border border-border-light rounded bg-input-bg text-text-dark placeholder-text-light focus:outline-none focus:border-border-focus font-mono"
              />
              <button
                type="submit"
                disabled={joining || !inviteCode.trim()}
                className="px-4 py-2 text-xs font-semibold uppercase bg-chrome-section text-white rounded hover:bg-chrome-section-alt transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {joining && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Join
              </button>
            </form>
          </div>
        )}

        {/* Teams Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Team List (left) */}
          <div className="lg:col-span-1">
            <div className="bg-panel border border-border-light rounded overflow-hidden">
              <SectionHeader title="YOUR TEAMS" />
              {teams.length === 0 ? (
                <div className="p-6 text-center">
                  <Users className="w-8 h-8 text-text-light mx-auto mb-2" />
                  <p className="text-sm text-text-medium">No teams yet</p>
                  <p className="text-xs text-text-light mt-1">Create a team or join one with an invite code</p>
                </div>
              ) : (
                <div className="divide-y divide-border-light">
                  {teams.map((team) => (
                    <div
                      key={team._id}
                      onClick={() => handleSelectTeam(team)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                        selectedTeam?._id === team._id
                          ? 'bg-row-selected border-l-[3px] border-l-accent-teal'
                          : 'hover:bg-row-hover'
                      }`}
                    >
                      <div className="w-8 h-8 rounded bg-chrome-section flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">
                          {team.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-dark truncate">{team.name}</p>
                        <p className="text-xs text-text-light">
                          {team.members?.length || 0} member{(team.members?.length || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-light shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Team Detail (right) */}
          <div className="lg:col-span-2 space-y-3">
            {selectedTeam ? (
              <>
                {/* Team Info */}
                <div className="bg-panel border border-border-light rounded overflow-hidden">
                  <SectionHeader title={selectedTeam.name.toUpperCase()} />
                  <div className="p-4 space-y-3">
                    {/* Invite Code */}
                    <div className="flex items-center justify-between p-3 bg-input-bg rounded border border-border-light">
                      <div>
                        <p className="text-xs font-semibold text-text-medium uppercase tracking-wide">Invite Code</p>
                        <p className="text-sm font-mono text-text-dark mt-0.5">{selectedTeam.inviteCode}</p>
                      </div>
                      <button
                        onClick={() => handleCopyCode(selectedTeam.inviteCode)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-accent-teal text-white rounded hover:bg-chrome-section-alt transition-colors"
                      >
                        {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedCode ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    {/* Members */}
                    <div>
                      <p className="text-xs font-semibold text-text-medium uppercase tracking-wide mb-2">Members</p>
                      <div className="divide-y divide-border-light border border-border-light rounded">
                        {selectedTeam.members?.map((member) => {
                          const memberUser = member.user;
                          const isAdmin = member.permissionLevel === 'admin';
                          const isCurrentUser = memberUser?._id === user?._id;
                          const currentUserIsAdmin = getUserPermission(selectedTeam) === 'admin';

                          return (
                            <div key={memberUser?._id || member._id} className="flex items-center gap-3 px-3 py-2.5">
                              <div className="w-7 h-7 rounded-full bg-chrome-dark flex items-center justify-center shrink-0">
                                <span className="text-white text-xs font-bold">
                                  {(memberUser?.fullName || '?').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-text-dark truncate">
                                  {memberUser?.fullName || 'Unknown'}{isCurrentUser ? ' (You)' : ''}
                                </p>
                                <p className="text-xs text-text-light">{memberUser?.email}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {isAdmin && (
                                  <span className="flex items-center gap-1 text-xs text-accent-teal">
                                    <Crown className="w-3 h-3" /> Admin
                                  </span>
                                )}
                                {!isAdmin && currentUserIsAdmin && !isCurrentUser && (
                                  <button
                                    onClick={() => handleRemoveMember(selectedTeam._id, memberUser?._id)}
                                    className="p-1 text-text-light hover:text-status-hallucinated transition-colors"
                                    title="Remove member"
                                  >
                                    <UserMinus className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Leave button */}
                    {getUserPermission(selectedTeam) !== 'admin' && (
                      <button
                        onClick={() => handleLeave(selectedTeam._id)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-status-hallucinated text-status-hallucinated rounded hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Leave Team
                      </button>
                    )}
                  </div>
                </div>

                {/* Team Analyses */}
                <div className="bg-panel border border-border-light rounded overflow-hidden">
                  <SectionHeader title="TEAM ANALYSES" />
                  {loadingAnalyses ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 text-accent-teal animate-spin" />
                    </div>
                  ) : teamAnalyses.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-sm text-text-light">No analyses from team members yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border-light">
                      {teamAnalyses.map((a) => (
                        <div
                          key={a._id}
                          onClick={() => navigate(`/results/${a._id}`)}
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-row-hover transition-colors"
                        >
                          <div className="w-10 h-10 rounded bg-input-bg border border-border-light overflow-hidden shrink-0">
                            {a.imageUrl ? (
                              <img src={a.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-text-light text-xs">N/A</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-text-dark truncate">
                              {a.user?.fullName || 'Unknown'}
                            </p>
                            <p className="text-xs text-text-light flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(a.createdAt).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                              })}
                              <span className="mx-1">·</span>
                              {a.claimCount} claims
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-sm font-bold ${getScoreColor(a.reliabilityScore)}`}>
                              {a.reliabilityScore ?? '—'}%
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full uppercase ${
                              a.status === 'complete'
                                ? 'bg-green-100 text-status-verified'
                                : a.status === 'failed'
                                ? 'bg-red-100 text-status-hallucinated'
                                : 'bg-yellow-100 text-status-uncertain'
                            }`}>
                              {a.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-panel border border-border-light rounded p-8 text-center">
                <Shield className="w-10 h-10 text-text-light mx-auto mb-3" />
                <p className="text-sm text-text-medium">Select a team to view details and shared analyses</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}